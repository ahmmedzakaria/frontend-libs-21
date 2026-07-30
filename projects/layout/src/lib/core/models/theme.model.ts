export type ThemeId = 'light' | 'dark' | 'blue' | 'navy' | 'green' | 'purple' | 'gray';

export interface ThemeDef {
  id: ThemeId;
  label: string;
  /** Structural base — drives which SCSS palette block applies. */
  base: 'light' | 'dark';
  /** Accent swatch shown in the theme picker; 'sun' / 'moon' use an icon instead. */
  swatch: string | 'sun' | 'moon';
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
