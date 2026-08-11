import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { THEME_COLOR_ROLES, THEMES, ThemeDef, ThemeId } from '../models/theme.model';
import { LayoutConfigService } from './layout-config.service';

const STORAGE_KEY = 'sentinel-kyc.theme';

/** Backend `primaries` field → the CSS custom property it overrides, derived from THEME_COLOR_ROLES. */
const PRIMITIVE_VAR_MAP: Record<string, string> = Object.fromEntries(
  THEME_COLOR_ROLES.map((role) => [role.key, role.cssVar])
);

/** Backend `chromeOverrides` field → the CSS custom property it overrides. */
const CHROME_VAR_MAP: Record<string, string> = {
  accentSoft: '--accent-soft',
  bg: '--chrome-bg',
  border: '--chrome-border',
  borderStrong: '--chrome-border-strong',
  hoverBg: '--chrome-hover-bg',
  activeBg: '--chrome-active-bg',
  searchBg: '--chrome-search-bg',
  searchBorder: '--chrome-search-border',
  searchText: '--chrome-search-text',
  searchPlaceholder: '--chrome-search-placeholder'
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly layoutConfig = inject(LayoutConfigService);

  /** Backend-provided themes when present, else the hardcoded fallback list. */
  readonly themes = computed<readonly ThemeDef[]>(() => {
    const backendThemes = this.layoutConfig.themes();
    if (!backendThemes.length) {
      return THEMES;
    }
    return backendThemes.map((t) => ({
      id: t.id,
      label: t.label,
      base: t.base,
      swatch: t.swatch,
      primaries: t.primaries,
      chromeOverrides: t.chromeOverrides
    }));
  });

  /** Local UI state — a signal, per scope (no RxJS needed for synchronous state like this). */
  private readonly themeId = signal<ThemeId>(this.readInitialTheme());

  readonly current = computed<ThemeDef>(
    () => this.themes().find((t) => t.id === this.themeId()) ?? this.themes()[0]
  );

  /**
   * Session-only per-role color overrides (e.g. from a live color-palette editor) —
   * layered on top of the selected theme's primaries, never persisted, cleared by
   * clearCustomColors() or naturally lost on reload.
   */
  private readonly customColors = signal<Record<string, string> | null>(null);

  constructor() {
    // Reflect the active theme onto <body> as a data attribute + structural class,
    // exactly like the `data-theme` / `.dark` mechanism in the original CSS tokens —
    // plus, for backend-sourced themes, the real color primaries as inline custom
    // property overrides (highest specificity, wins over the SCSS defaults).
    effect(() => {
      const theme = this.current();
      const custom = this.customColors();
      const body = document.body;
      body.dataset['theme'] = theme.id;
      body.classList.toggle('dark', theme.base === 'dark');
      localStorage.setItem(STORAGE_KEY, theme.id);
      this.applyBackendOverrides(body, theme);
      this.applyCustomOverrides(body, custom);
    });
  }

  select(id: ThemeId): void {
    this.themeId.set(id);
  }

  /** Live-applies a single color-role override (e.g. from a color-palette editor). */
  setCustomColor(key: string, value: string): void {
    this.customColors.update((prev) => ({ ...(prev ?? {}), [key]: value }));
  }

  /** Drops all session color overrides, reverting to the selected theme's own colors. */
  clearCustomColors(): void {
    this.customColors.set(null);
  }

  private applyCustomOverrides(body: HTMLElement, custom: Record<string, string> | null): void {
    if (!custom) {
      return;
    }
    for (const [key, value] of Object.entries(custom)) {
      const cssVar = PRIMITIVE_VAR_MAP[key];
      if (cssVar && value) {
        body.style.setProperty(cssVar, value);
      }
    }
  }

  private applyBackendOverrides(body: HTMLElement, theme: ThemeDef): void {
    // Clear any overrides a previously-selected backend theme left behind —
    // otherwise switching to a hardcoded fallback theme would still show the
    // last backend theme's colors via these inline styles.
    for (const cssVar of Object.values(PRIMITIVE_VAR_MAP)) {
      body.style.removeProperty(cssVar);
    }
    for (const cssVar of Object.values(CHROME_VAR_MAP)) {
      body.style.removeProperty(cssVar);
    }

    if (theme.primaries) {
      const primaries = theme.primaries as unknown as Record<string, string>;
      for (const [key, cssVar] of Object.entries(PRIMITIVE_VAR_MAP)) {
        const value = primaries[key];
        if (value) {
          body.style.setProperty(cssVar, value);
        }
      }
    }
    if (theme.chromeOverrides) {
      const overrides = theme.chromeOverrides as unknown as Record<string, string | undefined>;
      for (const [key, cssVar] of Object.entries(CHROME_VAR_MAP)) {
        const value = overrides[key];
        if (value) {
          body.style.setProperty(cssVar, value);
        }
      }
    }
  }

  private readInitialTheme(): ThemeId {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || 'light';
  }
}
