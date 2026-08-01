import { Injectable, computed, effect, inject } from '@angular/core';
import {
  BackendLayoutConfig,
  LayoutBrand,
  LayoutFonts,
  LayoutProfile,
  LayoutSizes,
  LayoutTheme,
  NavTreeItem
} from '../models/layout-config.model';
import { ApplicationContextService } from '../../application-context.service';

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

/** `LayoutProfile.density` → the multiplier applied to `--layout-density-scale`. Only
 * `'COMFORTABLE'` has been observed live; `'COMPACT'`'s 0.85 is a placeholder pending
 * a real sample. Unknown/absent values fall back to 1 (today's unconditional scale). */
const DENSITY_SCALE_MAP: Record<string, number> = {
  COMFORTABLE: 1,
  COMPACT: 0.85
};

/**
 * Consumes the `layout` block the backend now nests inside `ApplicationContext`
 * (`system/privilege/context`) — themes, sizes, fonts, brand. Deliberately has
 * no HTTP of its own: `ApplicationContextService.load()` already fetches this
 * data, so this service is just `apply()`'d the
 * `layout` field from that same response (see RailNavComponent's constructor).
 */
@Injectable({ providedIn: 'root' })
export class LayoutConfigService {
  private readonly applicationContext = inject(ApplicationContextService);

  private readonly config = computed<BackendLayoutConfig | null>(() => this.applicationContext.layoutConfig());

  readonly themes = computed<LayoutTheme[]>(() => this.config()?.themes ?? []);
  readonly sizes = computed<LayoutSizes | null>(() => this.config()?.sizes ?? null);
  readonly fonts = computed<LayoutFonts | null>(() => this.config()?.fonts ?? null);
  readonly navTree = computed<NavTreeItem[]>(() => this.config()?.navTree ?? []);

  readonly activeProfile = computed<LayoutProfile | null>(() => {
    const config = this.config();
    return (config?.availableProfiles?.find((p) => p.code === config?.activeProfileCode) ?? config?.availableProfiles?.[0]) ?? null;
  });

  readonly brand = computed<LayoutBrand | null>(() => this.activeProfile()?.brand ?? null);

  // Each `?? true`/`?? false` preserves today's unconditional-render behavior when
  // the backend omits the field, matching the fallback-safe pattern used above.
  readonly topbarEnabled = computed(() => this.activeProfile()?.topbarEnabled ?? true);
  readonly sidebarEnabled = computed(() => this.activeProfile()?.sidebarEnabled ?? true);
  readonly footerEnabled = computed(() => this.activeProfile()?.footerEnabled ?? true);
  readonly breadcrumbEnabled = computed(() => this.activeProfile()?.breadcrumbEnabled ?? true);
  /** No command-bar UI exists in this codebase; exposed for completeness, intentionally unconsumed. */
  readonly commandBarEnabled = computed(() => this.activeProfile()?.commandBarEnabled ?? false);
  readonly density = computed(() => this.activeProfile()?.density ?? 'COMFORTABLE');
  readonly rtlEnabled = computed(() => this.activeProfile()?.rtlEnabled ?? false);

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

    effect(() => {
      const scale = DENSITY_SCALE_MAP[this.density()] ?? 1;
      document.body.style.setProperty('--layout-density-scale', String(scale));
    });
  }

  apply(config: BackendLayoutConfig | undefined): void {
    if (config) {
      this.applicationContext.setLayoutConfig(config);
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
