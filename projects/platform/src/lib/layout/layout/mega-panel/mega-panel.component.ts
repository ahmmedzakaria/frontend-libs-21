import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { IconComponent } from '../../shared/icon/icon.component';
import { MegaPanelService } from '../../core/services/mega-panel.service';
import { NavTreeStateService } from '../../core/services/nav-tree-state.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NavTreeItem } from '../../core/models/layout-config.model';

@Component({
  selector: 'app-mega-panel',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './mega-panel.component.html',
  styleUrl: './mega-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MegaPanelComponent {
  protected readonly panel = inject(MegaPanelService);
  private readonly tree = inject(NavTreeStateService);
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly router = inject(Router);

  onEnter(): void {
    this.panel.cancelClose();
  }

  onLeave(): void {
    this.panel.scheduleClose();
  }

  /**
   * `categoryPath` is the depth-2 Category node's path; `groupIndex`/`featureIndex`
   * locate the clicked leaf within that category's feature-group grid.
   */
  selectFeature(categoryPath: number[], groupIndex: number, featureIndex: number, feature: NavTreeItem): void {
    const fullPath = categoryPath.concat(groupIndex, featureIndex);
    const labels = fullPath.map((_, i) => this.tree.getNode(fullPath.slice(0, i + 1))?.label ?? '');
    this.tree.setActivePath(fullPath);
    this.breadcrumb.set(labels, feature.label);

    const route = feature.route;
    if (route) {
      if (/^https?:\/\//i.test(route)) {
        window.location.href = route;
      } else {
        this.router.navigateByUrl(route.startsWith('/') ? route : `/${route}`);
      }
    }
    this.panel.close();
  }
}
