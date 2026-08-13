import { Injectable, computed, signal } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';
import { ActionTypes, ApiEndpoint, ApiService } from '../api-common/index';
import { BackendLayoutConfig, NavTreeItem } from './core/models/layout-config.model';

export interface EffectiveScopeAssignment {
    tenantId: number;
    businessId: number | null;
    branchId: number | null;
}

export interface EffectiveTenantContext {
    tenantId: number;
    tenantCode: string;
    hostname: string;
    scopeAssignments: EffectiveScopeAssignment[];
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

export interface ApplicationAuthorizationContext {
    clientCode: string;
    clientType: string;
    /** Required when the Phase 3 backend contract is deployed. */
    effectiveTenant?: EffectiveTenantContext;
    privilegeCodes: string[];
    routePolicies: RoutePrivilegePolicy[];
    uiPolicies: UiPrivilegePolicy[];
    authorizationVersion?: string;
    layout?: BackendLayoutConfig;
}

/** Backward-compatible public name used by existing layout consumers. */
export type ApplicationContext = ApplicationAuthorizationContext;

interface WrappedApplicationContext {
    data?: unknown;
}

const PRIVILEGE_CONTEXT_ENDPOINT: ApiEndpoint = {
    apiPath: 'system/privilege/context',
    actionType: ActionTypes.AUTH,
};

const STORAGE_KEYS = [
    'clientCode', 'clientType', 'privilegeCodes', 'routePolicies', 'uiPolicies',
    'layoutConfig', 'effectiveTenant', 'authorizationVersion'
] as const;

@Injectable({ providedIn: 'root' })
export class ApplicationContextService {
    private readonly liveContext = signal<ApplicationAuthorizationContext | null>(null);

    readonly context = this.liveContext.asReadonly();
    readonly privilegeCodes = computed(() => this.liveContext()?.privilegeCodes ?? []);
    readonly effectiveTenant = computed(() => this.liveContext()?.effectiveTenant ?? null);
    readonly layoutConfig = computed(() => this.liveContext()?.layout ?? null);
    readonly routePolicies = computed(() => this.liveContext()?.routePolicies ?? []);
    readonly uiPolicies = computed(() => this.liveContext()?.uiPolicies ?? []);
    readonly loaded = computed(() => this.liveContext() !== null);

    private inFlight: Observable<ApplicationAuthorizationContext> | null = null;

    constructor(private readonly apiService: ApiService) {}

    load(): Observable<ApplicationAuthorizationContext> {
        return this.refresh();
    }

    ensureLoaded(): Observable<ApplicationAuthorizationContext> {
        return this.liveContext() ? new Observable(subscriber => {
            subscriber.next(this.liveContext()!);
            subscriber.complete();
        }) : this.singleFlightRequest();
    }

    refresh(): Observable<ApplicationAuthorizationContext> {
        this.liveContext.set(null);
        return this.singleFlightRequest();
    }

    hasPrivilege(code: string): boolean {
        const normalized = code.trim();
        return normalized.length > 0 && this.privilegeCodes().includes(normalized);
    }

    getCachedNavTree(): NavTreeItem[] {
        return this.layoutConfig()?.navTree ?? [];
    }

    getCachedRoutePolicies(): RoutePrivilegePolicy[] {
        return this.routePolicies();
    }

    getCachedLayoutConfig(): BackendLayoutConfig | null {
        return this.layoutConfig();
    }

    setLayoutConfig(config: BackendLayoutConfig | null): void {
        const current = this.liveContext();
        if (current) this.liveContext.set({ ...current, layout: config ?? undefined });
    }

    clear(): void {
        this.liveContext.set(null);
        this.inFlight = null;
        STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    }

    private singleFlightRequest(): Observable<ApplicationAuthorizationContext> {
        if (!this.inFlight) {
            this.inFlight = this.requestContext().pipe(
                finalize(() => this.inFlight = null),
                shareReplay({ bufferSize: 1, refCount: false })
            );
        }
        return this.inFlight;
    }

    private requestContext(): Observable<ApplicationAuthorizationContext> {
        return this.apiService.post<unknown>(PRIVILEGE_CONTEXT_ENDPOINT, {}).pipe(
            map(response => this.validateAndNormalize(this.unwrap(response))),
            tap(context => {
                this.liveContext.set(context);
                this.persist(context);
            })
        );
    }

    private unwrap(response: unknown): unknown {
        if (this.isRecord(response) && 'data' in response) {
            return (response as WrappedApplicationContext).data;
        }
        return response;
    }

