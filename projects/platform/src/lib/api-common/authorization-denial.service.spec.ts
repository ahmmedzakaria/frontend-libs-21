import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthorizationDenialService } from './authorization-denial.service';

function error(code: string, status = 403): HttpErrorResponse {
    return new HttpErrorResponse({
        status,
        headers: new HttpHeaders({ 'X-Trace-Id': 'trace-7', 'Retry-After': '12' }),
        error: { message: [{ code, message: 'Denied' }] }
    });
}

describe('AuthorizationDenialService revocation handling', () => {
    it('refreshes presentation authority after a privilege denial without replaying the request', () => {
        const context = { refresh: vi.fn(() => of({})), clear: vi.fn() };
        const router = { navigate: vi.fn() };
        const service = new AuthorizationDenialService(context as never, router as never);

        const denial = service.handle(error('USER_PRIVILEGE_NOT_ALLOWED'));

        expect(denial).toMatchObject({
            code: 'USER_PRIVILEGE_NOT_ALLOWED', message: 'Denied', traceId: 'trace-7',
            retryAfterSeconds: 12, recoverability: 'refresh-context'
        });
        expect(context.refresh).toHaveBeenCalledTimes(1);
        expect(context.clear).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('clears all context and redirects only for authentication failure', () => {
        const context = { refresh: vi.fn(() => of({})), clear: vi.fn() };
        const router = { navigate: vi.fn() };
        const service = new AuthorizationDenialService(context as never, router as never);

        service.handle(error('AUTHENTICATION_REQUIRED', 401));

        expect(context.clear).toHaveBeenCalledTimes(1);
        expect(context.refresh).not.toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
});
