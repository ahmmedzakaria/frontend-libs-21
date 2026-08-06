import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { ActionTypes, ApiEndpoint, ApiService } from '../api-common/index';
import { BackendLayoutConfig, NavTreeItem } from './core/models/layout-config.model';

export interface ApplicationContext {
    clientCode?: string;
    clientType?: string;
    privilegeCodes: string[];
    routePolicies: RoutePrivilegePolicy[];
    uiPolicies: UiPrivilegePolicy[];
    layout?: BackendLayoutConfig;
}

export interface RoutePrivilegePolicy {
    routeUrl: string;
    matchMode: 'ANY' | 'ALL';
    privilegeCodes: string[];
}

export interface UiPrivilegePolicy {
    actionCode: string;
    matchMode: 'ANY' | 'ALL';
    privilegeCodes: string[];
}

interface WrappedApplicationContext {
    data?: ApplicationContext;
}

const PRIVILEGE_CONTEXT_ENDPOINT: ApiEndpoint = {
    apiPath: 'system/privilege/context',
    actionType: ActionTypes.AUTH,
};

@Injectable({ providedIn: 'root' })
export class ApplicationContextService {
    /** Reactive copy of the effective layout. Unlike localStorage, this also
     * updates services that were instantiated before login completed. */
    readonly layoutConfig = signal<BackendLayoutConfig | null>(this.readCachedLayoutConfig());
    readonly routePolicies = signal<RoutePrivilegePolicy[]>(this.readCachedRoutePolicies());
    readonly uiPolicies = signal<UiPrivilegePolicy[]>(this.readCachedUiPolicies());

    /** True once a live `load()` call has completed this session (success or
     * failure) — distinct from `layoutConfig` being non-null, which can just
     * mean a (possibly stale) localStorage cache was seeded synchronously on
     * construction. Guards that need to know "has a real network round-trip
     * happened yet" (e.g. `routePrivilegeGuard`'s fail-closed check) should
     * read this instead of inferring readiness from cache presence alone. */
    readonly loaded = signal(
        this.readCachedLayoutConfig() !== null
        && localStorage.getItem('routePolicies') !== null
        && localStorage.getItem('uiPolicies') !== null
    );

    private inFlight: Observable<ApplicationContext> | null = null;

    constructor(private apiService: ApiService) {}

    load(): Observable<ApplicationContext> {
        return this.apiService.post<ApplicationContext | WrappedApplicationContext>(PRIVILEGE_CONTEXT_ENDPOINT, {}).pipe(
            map(response => this.unwrap(response)),
            tap(context => {
                localStorage.setItem('clientCode', context.clientCode || '');
                localStorage.setItem('clientType', context.clientType || '');
                localStorage.setItem('privilegeCodes', JSON.stringify(context.privilegeCodes));
                localStorage.setItem('routePolicies', JSON.stringify(context.routePolicies));
                localStorage.setItem('uiPolicies', JSON.stringify(context.uiPolicies));
                localStorage.setItem('layoutConfig', JSON.stringify(context.layout || null));
                this.setLayoutConfig(context.layout ?? null);
                this.routePolicies.set(context.routePolicies);
                this.uiPolicies.set(context.uiPolicies);
                this.loaded.set(true);
            })
        );
    }

    /**
     * Guarantees `getCachedNavTree()`/`hasPrivilege()`-backed checks see real
     * data before a guard evaluates them, without re-fetching on every route
     * activation. Concurrent callers (e.g. multiple `canActivateChild`
     * evaluations firing off one navigation) share the same in-flight
     * request via `shareReplay`.
     */
    ensureLoaded(): Observable<ApplicationContext | null> {
        if (this.loaded()) {
            return of(null);
        }
        if (!this.inFlight) {
            this.inFlight = this.load().pipe(shareReplay({ bufferSize: 1, refCount: false }));
        }
        return this.inFlight;
    }

    getCachedNavTree(): NavTreeItem[] {
        return this.getCachedLayoutConfig()?.navTree ?? [];
    }

    getCachedRoutePolicies(): RoutePrivilegePolicy[] {
        return this.routePolicies();
    }

    getCachedLayoutConfig(): BackendLayoutConfig | null {
        return this.layoutConfig();
    }

    setLayoutConfig(config: BackendLayoutConfig | null): void {
        this.layoutConfig.set(config);
    }

    /**
     * Resets in-memory + cached context on login/logout so the next
     * `ensureLoaded()` call always does a fresh network round-trip instead of
     * treating a previous (possibly different-user) session's cache as
     * already loaded — call alongside `localStorage.removeItem('layoutConfig')`.
     */
    clear(): void {
        this.layoutConfig.set(null);
        this.routePolicies.set([]);
        this.uiPolicies.set([]);
        localStorage.removeItem('routePolicies');
        localStorage.removeItem('uiPolicies');
        this.loaded.set(false);
        this.inFlight = null;
    }

    private readCachedLayoutConfig(): BackendLayoutConfig | null {
        const raw = localStorage.getItem('layoutConfig');
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as BackendLayoutConfig;
        } catch {
            return null;
        }
    }

    private unwrap(response: ApplicationContext | WrappedApplicationContext): ApplicationContext {
        const context = (response as WrappedApplicationContext)?.data || response as ApplicationContext;
        return {
            clientCode: context?.clientCode || '',
            clientType: context?.clientType || '',
            privilegeCodes: context?.privilegeCodes || [],
            routePolicies: context?.routePolicies || [],
            uiPolicies: context?.uiPolicies || [],
            layout: context?.layout,
        };
    }

    private readCachedRoutePolicies(): RoutePrivilegePolicy[] {
        const raw = localStorage.getItem('routePolicies');
        if (!raw) {
            return [];
        }
        try {
            const policies = JSON.parse(raw);
            return Array.isArray(policies) ? policies as RoutePrivilegePolicy[] : [];
        } catch {
            return [];
        }
    }

    private readCachedUiPolicies(): UiPrivilegePolicy[] {
        const raw = localStorage.getItem('uiPolicies');
        if (!raw) {
            return [];
        }
        try {
            const policies = JSON.parse(raw);
            return Array.isArray(policies) ? policies as UiPrivilegePolicy[] : [];
        } catch {
            return [];
        }
    }
}
