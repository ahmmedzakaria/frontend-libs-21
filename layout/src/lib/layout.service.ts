import { Injectable, signal, computed } from '@angular/core';

export type ThemeType = 'light' | 'dark';
export type LayoutType = 'default' | 'compact' | 'horizontal';

@Injectable({ providedIn: 'root' })
export class LayoutService {
    private _layout = signal({
        showSidebar: false,
        showTopbar: false,
        collapsed: false
    });

    private _theme = signal<ThemeType>('light');
    private _layoutType = signal<LayoutType>('default');

    layout = computed(() => this._layout());
    theme = computed(() => this._theme());
    layoutType = computed(() => this._layoutType());

    toggleSidebar(): void {
        this._layout.update(cfg => ({ ...cfg, collapsed: !cfg.collapsed }));
    }

    setTheme(theme: ThemeType): void {
        this._theme.set(theme);
        document.body.dataset.bsTheme = theme;
    }

    setLayoutType(type: LayoutType): void {
        this._layoutType.set(type);
    }

    /** 🧭 Called after login */
    setAuthenticatedLayout(): void {
        this._layout.set({
            showSidebar: true,
            showTopbar: true,
            collapsed: false
        });
        console.log('Authenticated Layout',this._layout());
    }

    /** 🚪 Called after logout */
    setPublicLayout(): void {
        this._layout.set({
            showSidebar: false,
            showTopbar: false,
            collapsed: false
        });
    }
}
