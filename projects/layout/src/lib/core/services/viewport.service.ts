import { Injectable, signal } from '@angular/core';

/** Matches `$breakpoint-mobile` in styles/_tokens.scss. */
const DESKTOP_BREAKPOINT_PX = 768;

/**
 * Reactive "are we above the mobile breakpoint" signal, backed by matchMedia
 * rather than a resize listener (fires only on the breakpoint crossing, not
 * every pixel). Ported from sentinel-kyc-angular-cld's ViewportService. Needed
 * wherever a component must pick a fundamentally different rendering strategy
 * per breakpoint, not just different CSS — e.g. the mega panel's row-anchored
 * connected-overlay on desktop vs. a viewport-anchored bottom sheet below it.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  // jsdom (this project's test environment) doesn't implement matchMedia at
  // all, unlike a real browser — guard its existence, not just `window`'s, so
  // any future spec that transitively constructs this service doesn't crash
  // without needing to know to stub it first.
  private readonly mql =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`)
      : null;

  readonly isDesktop = signal(this.mql?.matches ?? true);

  constructor() {
    this.mql?.addEventListener('change', (event) => this.isDesktop.set(event.matches));
  }
}
