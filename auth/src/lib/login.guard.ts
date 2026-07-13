import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
/*
* This guard ensures logged-in users can’t open the login page again.
* */
export const loginGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        router.navigate(['/dashboard']);
        return false;
    }

    return true;
};
