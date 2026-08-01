import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DirectionService } from '../core/services/direction.service';
import { RailStateService } from '../core/services/rail-state.service';
import { LayoutConfigService } from '../core/services/layout-config.service';
import { HeaderComponent } from './header/header.component';
import { RailNavComponent } from './rail-nav/rail-nav.component';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, RailNavComponent, StatusBarComponent, BreadcrumbComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent {
  private readonly direction = inject(DirectionService);
  protected readonly rail = inject(RailStateService);
  protected readonly layoutConfig = inject(LayoutConfigService);
}
