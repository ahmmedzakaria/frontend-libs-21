import { Injectable } from '@angular/core';
import { ApplicationContextService, RoutePrivilegePolicy, UiPrivilegePolicy } from '../layout/index';
import { isPolicyAllowed } from './policy-evaluator';

@Injectable({ providedIn: 'root' })
export class AuthorizationPolicyService {
    constructor(private readonly context: ApplicationContextService) {}

    hasPrivilege(code: string): boolean {
        return this.context.hasPrivilege(code);
    }

    isRouteAllowed(requestedUrl: string): boolean {
        return isRoutePolicyAllowed(findRoutePolicy(this.context.routePolicies(), requestedUrl), code => this.hasPrivilege(code));
    }

    isActionAllowed(actionCode: string): boolean {
        const normalized = normalizeActionCode(actionCode);
        const policy = this.context.uiPolicies().find(candidate => normalizeActionCode(candidate.actionCode) === normalized);
        return isUiPolicyAllowed(policy, code => this.hasPrivilege(code));
    }
}

export function normalizeActionCode(value: string): string {
    return value.trim().toLowerCase();
}

export function normalizeRouteUrl(url: string): string {
    const path = url.split(/[?#]/, 1)[0] || '/';
    const normalized = `/${path.replace(/^\/+|\/+$/g, '')}`;
    return normalized === '//' ? '/' : normalized;
}

function routeSegments(url: string): string[] {
    return normalizeRouteUrl(url).split('/').filter(Boolean);
}

export function matchesRouteUrl(routeUrl: string, requestedUrl: string): boolean {
    const policySegments = routeSegments(routeUrl);
    const requestSegments = routeSegments(requestedUrl);
    return policySegments.length === requestSegments.length
        && policySegments.every((segment, index) => segment.startsWith(':') || segment === requestSegments[index]);
}

export function findRoutePolicy(policies: RoutePrivilegePolicy[], requestedUrl: string): RoutePrivilegePolicy | undefined {
    return policies.filter(policy => matchesRouteUrl(policy.routeUrl, requestedUrl)).sort((left, right) => {
        const score = (policy: RoutePrivilegePolicy) => routeSegments(policy.routeUrl).filter(segment => !segment.startsWith(':')).length;
        return score(right) - score(left) || routeSegments(right.routeUrl).length - routeSegments(left.routeUrl).length;
    })[0];
}

export function isRoutePolicyAllowed(policy: RoutePrivilegePolicy | undefined, hasPrivilege: (code: string) => boolean): boolean {
    return !!policy && isPolicyAllowed(policy.matchMode, policy.privilegeCodes, hasPrivilege);
}

export function isUiPolicyAllowed(policy: UiPrivilegePolicy | undefined, hasPrivilege: (code: string) => boolean): boolean {
    return !!policy && isPolicyAllowed(policy.matchMode, policy.privilegeCodes, hasPrivilege);
}
