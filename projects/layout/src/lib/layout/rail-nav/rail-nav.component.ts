import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';

import { IconComponent } from '../../shared/icon/icon.component';
import { MegaPanelComponent } from '../mega-panel/mega-panel.component';
import { resolveNavIcon } from '../../core/models/nav-icon.util';
import { RailStateService } from '../../core/services/rail-state.service';
import { MegaPanelService } from '../../core/services/mega-panel.service';
import { NavTreeStateService } from '../../core/services/nav-tree-state.service';
import { NavModeService } from '../../core/services/nav-mode.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { LayoutConfigService } from '../../core/services/layout-config.service';
import { ViewportService } from '../../core/services/viewport.service';
import { NavTreeItem } from '../../core/models/layout-config.model';
import { ApplicationContextService } from '../../application-context.service';

/** A row in the grouped (Module Group → Module → Category) rail. Depth 0/1 render
 * inline and expand/collapse; depth 2 (Category) opens the mega panel instead.
 * Any node with no `children` renders as a directly-clickable leaf regardless of
 * depth — the graceful-degradation path for real backend trees shallower than 3
 * levels (see NavTreeStateService's doc comment). */
interface RailRow {
  path: number[];
  depth: number;
  node: NavTreeItem;
  isLeaf: boolean;
}

@Component({
  selector: 'app-rail-nav',
  standalone: true,
  imports: [IconComponent, OverlayModule, MegaPanelComponent],
  templateUrl: './rail-nav.component.html',
  styleUrl: './rail-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RailNavComponent {
  protected readonly rail = inject(RailStateService);
  protected readonly megaPanel = inject(MegaPanelService);
  protected readonly navMode = inject(NavModeService);
  protected readonly treeState = inject(NavTreeStateService);
  protected readonly viewport = inject(ViewportService);
  protected readonly loading = signal(true);
  protected readonly resolveNavIcon = resolveNavIcon;

  private readonly router = inject(Router);
  private readonly applicationContext = inject(ApplicationContextService);
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly layoutConfig = inject(LayoutConfigService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const subscription = this.applicationContext.load().subscribe({
      next: (context) => {
        this.layoutConfig.apply(context?.layout);
        const activeProfile = context?.layout?.availableProfiles?.find(
          (p) => p.code === context?.layout?.activeProfileCode
        );
        this.navMode.applyNavigationMode(activeProfile?.navigationMode);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  /** Depth-based row flattening — mirrors sentinel-kyc-angular-cld's `visibleRows`. */
  protected readonly visibleRows = computed<RailRow[]>(() => {
    const detail = this.rail.expanded();
    this.treeState.expandedPaths(); // register as a dependency
    const rows: RailRow[] = [];
    this.buildRows(this.treeState.tree(), [], 0, detail, rows);
    return rows;
  });

  private buildRows(nodes: NavTreeItem[], path: number[], depth: number, detail: boolean, rows: RailRow[]): void {
    nodes.forEach((node, index) => {
      const nodePath = path.concat(index);
      const hasChildren = !!node.children?.length;
      rows.push({ path: nodePath, depth, node, isLeaf: !hasChildren });

      if (!hasChildren || depth >= 2) {
        // Leaf, or a Category row (depth 2) — its children render via the mega
        // panel, not inline.
        return;
      }
      if (!detail || !this.treeState.isExpanded(nodePath)) {
        return;
      }
      this.buildRows(node.children!, nodePath, depth + 1, detail, rows);
    });
  }

  protected onRowClick(row: RailRow): void {
    this.treeState.setActivePath(row.path);
    if (row.isLeaf) {
      this.navigateTo(this.itemRoute(row.node), this.labelsForPath(row.path.slice(0, -1)), row.node.label);
      return;
    }
    this.treeState.toggleExpand(row.path);
  }

  protected onCategoryHover(row: RailRow, origin: CdkOverlayOrigin): void {
    this.megaPanel.open(row.path, origin);
  }

  protected onCategoryClick(row: RailRow, origin: CdkOverlayOrigin): void {
    this.treeState.setActivePath(row.path);
    this.megaPanel.open(row.path, origin);
  }

  /** Flat mode: every top-level node becomes an accordion row; all of its descendant
   * leaves (any depth) flatten directly underneath — no fixed "category" concept. */
  protected flatItems(index: number): NavTreeItem[] {
    const node = this.treeState.tree()[index];
    return node ? this.flattenLeaves(node) : [];
  }

  protected toggleFlatModule(index: number, mod: NavTreeItem): void {
    const items = this.flatItems(index);
    if (items.length > 1) {
      this.rail.toggleModule(String(index));
      return;
    }
    const first = items[0];
    this.navigateTo(first ? this.itemRoute(first) : this.itemRoute(mod), first ? [mod.label] : [], first?.label ?? mod.label);
  }

  protected selectFlatItem(index: number, mod: NavTreeItem, item: NavTreeItem): void {
    this.navigateTo(this.itemRoute(item), [mod.label], item.label);
    if (this.rail.openModuleId() === String(index)) {
      this.rail.toggleModule(String(index));
    }
  }

  private flattenLeaves(node: NavTreeItem): NavTreeItem[] {
    if (!node.children?.length) {
      return this.itemRoute(node) ? [node] : [];
    }
    return node.children.flatMap((child) => this.flattenLeaves(child));
  }

  protected itemRoute(item: NavTreeItem): string | undefined {
    return item.route ?? undefined;
  }

  private labelsForPath(path: number[]): string[] {
    return path.map((_, i) => this.treeState.getNode(path.slice(0, i + 1))?.label ?? '');
  }

  private navigateTo(path: string | undefined, labels: string[], title: string): void {
    if (!path) {
      return;
    }

    this.rail.closeMobile();
    this.breadcrumb.set(labels, title);

    if (/^https?:\/\//i.test(path)) {
      window.location.href = path;
      return;
    }

    this.router.navigateByUrl(path.startsWith('/') ? path : `/${path}`);
  }
}
