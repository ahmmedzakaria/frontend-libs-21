import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, switchMap, of, throwError, from, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {ActionTypes, ApiEndpoint, ApiService, AuthConfig, AuthResponse, LoginMethod, LoginStatusResponse} from "@nexacore/api-common";
import {jwtDecode} from "jwt-decode";
import {LayoutService, SidebarMenuService} from "@nexacore/layout";
import {Router} from "@angular/router";



interface DecodedToken {
    roles: string[];
    sub: string;
    exp: number;
    iat: number;
}

// apiPath is relative to loginUrl (/api/v1/auth) — do not repeat "auth/" here.
const AUTHENTICATE_ENDPOINT: ApiEndpoint = {
    apiPath: 'authenticate',
    actionType: ActionTypes.LOGIN,
};

const SSO_AUTHENTICATE_ENDPOINT: ApiEndpoint = {
    apiPath: 'sso/authenticate',
    actionType: ActionTypes.LOGIN,
};

const AUTH_CONFIG_ENDPOINT: ApiEndpoint = {
    apiPath: 'config',
    actionType: ActionTypes.LOGIN,
};

const LOGOUT_ENDPOINT: ApiEndpoint = {
    apiPath: 'logout',
    actionType: ActionTypes.LOGIN,
};

const SESSION_STATUS_ENDPOINT: ApiEndpoint = {
    apiPath: 'session-status',
    actionType: ActionTypes.LOGIN,
};

const LOGIN_STATUS_ENDPOINT: ApiEndpoint = {
    apiPath: 'login-status',
    actionType: ActionTypes.LOGIN,
};

const AUTO_SSO_SUPPRESS_UNTIL_KEY = 'auto_sso_suppress_until';
const AUTO_SSO_SUPPRESS_MS = 120000;
const LAST_LOGOUT_USERNAME_KEY = 'last_logout_username';
const LOGIN_METHOD_KEY = 'loginMethod';

interface KeycloakTokenResponse {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject = new BehaviorSubject<DecodedToken | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();
    private logoutTimerId: ReturnType<typeof setTimeout> | null = null;
    private sessionMonitorTimerId: ReturnType<typeof setInterval> | null = null;

    constructor(private http: HttpClient,
                private apiService: ApiService,
                private layoutService: LayoutService,
                private sidebarMenuService: SidebarMenuService,
                private router: Router,
    ) {
        const token = this.getToken();
        if (token) {
            if (this.isTokenExpired(token)) {
                this.logout(false);
            } else {
                this.decodeAndSetUser(token);
            }
        }
    }

    login(username: string, password: string) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        this.clearApplicationContextStorage();

