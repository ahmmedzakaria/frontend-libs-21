import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { IconComponent } from '../../shared/icon/icon.component';
import { HeaderDropdownComponent } from './header-dropdown.component';
import { HeaderMenuService } from '../../core/services/header-menu.service';
import { RailStateService } from '../../core/services/rail-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeId } from '../../core/models/theme.model';
import { LayoutService } from '../../layout.service';
import { LayoutConfigService } from '../../core/services/layout-config.service';
import { NavTreeStateService } from '../../core/services/nav-tree-state.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { QuickNavItem, QuickNavService } from '../../core/services/quick-nav.service';
import { FavoriteNavService } from '../../core/services/favorite-nav.service';
import { NotificationService } from '../../../api-common/notification.service';

interface AppTile {
  name: string;
  icon: string;
}

const SSO_APPS: AppTile[] = [
  { name: 'Case Management', icon: 'folder' },
  { name: 'Document Vault', icon: 'document' },
  { name: 'Risk Analytics', icon: 'bar-chart' },
  { name: 'HR Portal', icon: 'users' },
  { name: 'Loan Origination', icon: 'percent' },
  { name: 'Audit Console', icon: 'search' },
  { name: 'Reporting Suite', icon: 'trend' },
  { name: 'Admin Portal', icon: 'gear' },
  { name: 'Helpdesk', icon: 'help' }
];

const TCODE_SEARCH_TYPE = 'T Code';
const SEARCH_TYPES = ['Customer Name', 'National ID', 'Passport', 'Phone', 'Case Number', TCODE_SEARCH_TYPE] as const;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, TranslocoModule, UpperCasePipe, IconComponent, HeaderDropdownComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  protected readonly rail = inject(RailStateService);
  protected readonly menu = inject(HeaderMenuService);
  protected readonly theme = inject(ThemeService);
  protected readonly quickNav = inject(QuickNavService);
  protected readonly favoriteNav = inject(FavoriteNavService);
  private readonly layoutService = inject(LayoutService);
  private readonly transloco = inject(TranslocoService);
  private readonly layoutConfig = inject(LayoutConfigService);
  private readonly tree = inject(NavTreeStateService);
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly brand = computed(() => this.layoutConfig.brand());
  /** Reset whenever the brand changes, so a new backend logo gets a fresh attempt. */
  protected readonly logoFailed = signal(false);

  protected readonly currentUser = computed(() => this.layoutService.currentUser());
  protected readonly userInitials = computed(() => {
    const username = this.currentUser()?.username;
    if (!username) {
      return '??';
    }
    const parts = username.split(/[.\s_-]+/).filter(Boolean);
    const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : username.slice(0, 2);
    return initials.toUpperCase();
  });

  protected readonly searchTypes = SEARCH_TYPES;
  protected readonly searchType = signal<(typeof SEARCH_TYPES)[number]>('Customer Name');
  protected readonly searchQuery = signal('');

  protected readonly isTCodeSearch = computed(() => this.searchType() === TCODE_SEARCH_TYPE);
  /** T-code datalist matches — mirrors sentinel's renderTCodeList(). */
  protected readonly tcodeOptions = computed<QuickNavItem[]>(() =>
    this.isTCodeSearch() ? this.quickNav.search(this.searchQuery()) : []
  );

  protected readonly apps = SSO_APPS;
  protected readonly tenants = ['Prime Bank Ltd.', 'Northgate Finance', 'Meridian Trust Co.'];
  protected readonly activeTenant = signal(this.tenants[0]);

  protected readonly languages: { code: string; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ar', label: 'العربية' }
  ];

  runSearch(): void {
    if (!this.rail.expanded()) {
      this.rail.toggle();
      return;
    }
    if (this.isTCodeSearch()) {
      this.runTCodeSearch();
      return;
    }
    // Wire to a real search service/route here — the POC only simulated this.
    console.info('Searching', this.searchType(), this.searchQuery());
  }

  private runTCodeSearch(): void {
    const code = this.searchQuery().trim();
    const item = this.quickNav.findByCode(code);
    if (!item) {
      this.notifications.notify({ level: 'error', text: 'Invalid T-code.' });
      return;
    }
    this.goToQuickNavItem(item);
  }

  /** Jumps straight to a feature leaf — shared by T-code search and the Favorites dropdown. */
  goToQuickNavItem(item: QuickNavItem): void {
    this.tree.setActivePath(item.path);
    this.breadcrumb.set(item.labels.slice(0, -1), item.label);
    this.searchQuery.set(item.code);
    this.menu.close();

    const feature = this.tree.getNode(item.path);
    if (feature?.route) {
      this.router.navigateByUrl('/' + feature.route);
    }
  }

  selectTenant(name: string): void {
    this.activeTenant.set(name);
    this.menu.close();
  }

  selectLanguage(code: string): void {
    this.transloco.setActiveLang(code);
    this.menu.close();
  }

  selectTheme(id: ThemeId): void {
    this.theme.select(id);
    this.menu.close();
  }

  onLogoError(): void {
    this.logoFailed.set(true);
  }

  launchApp(name: string): void {
    this.menu.close();
    // Real implementation redirects through the SSO broker with a signed token.
    console.info('Redirecting to', name, 'via SSO');
  }

  logout(): void {
    this.menu.close();
    this.layoutService.requestLogout();
  }
}
