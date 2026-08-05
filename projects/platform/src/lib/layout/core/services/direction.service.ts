import { Injectable, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { LayoutConfigService } from './layout-config.service';

const RTL_LANGS = new Set(['ar']);

/**
 * Sets `<html dir>`/`lang` from whichever of two sources calls for RTL: the
 * active Transloco language (`ar`), or the backend layout profile's
 * `rtlEnabled` flag — ORed together, so a backend override can force RTL for a
 * tenant/brand regardless of language, while `ar` keeps working standalone for
 * tenants that don't set the flag. (Assumption: OR, not AND — revisit if a real
 * `rtlEnabled: true` response turns out to mean something else.)
 */
@Injectable({ providedIn: 'root' })
export class DirectionService {
  private readonly transloco = inject(TranslocoService);
  private readonly layoutConfig = inject(LayoutConfigService);
  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang()
  });

  constructor() {
    // Logical-property CSS (margin-inline-start, etc.) throughout the app means
    // flipping this attribute is enough to mirror the rail, mega panel, and header.
    effect(() => {
      const lang = this.activeLang();
      const forced = this.layoutConfig.rtlEnabled();
      const dir = forced || RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
    });
  }
}
