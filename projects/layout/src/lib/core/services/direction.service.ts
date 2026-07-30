import { DestroyRef, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

const RTL_LANGS = new Set(['ar']);

@Injectable({ providedIn: 'root' })
export class DirectionService {
  constructor(
    private readonly transloco: TranslocoService,
    private readonly destroyRef: DestroyRef
  ) {
    // Logical-property CSS (margin-inline-start, etc.) throughout the app means
    // flipping this attribute is enough to mirror the rail, flyout, and header.
    this.applyDirection(this.transloco.getActiveLang());

    const subscription = this.transloco.langChanges$.subscribe((lang) => {
      this.applyDirection(lang);
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  private applyDirection(lang: string): void {
    const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }
}
