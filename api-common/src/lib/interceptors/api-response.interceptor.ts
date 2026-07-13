import { HttpInterceptorFn } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {ApiResponse} from "../model/api-response.model";
import {ResponseMessage} from "../model/response-message.model";

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
    const snackBar = inject(MatSnackBar);
    const silent = req.headers.get('X-Silent') === 'true';

    return next(req).pipe(
        map(event => {
            if (event instanceof HttpResponse) {
                const body = event.body as ApiResponse<any>;
                if (body && body.status) {
                    console.log(body);
                    if (body.status === 'SUCCESS') {
                        if (!silent) {
                            showMessages(body.message, snackBar);
                        }
                        return event.clone({ body: body.data });
                    } else {
                        if (!silent) {
                            showMessages(body.message, snackBar);
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

function showMessages(messages: ResponseMessage[] | undefined, snackBar: MatSnackBar) {
    if (!messages) return;
    messages.forEach(msg => {
        let panelClass = 'info-snackbar';
        if (msg.type === 'SUCCESS') panelClass = 'success-snackbar';
        if (msg.type === 'ERROR') panelClass = 'error-snackbar';

        snackBar.open(msg.message, 'Close', {
            duration: 4000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: [panelClass]
        });
    });
}
