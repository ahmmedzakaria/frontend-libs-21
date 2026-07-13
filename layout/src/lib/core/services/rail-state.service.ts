import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RailStateService {
  /** The ONLY control for rail width / header detail-view — driven by the hamburger toggle. */
  readonly expanded = signal(false);

  /** Which module's children are shown inline in the rail — click-only, per the finalized UX. */
  readonly openModuleId = signal<string | null>(null);

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  toggleModule(id: string): void {
    this.openModuleId.update((current) => (current === id ? null : id));
  }
}
