import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { THEMES, ThemeDef, ThemeId } from '../models/theme.model';
import { LayoutConfigService } from './layout-config.service';

const STORAGE_KEY = 'sentinel-kyc.theme';

/** Backend `primaries` field → the CSS custom property it overrides. */
const PRIMITIVE_VAR_MAP: Record<string, string> = {
  text: '--layout-theme-text',
  paper: '--layout-theme-bg',
  card: '--layout-theme-surface',
  accent: '--layout-theme-primary',
  amber: '--layout-theme-warning',
  red: '--layout-theme-danger',
  success: '--layout-theme-success',
  info: '--layout-theme-focus'
};

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

  constructor() {
    // Reflect the active theme onto <body> as a data attribute + structural class,
    // exactly like the `data-theme` / `.dark` mechanism in the original CSS tokens —
    // plus, for backend-sourced themes, the real color primaries as inline custom
    // property overrides (highest specificity, wins over the SCSS defaults).
    effect(() => {
      const theme = this.current();
      const body = document.body;
      body.dataset['theme'] = theme.id;
      body.classList.toggle('dark', theme.base === 'dark');
      localStorage.setItem(STORAGE_KEY, theme.id);
      this.applyBackendOverrides(body, theme);
    });
  }

  select(id: ThemeId): void {
    this.themeId.set(id);
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
