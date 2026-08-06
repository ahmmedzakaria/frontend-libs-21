import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApplicationContextService, NavTreeItem } from '../layout/index';
import { AuthService } from './auth.service';

function normalizePath(path: string): string {
    return path.replace(/^\/+/, '').split(/[?#]/)[0];
}

/** `undefined` = no nav-tree entry matches this path at all; `[]`/populated =
 * matched, with whatever `privilegeCodes` the backend declared (possibly
 * none). Callers must treat "no match" and "matched with zero codes"
 * differently — see the guard below. */
function findPrivilegeCodes(items: NavTreeItem[], targetPath: string): string[] | undefined {
    for (const item of items) {
        if (item.route && normalizePath(item.route) === targetPath) {
            return item.privilegeCodes;
        }
        if (item.children?.length) {
            const found = findPrivilegeCodes(item.children, targetPath);
            if (found !== undefined) {
                return found;
            }
        }
    }
    return undefined;
}

/**
 * Data-driven route protection: looks up the activating route's matching
 * entry in the cached navigation tree (exact `route` match, recursing into
 * `children`) and checks `AuthService.hasPrivilege()` against that item's own
 * `privilegeCodes`.
 *
 * Fail-closed cases (redirect to `/dashboard`):
 * - The nav tree has a matching entry, but it declares `privilegeCodes` and
 *   the current user has none of them.
 * - The nav tree has a matching entry with an explicitly empty
 *   `privilegeCodes` array — the backend modeled this feature as having a
 *   privilege gate and simply hasn't assigned any codes to it yet, which
 *   should read as "nobody" rather than "everybody," to avoid a
 *   half-configured backend entry silently granting open access.
 *
 * Fail-open case (deliberately preserved, not a gap): no nav-tree entry
 * matches the path at all. The nav tree only models *navigable* features
 * (list/detail screens reachable from the rail), not action routes like
 * `person/create` or `person/:id/edit` — those are protected by their own
 * explicit `canActivate: [privilegeGuard(...)]` on the route instead. Routes
 * with neither a nav-tree entry nor their own guard (e.g. `dashboard`,
 * `component-demo`) must set `data: { public: true }` to document that
 * they're intentionally open, rather than being open by omission.
 */
export const menuPrivilegeGuard: CanActivateChildFn = (childRoute, state) => {
    const authService = inject(AuthService);
    const applicationContext = inject(ApplicationContextService);
    const router = inject(Router);

    if (childRoute.data?.['public'] === true) {
        return true;
    }

    return applicationContext.ensureLoaded().pipe(
        map(() => {
            const requiredCodes = findPrivilegeCodes(applicationContext.getCachedNavTree(), normalizePath(state.url));
            if (requiredCodes === undefined) {
                return true;
            }
            if (requiredCodes.some((code) => authService.hasPrivilege(code))) {
                return true;
            }

            return router.createUrlTree(['/dashboard']);
        })
    );
};
