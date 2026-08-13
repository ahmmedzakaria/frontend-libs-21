import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError } from 'rxjs';
import { ApplicationContextService } from '../layout/index';
import { ApiResponse } from './model/api-response.model';

export const AUTHORIZATION_ERROR_CODES = [
    'AUTHENTICATION_REQUIRED',
    'INVALID_CLIENT_CREDENTIALS',
    'API_NOT_REGISTERED',
    'CLIENT_API_NOT_ALLOWED',
    'CLIENT_FEATURE_NOT_ALLOWED',
    'USER_PRIVILEGE_NOT_ALLOWED',
    'DATA_SCOPE_NOT_ALLOWED',
    'API_REGISTRY_AMBIGUOUS',
    'RATE_LIMIT_EXCEEDED',
    'RATE_LIMIT_UNAVAILABLE',
] as const;

export type AuthorizationErrorCode = typeof AUTHORIZATION_ERROR_CODES[number];

export interface AuthorizationDenial {
    code: AuthorizationErrorCode;
    status: number;
    traceId?: string;
    retryAfterSeconds?: number;
}

const AUTHENTICATION_CODES: ReadonlySet<AuthorizationErrorCode> = new Set([
    'AUTHENTICATION_REQUIRED', 'INVALID_CLIENT_CREDENTIALS'
]);
const CONTEXT_DENIAL_CODES: ReadonlySet<AuthorizationErrorCode> = new Set([
    'USER_PRIVILEGE_NOT_ALLOWED', 'DATA_SCOPE_NOT_ALLOWED',
    'CLIENT_API_NOT_ALLOWED', 'CLIENT_FEATURE_NOT_ALLOWED'
]);

@Injectable({ providedIn: 'root' })
export class AuthorizationDenialService {
    readonly lastDenial = signal<AuthorizationDenial | null>(null);

    constructor(
        private readonly context: ApplicationContextService,
        private readonly router: Router,
    ) {}

    classify(error: HttpErrorResponse): AuthorizationDenial | null {
        const body = error.error as ApiResponse<unknown> | undefined;
        const code = body?.message?.map(message => message.code)
            .find(candidate => AUTHORIZATION_ERROR_CODES.includes(candidate as AuthorizationErrorCode));
        if (!code) return null;

        const retryAfter = Number(error.headers?.get('Retry-After'));
        return {
            code: code as AuthorizationErrorCode,
            status: error.status,
            traceId: error.headers?.get('X-Trace-Id') ?? undefined,
            retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter : undefined,
        };
    }

    handle(error: HttpErrorResponse): AuthorizationDenial | null {
        const denial = this.classify(error);
        if (!denial) return null;

        this.lastDenial.set(denial);
        if (AUTHENTICATION_CODES.has(denial.code)) {
            this.context.clear();
            void this.router.navigate(['/login']);
        } else if (CONTEXT_DENIAL_CODES.has(denial.code)) {
            // Refresh presentation state exactly once; the rejected operation,
            // especially a mutation, is deliberately never replayed.
            this.context.refresh().pipe(catchError(() => EMPTY)).subscribe();
        }
        return denial;
    }

    clear(): void {
        this.lastDenial.set(null);
    }
}
