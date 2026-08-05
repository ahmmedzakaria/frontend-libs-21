import { Injectable, computed, signal } from '@angular/core';

export type RailMode = 'grouped' | 'flat';

/**
 * Which rail structure to render:
 * - `'grouped'` — Module Group → Module → Category → Mega Panel (sentinel-kyc-angular-cld's
 *   structure, ported in `RailNavComponent`/`MegaPanelComponent`).
 * - `'flat'` — Module → flattened leaf list, no grouping.
 *
 * Backend mapping:
 * - `MODULE_GROUP_MEGA_PANEL` → `grouped`
 * - `MODULE_LIST` → `flat`
 */
@Injectable({ providedIn: 'root' })
export class NavModeService {
  private readonly _mode = signal<RailMode>('grouped');

  readonly mode = computed(() => this._mode());
  readonly grouped = computed(() => this._mode() === 'grouped');

  /** Maps the backend `LayoutProfile.navigationMode` to the rail presentation. */
  applyNavigationMode(value: string | undefined): void {
    if (!value) {
      return;
    }
    const normalized = value.trim().toUpperCase();
    if (normalized === 'MODULE_GROUP_MEGA_PANEL') {
      this._mode.set('grouped');
    } else if (normalized === 'MODULE_LIST') {
      this._mode.set('flat');
    }
  }
}
