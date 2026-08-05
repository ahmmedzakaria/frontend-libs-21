import { Injectable, computed, inject, signal } from '@angular/core';
import { NavTreeItem } from '../models/layout-config.model';
import { LayoutConfigService } from './layout-config.service';

function pathKey(path: number[]): string {
  return path.join('.');
}

function pathsEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Path-indexed nav tree state (array of child-indices), ported from
 * sentinel-kyc-angular-cld's NavTreeStateService. Depth is interpreted by
 * consumers (RailNavComponent, MegaPanelService) as Module Group (0) / Module (1) /
 * Category (2, mega-panel trigger) / Feature Group (3) / Feature (4, leaf) — see
 * `NavTreeItem`'s doc comment for why there's no explicit `type` field to key off.
 */
@Injectable({ providedIn: 'root' })
export class NavTreeStateService {
  private readonly layoutConfig = inject(LayoutConfigService);

  readonly tree = computed<NavTreeItem[]>(() => this.layoutConfig.navTree());

  /** Path of the currently active node (any depth). Empty = Home/Dashboard. */
  readonly activePath = signal<number[]>([]);
  /** Which rows are expanded inline, keyed by dot-joined path. */
  readonly expandedPaths = signal<Set<string>>(new Set());

  readonly isExpandedToLevel3 = computed(() => {
    const expanded = this.expandedPaths();
    return this.tree().every((group, groupIndex) => {
      const groupPath = [groupIndex];
      if (!expanded.has(pathKey(groupPath))) {
        return false;
      }
      return (group.children ?? []).every((_, moduleIndex) => expanded.has(pathKey(groupPath.concat(moduleIndex))));
    });
  });

  getNode(path: number[]): NavTreeItem | undefined {
    let list: NavTreeItem[] = this.tree();
    let node: NavTreeItem | undefined;
    for (const index of path) {
      node = list[index];
      list = node?.children ?? [];
    }
    return node;
  }

  getChildren(path: number[]): NavTreeItem[] {
    if (!path.length) {
      return this.tree();
    }
    return this.getNode(path)?.children ?? [];
  }

  isExpanded(path: number[]): boolean {
    return this.expandedPaths().has(pathKey(path));
  }

  /** True if `path` is a prefix of (or equal to) the current active path — used to highlight ancestor rows too. */
  isActive(path: number[]): boolean {
    const active = this.activePath();
    return active.length >= path.length && pathsEqual(active.slice(0, path.length), path);
  }

  toggleExpand(path: number[]): void {
    const key = pathKey(path);
    this.expandedPaths.update((set) => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  setActivePath(path: number[]): void {
    this.activePath.set(path);
  }

  expandToLevel3(): void {
    const next = new Set<string>();
    this.tree().forEach((group, groupIndex) => {
      const groupPath = [groupIndex];
      next.add(pathKey(groupPath));
      (group.children ?? []).forEach((_, moduleIndex) => next.add(pathKey(groupPath.concat(moduleIndex))));
    });
    this.expandedPaths.set(next);
  }

  collapseAll(): void {
    this.expandedPaths.set(new Set());
  }

  toggleExpandAllToLevel3(): void {
    this.isExpandedToLevel3() ? this.collapseAll() : this.expandToLevel3();
  }

  resetToHome(): void {
    this.activePath.set([]);
    this.expandedPaths.set(new Set());
  }
}
