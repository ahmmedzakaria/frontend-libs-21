import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {ApiResponse} from "../model/api-response.model";
import { NotificationService } from '../notification.service';

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
    const notifications = inject(NotificationService);
    const silent = req.headers.get('X-Silent') === 'true';

    return next(req).pipe(
        map(event => {
            if (event instanceof HttpResponse) {
                const body = event.body as ApiResponse<any>;
                if (body && body.status) {
                    console.log(body);
                    if (body.status === 'SUCCESS') {
                        if (!silent) {
                            notifications.notifyApiMessages(body.message);
                        }
                        return event.clone({ body: body.data });
                    } else {
                        if (!silent) {
                            notifications.notifyApiMessages(body.message);
                        }
                        throw new HttpErrorResponse({
                            status: body.statusCode,
                            error: body.message?.map(m => m.message).join(', ') || 'Unknown error'
                        });
                    }
                }
            }
            return event;
        }),
        catchError((error: HttpErrorResponse) => {
            console.error('API Error Interceptor:', error);
            return throwError(() => error);
        })
    );
};
