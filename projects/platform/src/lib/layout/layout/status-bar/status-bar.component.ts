import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { IconComponent } from '../../shared/icon/icon.component';
import { NavTreeStateService } from '../../core/services/nav-tree-state.service';
import { QuickNavService } from '../../core/services/quick-nav.service';
import { FavoriteNavService } from '../../core/services/favorite-nav.service';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBarComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly tree = inject(NavTreeStateService);
  private readonly quickNav = inject(QuickNavService);
  protected readonly favoriteNav = inject(FavoriteNavService);

  protected readonly clock = signal(this.formatTime());

  /** Only a full 5-level feature path resolves to a quick-nav item — mirrors sentinel's currentFeaturePathKey. */
  protected readonly currentItem = computed(() => {
    const path = this.tree.activePath();
    return path.length === 5 ? this.quickNav.getByPathKey(path.join('.')) : undefined;
  });

  constructor() {
    const id = setInterval(() => this.clock.set(this.formatTime()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  toggleFavorite(): void {
    const item = this.currentItem();
    if (item) {
      this.favoriteNav.toggle(item.pathKey);
    }
  }

  private formatTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
