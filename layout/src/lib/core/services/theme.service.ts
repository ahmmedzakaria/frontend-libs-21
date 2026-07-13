import { Injectable, computed, effect, signal } from '@angular/core';
import { THEMES, ThemeDef, ThemeId } from '../models/theme.model';

const STORAGE_KEY = 'sentinel-kyc.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes: readonly ThemeDef[] = THEMES;

  /** Local UI state — a signal, per scope (no RxJS needed for synchronous state like this). */
  private readonly themeId = signal<ThemeId>(this.readInitialTheme());

  readonly current = computed<ThemeDef>(
    () => this.themes.find((t) => t.id === this.themeId()) ?? this.themes[0]
  );

  constructor() {
    // Reflect the active theme onto <body> as a data attribute + structural class,
    // exactly like the `data-theme` / `.dark` mechanism in the original CSS tokens.
    effect(() => {
      const theme = this.current();
      const body = document.body;
      body.dataset['theme'] = theme.id;
      body.classList.toggle('dark', theme.base === 'dark');
      localStorage.setItem(STORAGE_KEY, theme.id);
    });
  }

  select(id: ThemeId): void {
    this.themeId.set(id);
  }

  private readInitialTheme(): ThemeId {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    return saved && THEMES.some((t) => t.id === saved) ? saved : 'light';
  }
}
