import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApplicationContextService, RoutePrivilegePolicy } from '../layout/index';
import { AuthService } from './auth.service';
import { isPolicyAllowed } from './policy-evaluator';

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

function specificity(policy: RoutePrivilegePolicy): [number, number] {
    const segments = routeSegments(policy.routeUrl);
    return [segments.filter(segment => !segment.startsWith(':')).length, segments.length];
}

export function findRoutePolicy(policies: RoutePrivilegePolicy[], requestedUrl: string): RoutePrivilegePolicy | undefined {
    return policies
        .filter(policy => matchesRouteUrl(policy.routeUrl, requestedUrl))
        .sort((left, right) => {
            const [leftStatic, leftTotal] = specificity(left);
            const [rightStatic, rightTotal] = specificity(right);
            return rightStatic - leftStatic || rightTotal - leftTotal;
        })[0];
}

export function isRoutePolicyAllowed(policy: RoutePrivilegePolicy | undefined, hasPrivilege: (code: string) => boolean): boolean {
    return !!policy && isPolicyAllowed(policy.matchMode, policy.privilegeCodes, hasPrivilege);
}

export const routePrivilegeGuard: CanActivateChildFn = (childRoute, state) => {
    const authService = inject(AuthService);
    const applicationContext = inject(ApplicationContextService);
    const router = inject(Router);

    if (childRoute.data?.['public'] === true) {
        return true;
    }

    return applicationContext.ensureLoaded().pipe(
        map(() => {
            const policy = findRoutePolicy(applicationContext.getCachedRoutePolicies(), state.url);
            const allowed = isRoutePolicyAllowed(policy, code => authService.hasPrivilege(code));
            return allowed ? true : router.createUrlTree(['/dashboard']);
        })
    );
};
