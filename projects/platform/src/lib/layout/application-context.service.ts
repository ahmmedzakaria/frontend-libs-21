import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ActionTypes, ApiEndpoint, ApiService } from '../api-common/index';
import { BackendLayoutConfig, NavTreeItem } from './core/models/layout-config.model';

export interface ApplicationContext {
    clientCode?: string;
    clientType?: string;
    privilegeCodes: string[];
    layout?: BackendLayoutConfig;
}

interface WrappedApplicationContext {
    data?: ApplicationContext;
}

const PRIVILEGE_CONTEXT_ENDPOINT: ApiEndpoint = {
    apiPath: 'system/privilege/context',
    actionType: ActionTypes.AUTH,
};

@Injectable({ providedIn: 'root' })
export class ApplicationContextService {
    /** Reactive copy of the effective layout. Unlike localStorage, this also
     * updates services that were instantiated before login completed. */
    readonly layoutConfig = signal<BackendLayoutConfig | null>(this.readCachedLayoutConfig());

    constructor(private apiService: ApiService) {}

    load(): Observable<ApplicationContext> {
        return this.apiService.post<ApplicationContext | WrappedApplicationContext>(PRIVILEGE_CONTEXT_ENDPOINT, {}).pipe(
            map(response => this.unwrap(response)),
            tap(context => {
                localStorage.setItem('clientCode', context.clientCode || '');
                localStorage.setItem('clientType', context.clientType || '');
                localStorage.setItem('privilegeCodes', JSON.stringify(context.privilegeCodes));
                localStorage.setItem('layoutConfig', JSON.stringify(context.layout || null));
                this.setLayoutConfig(context.layout ?? null);
            })
        );
    }

    getCachedNavTree(): NavTreeItem[] {
        return this.getCachedLayoutConfig()?.navTree ?? [];
    }

    getCachedLayoutConfig(): BackendLayoutConfig | null {
        return this.layoutConfig();
    }

    setLayoutConfig(config: BackendLayoutConfig | null): void {
        this.layoutConfig.set(config);
    }

    private readCachedLayoutConfig(): BackendLayoutConfig | null {
        const raw = localStorage.getItem('layoutConfig');
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as BackendLayoutConfig;
        } catch {
            return null;
        }
    }

    private unwrap(response: ApplicationContext | WrappedApplicationContext): ApplicationContext {
        const context = (response as WrappedApplicationContext)?.data || response as ApplicationContext;
        return {
            clientCode: context?.clientCode || '',
            clientType: context?.clientType || '',
            privilegeCodes: context?.privilegeCodes || [],
            layout: context?.layout,
        };
    }
}
