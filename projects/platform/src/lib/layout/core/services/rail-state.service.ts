import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RailStateService {
  /** The ONLY control for rail width / header detail-view — driven by the hamburger toggle. Defaults to expanded (detail mode). */
  readonly expanded = signal(true);

  /** Whether the off-canvas rail drawer is open below the mobile breakpoint — separate from `expanded`, which only governs desktop width. */
  readonly mobileOpen = signal(false);

  /** Which module's children are shown inline in the rail — click-only, per the finalized UX. */
  readonly openModuleId = signal<string | null>(null);

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  toggleModule(id: string): void {
    this.openModuleId.update((current) => (current === id ? null : id));
  }
}
