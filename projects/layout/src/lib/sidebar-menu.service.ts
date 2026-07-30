import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ActionTypes, ApiEndpoint, ApiService } from '@nexacore/api-common';

export interface SidebarMenuItem {
    label: string;
    icon?: string;
    path?: string;
    menuOrder?: number;
    subMenuOrder?: number;
    privilegeCodes?: string[];
    children?: SidebarMenuItem[];
}

export interface ApplicationContext {
    clientCode?: string;
    clientType?: string;
    menus: SidebarMenuItem[];
    privilegeCodes: string[];
    enabledModules?: string[];
    enabledSubmodules?: string[];
    enabledFeatures?: string[];
}

interface WrappedApplicationContext {
    data?: ApplicationContext;
}

const PRIVILEGE_CONTEXT_ENDPOINT: ApiEndpoint = {
    apiPath: 'system/privilege/context',
    actionType: ActionTypes.AUTH,
};

@Injectable({ providedIn: 'root' })
export class SidebarMenuService {
    constructor(private apiService: ApiService) {}

    loadApplicationContext(): Observable<ApplicationContext> {
        return this.apiService.post<ApplicationContext | WrappedApplicationContext>(PRIVILEGE_CONTEXT_ENDPOINT, {}).pipe(
            map((response: ApplicationContext | WrappedApplicationContext) => this.unwrapApplicationContext(response)),
            tap(context => {
                localStorage.setItem('clientCode', context?.clientCode || '');
                localStorage.setItem('clientType', context?.clientType || '');
                localStorage.setItem('privilegeCodes', JSON.stringify(context?.privilegeCodes || []));
                localStorage.setItem('enabledModules', JSON.stringify(context?.enabledModules || []));
                localStorage.setItem('enabledSubmodules', JSON.stringify(context?.enabledSubmodules || []));
                localStorage.setItem('enabledFeatures', JSON.stringify(context?.enabledFeatures || []));
                localStorage.setItem('sidebarMenus', JSON.stringify(context?.menus || []));
            })
        );
    }

    loadSidebarMenu(): Observable<SidebarMenuItem[]> {
        return this.loadApplicationContext().pipe(map(context => context?.menus || []));
    }

    getCachedSidebarMenu(): SidebarMenuItem[] {
        const rawMenus = localStorage.getItem('sidebarMenus');
        if (!rawMenus) {
            return [];
        }

        try {
            const menus = JSON.parse(rawMenus);
            return Array.isArray(menus) ? menus : [];
        } catch {
            return [];
        }
    }

    private unwrapApplicationContext(response: ApplicationContext | WrappedApplicationContext): ApplicationContext {
        const context = (response as WrappedApplicationContext)?.data || response as ApplicationContext;
        return {
            clientCode: context?.clientCode || '',
            clientType: context?.clientType || '',
            menus: context?.menus || [],
            privilegeCodes: context?.privilegeCodes || [],
            enabledModules: context?.enabledModules || [],
            enabledSubmodules: context?.enabledSubmodules || [],
            enabledFeatures: context?.enabledFeatures || [],
        };
    }
}
