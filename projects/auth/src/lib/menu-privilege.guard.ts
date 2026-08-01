import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { ApplicationContextService, NavTreeItem } from '@nexacore/layout';
import { AuthService } from './auth.service';

function normalizePath(path: string): string {
    return path.replace(/^\/+/, '').split(/[?#]/)[0];
}

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
 * Data-driven route protection: looks up the activating route's matching entry
 * in the cached navigation tree (exact `route` match, recursing into `children`) and
 * checks `AuthService.hasPrivilege()` against that item's own `privilegeCodes`.
 * No match, or a match with no `privilegeCodes`, fails open (`true`) — this
 * only ever tightens routes the backend has explicitly restricted, and needs
 * no guessed privilege codes to be useful today.
 */
export const menuPrivilegeGuard: CanActivateChildFn = (_childRoute, state) => {
    const authService = inject(AuthService);
    const applicationContext = inject(ApplicationContextService);
    const router = inject(Router);

    const requiredCodes = findPrivilegeCodes(applicationContext.getCachedNavTree(), normalizePath(state.url));
    if (!requiredCodes?.length) {
        return true;
    }
    if (requiredCodes.some((code) => authService.hasPrivilege(code))) {
        return true;
    }

    return router.createUrlTree(['/dashboard']);
};
