import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Route guard factory for an explicit, known privilege code — e.g.
 * `canActivate: [privilegeGuard('PERSON_CREATE')]`. Not applied to any route
 * yet: we don't have a real privilege-code catalog to wire it against (no
 * dev-backend login was available to confirm one). Use `menuPrivilegeGuard`
 * for data-driven protection that needs no guessed codes.
 */
export function privilegeGuard(...requiredCodes: string[]): CanActivateFn {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        if (!requiredCodes.length || requiredCodes.some((code) => authService.hasPrivilege(code))) {
            return true;
        }

        return router.createUrlTree(['/dashboard']);
    };
}
