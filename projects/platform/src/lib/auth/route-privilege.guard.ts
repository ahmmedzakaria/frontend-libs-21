import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApplicationContextService } from '../layout/index';
import { AuthorizationPolicyService } from './authorization-policy.service';

export { findRoutePolicy, isRoutePolicyAllowed, matchesRouteUrl, normalizeRouteUrl } from './authorization-policy.service';

export const routePrivilegeGuard: CanActivateChildFn = (childRoute, state) => {
    if (childRoute.data?.['public'] === true) return true;

    const context = inject(ApplicationContextService);
    const policy = inject(AuthorizationPolicyService);
    const router = inject(Router);
    return context.ensureLoaded().pipe(
        map(() => policy.isRouteAllowed(state.url) ? true : router.createUrlTree(['/access-denied']))
    );
};
