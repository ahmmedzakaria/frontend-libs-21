import { HttpInterceptorFn } from '@angular/common/http';
import { inject, isDevMode } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ApiResponse } from '../model/api-response.model';
import { ResponseMessage } from '../model/response-message.model';
import { NotificationService } from '../notification.service';
import { ActionTypes } from '../model/action-types';
import { ACTION_TYPE_CONTEXT } from '../model/action-type-context';
import { AuthorizationDenialService } from '../authorization-denial.service';

const TRACE_ID_HEADER = 'X-Trace-Id';
const MUTATING_ACTION_TYPES: ReadonlySet<ActionTypes> = new Set([ActionTypes.CREATE, ActionTypes.UPDATE, ActionTypes.DELETE]);

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
    const denialService = inject(AuthorizationDenialService);
    const silent = req.headers.get('X-Silent') === 'true';
    // Only auto-toast success for mutating calls (Create/Update/Delete) — a
    // plain list/search fetch shouldn't pop a "success" toast every time.
    const isMutating = MUTATING_ACTION_TYPES.has(req.context.get(ACTION_TYPE_CONTEXT) as ActionTypes);

    return next(req).pipe(
        map(event => {
            if (event instanceof HttpResponse) {
                const body = event.body as ApiResponse<any>;
                if (body && body.status) {
                    if (isDevMode()) {
                        console.log(body);
                    }
                    if (body.status === 'SUCCESS') {
                        if (!silent && isMutating) {
                            notifications.notifyApiMessages(body.message);
                        }
                        return event.clone({ body: body.data });
                    } else {
                        // Preserve the full structured body (statusCode + message[] with
                        // their codes, e.g. USER_PRIVILEGE_NOT_ALLOWED) on `.error` instead
                        // of flattening it to a string, so the catchError branch below can
                        // read — and notify — it the same way it does a genuine non-2xx
                        // transport error. Notification itself happens once, in catchError,
                        // not here, to avoid double-toasting this synthetic error.
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
            const denial = denialService.handle(error);

            if (isDevMode()) {
                console.error('API request failed', {
                    traceId,
                    status: error.status,
                    statusCode: apiError?.statusCode,
                    codes: messages?.map(message => message.code).filter(Boolean)
                });
            }

            if (error.status === 401) {
                if (!denial && !messages?.length) {
                    if (!silent) {
                        notifyMessages(notifications, messages, 'Your session has expired. Please log in again.');
                    }
                    router.navigate(['/login']);
                } else if (!silent) {
                    notifyMessages(notifications, messages, 'Authentication is required.');
                }
            } else if (error.status === 403) {
                // Stay on the current page — a 403 means the user is authenticated but
                // lacks the privilege for this action, not that their session is invalid.
                if (!silent) {
                    notifyMessages(notifications, messages, 'You do not have permission to perform this action.');
                }
            } else if (!silent) {
                // Every other non-2xx status (500, 503, 400, ...) previously fell
                // through with just the console.error above — nothing visible.
                notifyMessages(notifications, messages, `Something went wrong (${error.status}).`);
            }

            return throwError(() => error);
        })
    );
};
