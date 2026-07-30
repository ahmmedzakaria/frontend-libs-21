import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActionTypes } from './model/action-types';
import { API_ENVIRONMENT, NexacoreEnvironment } from './environment';
import { ApiEndpoint } from './model/endpoint';


@Injectable({
    providedIn: 'root'
})
export class ApiService {
    constructor(
        private http: HttpClient,
        @Inject(API_ENVIRONMENT) private environment: NexacoreEnvironment
    ) {}

    /**
     * Build headers (JSON/multipart) — Authorization is attached by jwtInterceptor,
     * not here, so there is exactly one place that reads the stored token.
     */
    private buildHeaders(isMultiPart: boolean = false, providedHeaders?: HttpHeaders): HttpHeaders {
        let headers = providedHeaders || new HttpHeaders();

        const { clientCode, apiKey } = this.environment;

        if (clientCode && apiKey && !headers.has('X-Client-Code')) {
            headers = headers.set('X-Client-Code', clientCode);
        }

        if (apiKey && !headers.has('X-API-Key')) {
            headers = headers.set('X-API-Key', apiKey);
        }

        if (!isMultiPart && !headers.has('Content-Type')) {
            headers = headers.set('Content-Type', 'application/json');
        }

        return headers;
    }

    /**
     * Generalized POST for all actions (create, update, delete, search, login)
     */
    post<T>(
        apiInfo: ApiEndpoint,
        body: any = {},
        options: {
            headers?: HttpHeaders;
            responseType?: 'json' | 'arraybuffer';
            observe?: 'body' | 'response';
        } = {}
    ): Observable<T> {
        if (body instanceof FormData) {
            if (!body.has('source')) {
                body.append('source', 'NEXACORE_APP');
            }
        } else {
            body.source = "NEXACORE_APP";
        }

        const basePath = this.resolveBasePath(apiInfo.actionType);

        const headers = this.buildHeaders(apiInfo.isMultiPart, options.headers);
        const requestOptions = {
            ...options,
            headers,
        } as any;

        return this.http.post(`${basePath}/${apiInfo.apiPath}`, body, requestOptions).pipe(
            catchError(this.handleError)
        ) as Observable<T>;
    }

    private resolveBasePath(actionType: ActionTypes): string {
        // Only LOGIN endpoints (auth.service.ts) live under loginUrl
        // (/api/v1/auth). ActionTypes.AUTH-tagged endpoints (privilege
        // context/sidebar-menu) are regular authenticated calls under the
        // normal apiBaseUrl (/api/v1/system/...), not under /auth.
        const configuredPath = actionType === ActionTypes.LOGIN
            ? this.environment.loginUrl
            : this.environment.apiBaseUrl;

        if (this.shouldUseLocalBackendOrigin()) {
            return this.joinUrl(this.environment.backendOrigin, configuredPath);
        }

        return configuredPath;
    }

    private shouldUseLocalBackendOrigin(): boolean {
        if (!this.environment.backendOrigin || typeof window === 'undefined') {
            return false;
        }

        return window.location.hostname === 'localhost'
            && ['4200', '4300', '5300'].includes(window.location.port);
    }

    private joinUrl(origin: string, path: string): string {
        const normalizedOrigin = origin.replace(/\/$/, '');
        const normalizedPath = path ? `/${path.replace(/^\//, '')}` : '';
        return `${normalizedOrigin}${normalizedPath}`;
    }

    fetchBinaryData(
        apiInfo: ApiEndpoint,
        body: any = {},
        options: {
            headers?: HttpHeaders;
            responseType?: 'arraybuffer';
            observe?: 'response';
        } = { responseType: 'arraybuffer', observe: 'response' }
    ): Observable<{ blob: Blob; filename: string; contentType: string | null }> {
        if (!apiInfo) {
            return throwError(() => new Error('Api information is missing'));
        }

        if (body instanceof FormData) {
            if (!body.has('source')) {
                body.append('source', 'NEXACORE_APP');
            }
        } else {
            body.source = 'NEXACORE_APP';
        }

        const requestOptions = {
            ...options,
            responseType: 'arraybuffer' as const,
            observe: 'response' as const,
        };

        return this.post<HttpResponse<ArrayBuffer>>(apiInfo, body, requestOptions).pipe(
            map((response: HttpResponse<ArrayBuffer>) => {
                const contentType = response.headers.get('Content-Type');
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'download';

                if (contentDisposition) {
                    const match = contentDisposition.match(/filename\*?=(?:UTF-8''|\"?)([^\";]+)/i);
                    if (match?.[1]) {
                        filename = decodeURIComponent(match[1].replace(/\"/g, ''));
                    }
                }

                const blob = new Blob([response.body ?? new ArrayBuffer(0)], {
                    type: contentType || 'application/octet-stream',
                });

                return { blob, filename, contentType };
            }),
            catchError(this.handleError)
        );
    }

    fetchImageUrl(
        apiInfo: ApiEndpoint,
        body: any = {}
    ): Observable<string> {
        return this.fetchBinaryData(apiInfo, body).pipe(
            map(({ blob }) => URL.createObjectURL(blob))
        );
    }

    /**
     * Error handler
     */
    private handleError(error: HttpErrorResponse) {
        console.error('API Error:', error);
        let errorMsg = 'An unknown error occurred';
        if (error.error instanceof ErrorEvent) {
            errorMsg = `Client error: ${error.error.message}`;
        } else {
            errorMsg = `Server error (${error.status}): ${error.message}`;
        }
        return throwError(() => new Error(errorMsg));
    }
}
