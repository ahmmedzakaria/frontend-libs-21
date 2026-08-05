import { Injectable, signal, computed } from '@angular/core';

export type LayoutType = 'default' | 'compact' | 'horizontal';

export interface CurrentUser {
    username: string;
    role?: string;
}

@Injectable({ providedIn: 'root' })
export class LayoutService {
    private _layout = signal({
        showSidebar: false,
        showTopbar: false,
        collapsed: false
    });
    private logoutHandler: (() => void) | null = null;

    private _layoutType = signal<LayoutType>('default');
    private _currentUser = signal<CurrentUser | null>(null);

    layout = computed(() => this._layout());
    layoutType = computed(() => this._layoutType());
    currentUser = computed(() => this._currentUser());

    setCurrentUser(user: CurrentUser | null): void {
        this._currentUser.set(user);
    }

    toggleSidebar(): void {
        this._layout.update(cfg => ({ ...cfg, collapsed: !cfg.collapsed }));
    }

    setLayoutType(type: LayoutType): void {
        this._layoutType.set(type);
    }

    registerLogoutHandler(handler: () => void): void {
        this.logoutHandler = handler;
    }

    requestLogout(): void {
        if (this.logoutHandler) {
            this.logoutHandler();
            return;
        }

        this.setPublicLayout();
    }

    /** Called after login */
    setAuthenticatedLayout(): void {
        this._layout.set({
            showSidebar: true,
            showTopbar: true,
            collapsed: false
        });
        console.log('Authenticated Layout',this._layout());
    }

    /** Called after logout */
    setPublicLayout(): void {
        this._layout.set({
            showSidebar: false,
            showTopbar: false,
            collapsed: false
        });
        this._currentUser.set(null);
    }
}
