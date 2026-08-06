import { HttpInterceptorFn } from '@angular/common/http';
import { inject, isDevMode } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ApiResponse } from '../model/api-response.model';
import { ResponseMessage } from '../model/response-message.model';
import { NotificationService } from '../notification.service';

const AUTHENTICATION_REQUIRED_CODE = 'AUTHENTICATION_REQUIRED';
const TRACE_ID_HEADER = 'X-Trace-Id';

function notifyMessages(notifications: NotificationService, messages: ResponseMessage[] | undefined, fallbackText: string): void {
    if (messages?.length) {
        notifications.notifyApiMessages(messages);
        return;
    }
    notifications.notify({ level: 'error', text: fallbackText });
}

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
    const notifications = inject(NotificationService);
    const router = inject(Router);
    const silent = req.headers.get('X-Silent') === 'true';

    return next(req).pipe(
        map(event => {
            if (event instanceof HttpResponse) {
                const body = event.body as ApiResponse<any>;
                if (body && body.status) {
                    if (isDevMode()) {
                        console.log(body);
                    }
                    if (body.status === 'SUCCESS') {
                        if (!silent) {
                            notifications.notifyApiMessages(body.message);
                        }
                        return event.clone({ body: body.data });
                    } else {
                        if (!silent) {
                            notifications.notifyApiMessages(body.message);
                        }
                        // Preserve the full structured body (statusCode + message[] with
                        // their codes, e.g. USER_PRIVILEGE_NOT_ALLOWED) on `.error` instead
                        // of flattening it to a string, so the catchError branch below can
                        // read it the same way it reads a genuine non-2xx transport error.
                        throw new HttpErrorResponse({ status: body.statusCode, error: body });
                    }
                }
            }
            return event;
        }),
        catchError((error: HttpErrorResponse) => {
            const traceId = error.headers?.get?.(TRACE_ID_HEADER) ?? undefined;
            const apiError = error.error as ApiResponse<unknown> | undefined;
            const messages = apiError?.message;

            if (isDevMode()) {
                console.error('API Error Interceptor:', { traceId, status: error.status, statusCode: apiError?.statusCode, error });
            }

            if (error.status === 401) {
                const hasAuthRequiredCode = messages?.some((m) => m.code === AUTHENTICATION_REQUIRED_CODE) ?? false;
                // No matched code still means "not authenticated" from the caller's
                // perspective — redirect unless the body explicitly says otherwise via a
                // different, unrecognized 401 code.
                if (hasAuthRequiredCode || !messages?.length) {
                    if (!silent) {
                        notifyMessages(notifications, messages, 'Your session has expired. Please log in again.');
                    }
                    router.navigate(['/login']);
                }
            } else if (error.status === 403) {
                // Stay on the current page — a 403 means the user is authenticated but
                // lacks the privilege for this action, not that their session is invalid.
                if (!silent) {
                    notifyMessages(notifications, messages, 'You do not have permission to perform this action.');
                }
            }

            return throwError(() => error);
        })
    );
};
