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

export type AuthorizationRecoverability = 'login' | 'refresh-context' | 'retry-later' | 'none';

export interface AuthorizationFailure {
    code: AuthorizationErrorCode;
    status: number;
    message: string;
    traceId?: string;
    retryAfterSeconds?: number;
    recoverability: AuthorizationRecoverability;
}

/** @deprecated Use AuthorizationFailure. */
export type AuthorizationDenial = AuthorizationFailure;

const AUTHENTICATION_CODES: ReadonlySet<AuthorizationErrorCode> = new Set([
    'AUTHENTICATION_REQUIRED', 'INVALID_CLIENT_CREDENTIALS'
]);
const CONTEXT_DENIAL_CODES: ReadonlySet<AuthorizationErrorCode> = new Set([
    'USER_PRIVILEGE_NOT_ALLOWED', 'DATA_SCOPE_NOT_ALLOWED',
    'CLIENT_API_NOT_ALLOWED', 'CLIENT_FEATURE_NOT_ALLOWED'
]);

@Injectable({ providedIn: 'root' })
export class AuthorizationDenialService {
    readonly lastDenial = signal<AuthorizationFailure | null>(null);

    constructor(
        private readonly context: ApplicationContextService,
        private readonly router: Router,
    ) {}

    classify(error: HttpErrorResponse): AuthorizationFailure | null {
        const body = error.error as ApiResponse<unknown> | undefined;
        const responseMessage = body?.message?.find(message =>
            AUTHORIZATION_ERROR_CODES.includes(message.code as AuthorizationErrorCode));
        const code = responseMessage?.code;
        if (!code) return null;

        const retryAfter = Number(error.headers?.get('Retry-After'));
        const typedCode = code as AuthorizationErrorCode;
        return {
            code: typedCode,
            status: error.status,
            message: responseMessage?.message || 'The request is not authorized.',
            traceId: error.headers?.get('X-Trace-Id') ?? undefined,
            retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter : undefined,
            recoverability: AUTHENTICATION_CODES.has(typedCode) ? 'login'
                : CONTEXT_DENIAL_CODES.has(typedCode) ? 'refresh-context'
                    : typedCode.startsWith('RATE_LIMIT_') ? 'retry-later' : 'none',
        };
    }

    handle(error: HttpErrorResponse, refreshContext = true): AuthorizationFailure | null {
        const denial = this.classify(error);
        if (!denial) return null;

        this.lastDenial.set(denial);
        if (AUTHENTICATION_CODES.has(denial.code)) {
            this.context.clear();
            void this.router.navigate(['/login']);
        } else if (refreshContext && CONTEXT_DENIAL_CODES.has(denial.code)) {
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
