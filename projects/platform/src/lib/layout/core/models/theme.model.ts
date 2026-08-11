import { LayoutThemeChromeOverrides, LayoutThemePrimaries } from './layout-config.model';

export type ThemeId = string;

export interface ThemeDef {
  id: ThemeId;
  label: string;
  /** Structural base — drives which SCSS palette block applies. */
  base: 'light' | 'dark';
  /** Accent swatch shown in the theme picker; 'sun' / 'moon' use an icon instead. */
  swatch: string | 'sun' | 'moon';
  /** Present on backend-sourced themes only — applied as CSS custom property overrides. */
  primaries?: LayoutThemePrimaries;
  chromeOverrides?: LayoutThemeChromeOverrides | null;
}

export const THEMES: ThemeDef[] = [
  { id: 'light', label: 'Light', base: 'light', swatch: 'sun' },
  { id: 'dark', label: 'Dark', base: 'dark', swatch: 'moon' },
  { id: 'blue', label: 'Blue Enterprise', base: 'light', swatch: '#2c5aa0' },
  { id: 'navy', label: 'Navy Banking', base: 'dark', swatch: '#0b1a33' },
  { id: 'green', label: 'Green Compliance', base: 'light', swatch: '#1c7a4c' },
  { id: 'purple', label: 'Purple Corporate', base: 'light', swatch: '#6b3fa0' },
  { id: 'gray', label: 'Gray Professional', base: 'light', swatch: '#3f4a54' }
];

/**
 * The individually-pickable color roles a layout theme is built from — single
 * source of truth for both ThemeService's CSS-var application and any color-
 * editor UI (e.g. ColorPaletteComponent) that lets a user override them.
 */
export interface ThemeColorRoleDef {
  key: string;
  label: string;
  cssVar: string;
}

export const THEME_COLOR_ROLES: ThemeColorRoleDef[] = [
  { key: 'accent', label: 'Primary / Accent', cssVar: '--layout-theme-primary' },
  { key: 'paper', label: 'Background', cssVar: '--layout-theme-bg' },
  { key: 'card', label: 'Surface / Card', cssVar: '--layout-theme-surface' },
  { key: 'text', label: 'Text', cssVar: '--layout-theme-text' },
  { key: 'success', label: 'Success', cssVar: '--layout-theme-success' },
  { key: 'amber', label: 'Warning', cssVar: '--layout-theme-warning' },
  { key: 'red', label: 'Danger', cssVar: '--layout-theme-danger' },
  { key: 'info', label: 'Info / Focus', cssVar: '--layout-theme-focus' }
];