    private validateAndNormalize(value: unknown): ApplicationAuthorizationContext {
        if (!this.isRecord(value)
            || !this.isNonBlankString(value['clientCode'])
            || !this.isNonBlankString(value['clientType'])
            || !this.isStringArray(value['privilegeCodes'])
            || !this.isRoutePolicies(value['routePolicies'])
            || !this.isUiPolicies(value['uiPolicies'])) {
            this.clear();
            throw new Error('Authorization context is missing or malformed');
        }

        const effectiveTenant = value['effectiveTenant'] == null
            ? undefined
            : this.normalizeEffectiveTenant(value['effectiveTenant']);

        return {
            clientCode: value['clientCode'].trim(),
            clientType: value['clientType'].trim(),
            effectiveTenant,
            privilegeCodes: [...new Set(value['privilegeCodes'])],
            routePolicies: value['routePolicies'].map(policy => ({
                routeUrl: policy.routeUrl.trim(),
                matchMode: policy.matchMode,
                privilegeCodes: [...new Set(policy.privilegeCodes)]
            })),
            uiPolicies: value['uiPolicies'].map(policy => ({
                actionCode: policy.actionCode.trim().toLowerCase(),
                matchMode: policy.matchMode,
                privilegeCodes: [...new Set(policy.privilegeCodes)]
            })),
            authorizationVersion: this.isNonBlankString(value['authorizationVersion'])
                ? value['authorizationVersion'].trim() : undefined,
            layout: value['layout'] as BackendLayoutConfig | undefined,
        };
    }

    private normalizeEffectiveTenant(value: unknown): EffectiveTenantContext {
        if (!this.isRecord(value)
            || !this.isPositiveId(value['tenantId'])
            || !this.isNonBlankString(value['tenantCode'])
            || !this.isNonBlankString(value['hostname'])
            || !Array.isArray(value['scopeAssignments'])) {
            this.clear();
            throw new Error('Effective tenant context is malformed');
        }
        const scopeAssignments = value['scopeAssignments'].map(scope => this.normalizeScope(scope));
        if (!scopeAssignments.length || scopeAssignments.some(scope => scope.tenantId !== value['tenantId'])) {
            this.clear();
            throw new Error('Effective tenant scope assignments are missing or contradictory');
        }
        return {
            tenantId: value['tenantId'],
            tenantCode: value['tenantCode'].trim(),
            hostname: value['hostname'].trim().toLowerCase(),
            scopeAssignments,
        };
    }

    private normalizeScope(value: unknown): EffectiveScopeAssignment {
        if (!this.isRecord(value) || !this.isPositiveId(value['tenantId'])) {
            this.clear();
            throw new Error('Authorization scope assignment is malformed');
        }
        const businessId = value['businessId'] == null ? null : value['businessId'];
        const branchId = value['branchId'] == null ? null : value['branchId'];
        if ((businessId !== null && !this.isPositiveId(businessId))
            || (branchId !== null && !this.isPositiveId(branchId))
            || (branchId !== null && businessId === null)) {
            this.clear();
            throw new Error('Authorization scope hierarchy is malformed');
        }
        return { tenantId: value['tenantId'], businessId, branchId };
    }

    private persist(context: ApplicationAuthorizationContext): void {
        localStorage.setItem('clientCode', context.clientCode);
        localStorage.setItem('clientType', context.clientType);
        localStorage.setItem('privilegeCodes', JSON.stringify(context.privilegeCodes));
        localStorage.setItem('routePolicies', JSON.stringify(context.routePolicies));
        localStorage.setItem('uiPolicies', JSON.stringify(context.uiPolicies));
        localStorage.setItem('layoutConfig', JSON.stringify(context.layout ?? null));
        if (context.effectiveTenant) localStorage.setItem('effectiveTenant', JSON.stringify(context.effectiveTenant));
        if (context.authorizationVersion) localStorage.setItem('authorizationVersion', context.authorizationVersion);
    }

    private isRecord(value: unknown): value is Record<string, any> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    private isNonBlankString(value: unknown): value is string {
        return typeof value === 'string' && value.trim().length > 0;
    }

    private isStringArray(value: unknown): value is string[] {
        return Array.isArray(value) && value.every(item => this.isNonBlankString(item));
    }

    private isPositiveId(value: unknown): value is number {
        return Number.isSafeInteger(value) && (value as number) > 0;
    }

    private isRoutePolicies(value: unknown): value is RoutePrivilegePolicy[] {
        return Array.isArray(value) && value.every(policy => this.isRecord(policy)
            && this.isNonBlankString(policy['routeUrl'])
            && (policy['matchMode'] === 'ANY' || policy['matchMode'] === 'ALL')
            && this.isStringArray(policy['privilegeCodes']));
    }

    private isUiPolicies(value: unknown): value is UiPrivilegePolicy[] {
        return Array.isArray(value) && value.every(policy => this.isRecord(policy)
            && this.isNonBlankString(policy['actionCode'])
            && (policy['matchMode'] === 'ANY' || policy['matchMode'] === 'ALL')
            && this.isStringArray(policy['privilegeCodes']));
    }
}
