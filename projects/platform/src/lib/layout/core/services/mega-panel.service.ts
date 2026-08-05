import { Injectable, computed, inject, signal } from '@angular/core';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NavTreeItem } from '../models/layout-config.model';
import { resolveNavIcon } from '../models/nav-icon.util';
import { NavTreeStateService } from './nav-tree-state.service';

export interface MegaPanelContent {
  path: number[];
  title: string;
  groupIcon: string;
  description: string | null;
  featureGroups: NavTreeItem[];
}

/**
 * Tree-path-driven mega panel content + open/close state, evolved from the
 * former single-column `RailFlyoutService` into sentinel-kyc-angular-cld's
 * grid-of-feature-groups design — see `MegaPanelComponent`. `path` points at a
 * depth-2 (Category) node in `NavTreeStateService`'s tree; its `children`
 * (Feature Groups) become the panel's grid columns.
 *
 * `description` now sources from the backend's `NavNodeDto.description`
 * (currently populated on `type: 'module'` nodes only) — this replaces
 * sentinel's hardcoded `MODULE_GROUP_NOTES` blurb lookup, which was
 * deliberately dropped when this service was first ported since no backend
 * field carried a description at the time.
 */
@Injectable({ providedIn: 'root' })
export class MegaPanelService {
  private readonly tree = inject(NavTreeStateService);

  readonly origin = signal<CdkOverlayOrigin | null>(null);
  private readonly openPath = signal<number[] | null>(null);

  readonly content = computed<MegaPanelContent | null>(() => {
    const path = this.openPath();
    return path ? this.buildContent(path) : null;
  });

  private closeTimer: ReturnType<typeof setTimeout> | undefined;

  /** `path` must point at a depth-2 Category node. */
  open(path: number[], origin: CdkOverlayOrigin): void {
    clearTimeout(this.closeTimer);
    this.origin.set(origin);
    this.openPath.set(path);
  }

  scheduleClose(delayMs = 220): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => this.openPath.set(null), delayMs);
  }

  cancelClose(): void {
    clearTimeout(this.closeTimer);
  }

  close(): void {
    clearTimeout(this.closeTimer);
    this.openPath.set(null);
  }

  private buildContent(path: number[]): MegaPanelContent | null {
    const moduleGroup = this.tree.getNode(path.slice(0, 1));
    const module = this.tree.getNode(path.slice(0, 2));
    const category = this.tree.getNode(path);
    if (!category) {
      return null;
    }
    const titleSource = module ?? moduleGroup;
    return {
      path,
      title: titleSource ? `${titleSource.label} · ${category.label}` : category.label,
      groupIcon: resolveNavIcon(titleSource),
      description: titleSource?.description ?? null,
      featureGroups: category.children ?? []
    };
  }
}
