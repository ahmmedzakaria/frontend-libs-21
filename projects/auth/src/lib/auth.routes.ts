import { Routes } from '@angular/router';
import { loginGuard } from './login.guard';

export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./login/login.component').then(m => m.LoginComponent),
        canActivate: [loginGuard],
    },
    {
        path: 'sso/callback',
        loadComponent: () =>
            import('./sso-callback/sso-callback.component').then(m => m.SsoCallbackComponent),
    },
];