        return this.apiService.post<AuthResponse | { data: AuthResponse }>(AUTHENTICATE_ENDPOINT, { username, password })
            .pipe(
                map(response => this.unwrapAuthResponse(response)),
                switchMap(res => {
                    if (res?.accessToken) {
                        localStorage.setItem('token', res.accessToken);
                        localStorage.setItem('refreshToken', res.refreshToken || '');
                        localStorage.setItem(LOGIN_METHOD_KEY, 'PASSWORD');
                        this.decodeAndSetUser(res.accessToken);
                        return this.sidebarMenuService.loadApplicationContext().pipe(
                            catchError(error => {
                                console.error('Application context load failed after login', error);
                                this.clearApplicationContextStorage();
                                return of({ menus: [], privilegeCodes: [] });
                            })
                        );
                    }
                    return throwError(() => new Error('Authentication response does not contain access token'));
                })
            );
    }

    loadAuthConfig(): Observable<AuthConfig> {
        return this.apiService.post<AuthConfig | { data: AuthConfig }>(AUTH_CONFIG_ENDPOINT, {})
            .pipe(
                map(response => this.unwrapAuthConfig(response)),
                map(config => {
                    const normalizedConfig = this.normalizeAuthConfig(config);
                    localStorage.setItem('authConfig', JSON.stringify(normalizedConfig));
                    return normalizedConfig;
                })
            );
    }

    loginWithSso(
        returnUrl: string = window.location.pathname + window.location.search,
        forceLoginPrompt: boolean = false
    ): Observable<void> {
        this.clearAuthStorage();
        localStorage.removeItem('keycloakIdToken');
        sessionStorage.removeItem(AUTO_SSO_SUPPRESS_UNTIL_KEY);
        sessionStorage.setItem('post_login_url', returnUrl || '/');

        return this.loadAuthConfig().pipe(
            switchMap(config => from(this.redirectToKeycloak(config, forceLoginPrompt)))
        );
    }

    loginWithSsoAfterLogout(returnUrl: string = '/'): Observable<void> {
        const username = sessionStorage.getItem(LAST_LOGOUT_USERNAME_KEY);

        if (!username) {
            return this.loginWithSso(returnUrl, true);
        }

        return this.isUserLoggedIn(username).pipe(
            catchError(() => of(false)),
            switchMap(loggedIn => this.loginWithSso(returnUrl, !loggedIn))
        );
    }

    handleSsoCallback(callbackUrl: string = window.location.href): Observable<void> {
        const url = new URL(callbackUrl);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const storedState = sessionStorage.getItem('kc_state');
        const verifier = sessionStorage.getItem('kc_code_verifier');

        if (!code || !state || !storedState || state !== storedState || !verifier) {
            return throwError(() => new Error('Invalid SSO callback'));
        }

        const config$ = this.getStoredAuthConfig()
            ? of(this.getStoredAuthConfig() as AuthConfig)
            : this.loadAuthConfig();

        return config$.pipe(
            switchMap(config => this.exchangeCodeForToken(config, code, verifier)),
            switchMap(tokenResponse => this.apiService.post<AuthResponse | { data: AuthResponse }>(
                SSO_AUTHENTICATE_ENDPOINT,
                { accessToken: tokenResponse.access_token }
            ).pipe(
                map(response => ({ authResponse: this.unwrapAuthResponse(response), tokenResponse }))
            )),
            switchMap(({ authResponse, tokenResponse }) => {
                this.clearAuthStorage();
                localStorage.setItem('token', authResponse.accessToken);
                localStorage.setItem('refreshToken', authResponse.refreshToken || '');
                localStorage.setItem('keycloakIdToken', tokenResponse.id_token || '');
                localStorage.setItem(LOGIN_METHOD_KEY, 'SSO');
                this.decodeAndSetUser(authResponse.accessToken);
                this.clearSsoSessionStorage();

                return this.sidebarMenuService.loadApplicationContext().pipe(
                    map(() => undefined),
                    catchError(error => {
                        console.error('Application context load failed after SSO login', error);
                        this.clearApplicationContextStorage();
                        return of(undefined);
                    })
                );
            })
        );
    }

    logout(redirectToLogin: boolean = true, notifyServer: boolean = true) {
        const loginMethod = localStorage.getItem(LOGIN_METHOD_KEY);
        const authConfig = this.getStoredAuthConfig();
        const keycloakIdToken = localStorage.getItem('keycloakIdToken');

        if (notifyServer && this.getToken()) {
            this.apiService.post<void>(LOGOUT_ENDPOINT, {}).subscribe({
                next: () => this.completeLogout(redirectToLogin, loginMethod, authConfig, keycloakIdToken),
                error: () => this.completeLogout(redirectToLogin, loginMethod, authConfig, keycloakIdToken)
            });
            return;
        }

        this.completeLogout(redirectToLogin, loginMethod, authConfig, keycloakIdToken);
    }

    private completeLogout(
        redirectToLogin: boolean,
        loginMethod: string | null,
        authConfig: AuthConfig | null,
        keycloakIdToken: string | null
    ) {
        const username = this.getCurrentUsername();
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        this.clearApplicationContextStorage();
        localStorage.removeItem('keycloakIdToken');
        localStorage.removeItem(LOGIN_METHOD_KEY);
        if (redirectToLogin && loginMethod === 'SSO') {
            if (username) {
                sessionStorage.setItem(LAST_LOGOUT_USERNAME_KEY, username);
            }
            sessionStorage.setItem(
                AUTO_SSO_SUPPRESS_UNTIL_KEY,
                String(Date.now() + AUTO_SSO_SUPPRESS_MS)
            );
        }
        this.clearLogoutTimer();
        this.clearSessionMonitor();
        this.currentUserSubject.next(null);
        this.layoutService.setPublicLayout();

        if (redirectToLogin && loginMethod === 'SSO' && authConfig?.issuerUri) {
            const logoutUrl = new URL(`${authConfig.issuerUri}/protocol/openid-connect/logout`);
            logoutUrl.searchParams.set('post_logout_redirect_uri', `${window.location.origin}/login`);
            if (authConfig.clientId) {
                logoutUrl.searchParams.set('client_id', authConfig.clientId);
            }
            if (keycloakIdToken) {
                logoutUrl.searchParams.set('id_token_hint', keycloakIdToken);
            }
            window.location.href = logoutUrl.toString();
            return;
        }

        if (redirectToLogin) {
            this.router.navigate(['/login']);
        }
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    private decodeAndSetUser(token: string) {
        try {
            const decoded: DecodedToken = jwtDecode(token);
            console.log('decoded',decoded)
            this.currentUserSubject.next(decoded);
            sessionStorage.removeItem(LAST_LOGOUT_USERNAME_KEY);
            this.scheduleAutoLogout(decoded.exp);
            this.startSessionMonitor();
        } catch (err) {
            console.error('JWT Decode failed', err);
            this.logout(true, false);
        }
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        if (this.isTokenExpired(token)) {
            this.logout(true, false);
            return false;
        }

        return true;
    }

    handleSessionExpired(): void {
        this.logout(true, false);
    }

    isAutoSsoSuppressed(): boolean {
        const suppressUntil = Number(sessionStorage.getItem(AUTO_SSO_SUPPRESS_UNTIL_KEY) || 0);
        if (suppressUntil <= Date.now()) {
            sessionStorage.removeItem(AUTO_SSO_SUPPRESS_UNTIL_KEY);
            return false;
        }

        return true;
    }

    isLoginMethodEnabled(config: AuthConfig | null | undefined, method: LoginMethod): boolean {
        return !!config?.enabledLoginMethods?.includes(method);
    }

    isSsoOnly(config: AuthConfig | null | undefined): boolean {
        return this.isLoginMethodEnabled(config, 'SSO') && !this.isLoginMethodEnabled(config, 'PASSWORD');
    }

    consumePostLoginUrl(): string {
        const returnUrl = sessionStorage.getItem('post_login_url') || '/';
        sessionStorage.removeItem('post_login_url');
        return returnUrl;
    }

    hasRole(role: string): boolean {
        return this.currentUserSubject.value?.roles?.includes(role) ?? false;
    }

    hasPrivilege(privilegeCode: string): boolean {
        const privilegeCodes = JSON.parse(localStorage.getItem('privilegeCodes') || '[]') as string[];
        return privilegeCodes.includes(privilegeCode);
    }

    private isTokenExpired(token: string): boolean {
        try {
            const decoded: DecodedToken = jwtDecode(token);
            return decoded.exp * 1000 <= Date.now();
        } catch {
            return true;
        }
    }

    private scheduleAutoLogout(expirationInSeconds: number): void {
        this.clearLogoutTimer();

        const remainingMs = expirationInSeconds * 1000 - Date.now();
        if (remainingMs <= 0) {
            this.logout();
            return;
        }

        this.logoutTimerId = setTimeout(() => {
            this.logout(true, false);
        }, remainingMs);
    }

    private clearLogoutTimer(): void {
        if (this.logoutTimerId) {
            clearTimeout(this.logoutTimerId);
            this.logoutTimerId = null;
        }
    }

    private startSessionMonitor(): void {
        this.clearSessionMonitor();

        this.sessionMonitorTimerId = setInterval(() => {
            if (!this.getToken()) {
                this.clearSessionMonitor();
                return;
            }

            this.apiService.post<void>(SESSION_STATUS_ENDPOINT, {}, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'X-Silent': 'true'
                })
            }).subscribe({
                error: () => this.logout(true, false)
            });
        }, 15000);
    }

    private clearSessionMonitor(): void {
        if (this.sessionMonitorTimerId) {
            clearInterval(this.sessionMonitorTimerId);
            this.sessionMonitorTimerId = null;
        }
    }

    private unwrapAuthResponse(response: AuthResponse | { data: AuthResponse }): AuthResponse {
        return (response as { data: AuthResponse })?.data || response as AuthResponse;
    }

    private unwrapAuthConfig(response: AuthConfig | { data: AuthConfig }): AuthConfig {
        return (response as { data: AuthConfig })?.data || response as AuthConfig;
    }

    private normalizeAuthConfig(config: AuthConfig): AuthConfig {
        return {
            ...config,
            enabledLoginMethods: config.enabledLoginMethods || [],
            enabledRegistrationCredentialModels: config.enabledRegistrationCredentialModels || [],
            loginIdentifierTypes: config.loginIdentifierTypes || [],
            clientId: this.resolveFrontendClientId(config),
            redirectUri: `${window.location.origin}/sso/callback`
        };
    }

    private resolveFrontendClientId(config: AuthConfig): string | undefined {
        if (window.location.port === '4300') {
            return 'privilege-frontend';
        }

        return config.clientId;
    }

    private async redirectToKeycloak(config: AuthConfig, forceLoginPrompt: boolean = false): Promise<void> {
        if (!this.isLoginMethodEnabled(config, 'SSO') || !config.issuerUri || !config.clientId || !config.redirectUri) {
            throw new Error('SSO is not configured');
        }

        const verifier = this.randomString(64);
        const challenge = await this.pkceChallenge(verifier);
        const state = this.randomString(32);

        sessionStorage.setItem('kc_code_verifier', verifier);
        sessionStorage.setItem('kc_state', state);
        localStorage.setItem('authConfig', JSON.stringify(config));

        const authorizationUrl = new URL(`${config.issuerUri}/protocol/openid-connect/auth`);
        authorizationUrl.searchParams.set('client_id', config.clientId);
        authorizationUrl.searchParams.set('redirect_uri', config.redirectUri);
        authorizationUrl.searchParams.set('response_type', 'code');
        authorizationUrl.searchParams.set('scope', 'openid profile email');
        authorizationUrl.searchParams.set('state', state);
        authorizationUrl.searchParams.set('code_challenge', challenge);
        authorizationUrl.searchParams.set('code_challenge_method', 'S256');
        if (forceLoginPrompt) {
            authorizationUrl.searchParams.set('prompt', 'login');
        }

        window.location.href = authorizationUrl.toString();
    }

    private exchangeCodeForToken(config: AuthConfig, code: string, verifier: string): Observable<KeycloakTokenResponse> {
        if (!config.issuerUri || !config.clientId || !config.redirectUri) {
            return throwError(() => new Error('SSO token exchange is not configured'));
        }

        const body = new URLSearchParams();
        body.set('grant_type', 'authorization_code');
        body.set('client_id', config.clientId);
        body.set('redirect_uri', config.redirectUri);
        body.set('code', code);
        body.set('code_verifier', verifier);

        return this.http.post<KeycloakTokenResponse>(
            `${config.issuerUri}/protocol/openid-connect/token`,
            body.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
    }

    private getStoredAuthConfig(): AuthConfig | null {
        const rawConfig = localStorage.getItem('authConfig');
        if (!rawConfig) {
            return null;
        }

        try {
            return JSON.parse(rawConfig) as AuthConfig;
        } catch {
            return null;
        }
    }

    private clearAuthStorage(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        this.clearApplicationContextStorage();
    }

    private clearApplicationContextStorage(): void {
        localStorage.removeItem('clientCode');
        localStorage.removeItem('clientType');
        localStorage.removeItem('privilegeCodes');
        localStorage.removeItem('enabledModules');
        localStorage.removeItem('enabledSubmodules');
        localStorage.removeItem('enabledFeatures');
        localStorage.removeItem('sidebarMenus');
    }

    private clearSsoSessionStorage(): void {
        sessionStorage.removeItem('kc_code_verifier');
        sessionStorage.removeItem('kc_state');
    }

    private isUserLoggedIn(username: string): Observable<boolean> {
        return this.apiService.post<LoginStatusResponse | { data: LoginStatusResponse }>(
            LOGIN_STATUS_ENDPOINT,
            { username }
        ).pipe(
            map(response => ((response as { data: LoginStatusResponse })?.data || response as LoginStatusResponse).loggedIn)
        );
    }

    private getCurrentUsername(): string | null {
        if (this.currentUserSubject.value?.sub) {
            return this.currentUserSubject.value.sub;
        }

        const token = this.getToken();
        if (!token) {
            return null;
        }

        try {
            return jwtDecode<DecodedToken>(token).sub || null;
        } catch {
            return null;
        }
    }

    private randomString(length: number): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = new Uint8Array(length);
        crypto.getRandomValues(values);
        return Array.from(values).map(value => charset[value % charset.length]).join('');
    }

    private async pkceChallenge(verifier: string): Promise<string> {
        const data = new TextEncoder().encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return this.base64UrlEncode(new Uint8Array(digest));
    }

    private base64UrlEncode(bytes: Uint8Array): string {
        const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
}
