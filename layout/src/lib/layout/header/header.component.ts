import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { IconComponent } from '../../shared/icon/icon.component';
import { HeaderDropdownComponent } from './header-dropdown.component';
import { HeaderMenuService } from '../../core/services/header-menu.service';
import { RailStateService } from '../../core/services/rail-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeId } from '../../core/models/theme.model';

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

const SEARCH_TYPES = ['Customer Name', 'National ID', 'Passport', 'Phone', 'Case Number'] as const;

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
  private readonly transloco = inject(TranslocoService);

  protected readonly searchTypes = SEARCH_TYPES;
  protected readonly searchType = signal<(typeof SEARCH_TYPES)[number]>('Customer Name');
  protected readonly searchQuery = signal('');

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
    // Wire to a real search service/route here — the POC only simulated this.
    console.info('Searching', this.searchType(), this.searchQuery());
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

  launchApp(name: string): void {
    this.menu.close();
    // Real implementation redirects through the SSO broker with a signed token.
    console.info('Redirecting to', name, 'via SSO');
  }

  logout(): void {
    if (confirm('Log out of Sentinel KYC?')) {
      // Real implementation clears the session and redirects to the IdP logout endpoint.
      console.info('Logging out');
    }
  }
}
