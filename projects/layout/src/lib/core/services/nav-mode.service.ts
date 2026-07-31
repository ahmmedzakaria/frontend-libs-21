import { Injectable, computed, signal } from '@angular/core';

/**
 * Whether the rail nav renders module-grouped (Operation/Setup/Report flyouts) or
 * flat (single-click list). Driven by `enabledModules` from `system/privilege/context` —
 * empty/absent means the backend hasn't opted this client into grouped navigation, so we
 * default to flat. A dedicated backend layout submodule will replace this signal later.
 */
@Injectable({ providedIn: 'root' })
export class NavModeService {
  private readonly _enabledModules = signal<string[]>([]);

  readonly grouped = computed(() => this._enabledModules().length > 0);

  setEnabledModules(modules: string[]): void {
    this._enabledModules.set(modules || []);
  }
}
