import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { BackendLayoutConfig, LayoutBrand, LayoutFonts, LayoutSizes, LayoutTheme } from '../models/layout-config.model';
import { SidebarMenuService } from '../../sidebar-menu.service';

const FONT_LINK_ID = 'layout-config-font-link';

/** Backend `sizes` field → the CSS custom property it overrides, all in px. */
const SIZE_VAR_MAP: Record<keyof LayoutSizes, string> = {
  spaceUnit: '--layout-size-unit',
  radiusBase: '--radius',
  fontSizeBase: '--layout-font-size-base',
  headerHeight: '--layout-header-height',
  statusBarHeight: '--layout-footer-height',
  railWidthCollapsed: '--layout-nav-width',
  railWidthExpanded: '--layout-nav-expanded-width'
};

/**
 * Consumes the `layout` block the backend now nests inside `ApplicationContext`
 * (`system/privilege/context`) — themes, sizes, fonts, brand. Deliberately has
 * no HTTP of its own: `SidebarMenuService.loadApplicationContext()` already
 * fetches this data for nav menus, so this service is just `apply()`'d the
 * `layout` field from that same response (see RailNavComponent's constructor).
 */
@Injectable({ providedIn: 'root' })
export class LayoutConfigService {
  private readonly sidebarMenu = inject(SidebarMenuService);

  private readonly config = signal<BackendLayoutConfig | null>(this.sidebarMenu.getCachedLayoutConfig());

  readonly themes = computed<LayoutTheme[]>(() => this.config()?.themes ?? []);
  readonly sizes = computed<LayoutSizes | null>(() => this.config()?.sizes ?? null);
  readonly fonts = computed<LayoutFonts | null>(() => this.config()?.fonts ?? null);
  readonly brand = computed<LayoutBrand | null>(() => {
    const config = this.config();
    const activeProfile = config?.availableProfiles?.find((p) => p.code === config.activeProfileCode) ?? config?.availableProfiles?.[0];
    return activeProfile?.brand ?? null;
  });

  constructor() {
    // Backend `sizes` override the final derived dimensions directly (headerHeight,
    // statusBarHeight, railWidthCollapsed/Expanded are already absolute px values,
    // not our internal units-multiplier chain), and spaceUnit/radiusBase/fontSizeBase
    // feed the calc() chains everything else derives from.
    effect(() => {
      const sizes = this.sizes();
      const body = document.body;
      for (const cssVar of Object.values(SIZE_VAR_MAP)) {
        body.style.removeProperty(cssVar);
      }
      if (sizes) {
        for (const key of Object.keys(SIZE_VAR_MAP) as (keyof LayoutSizes)[]) {
          const value = sizes[key];
          if (value != null) {
            body.style.setProperty(SIZE_VAR_MAP[key], `${value}px`);
          }
        }
      }
    });

    effect(() => {
      const fonts = this.fonts();
      const body = document.body;
      body.style.removeProperty('--layout-font-family');
      body.style.removeProperty('--layout-heading-font-family');
      body.style.removeProperty('--layout-mono-font-family');
      this.removeInjectedFontLink();

      if (!fonts) {
        return;
      }
      body.style.setProperty('--layout-font-family', `${fonts.bodyFamily}, ${fonts.fallbackStack}`);
      body.style.setProperty('--layout-heading-font-family', `${fonts.headingFamily}, ${fonts.fallbackStack}`);
      body.style.setProperty('--layout-mono-font-family', `${fonts.monoFamily}, monospace`);

      if (fonts.fontSource !== 'SYSTEM' && fonts.fontUrl) {
        this.injectFontLink(fonts.fontUrl);
      }
    });

    effect(() => {
      const faviconUrl = this.brand()?.faviconUrl;
      if (faviconUrl) {
        this.setFavicon(faviconUrl);
      }
    });
  }

  apply(config: BackendLayoutConfig | undefined): void {
    if (config) {
      this.config.set(config);
    }
  }

  private injectFontLink(href: string): void {
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  private removeInjectedFontLink(): void {
    document.getElementById(FONT_LINK_ID)?.remove();
  }

  private setFavicon(href: string): void {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }
}
