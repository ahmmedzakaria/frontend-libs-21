import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';

import { IconComponent } from '../../shared/icon/icon.component';
import { NavCategory, NavItem, NavModule } from '../../core/models/nav-module.model';
import { RailStateService } from '../../core/services/rail-state.service';
import { RailFlyoutService } from '../../core/services/rail-flyout.service';
import { SidebarMenuItem, SidebarMenuService } from '../../sidebar-menu.service';

const CATEGORY_ICON: Record<NavCategory, string> = {
  Operation: 'bolt',
  Setup: 'gear',
  Report: 'bar-chart'
};

@Component({
  selector: 'app-rail-nav',
  standalone: true,
  imports: [TranslocoModule, IconComponent, OverlayModule],
  templateUrl: './rail-nav.component.html',
  styleUrl: './rail-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RailNavComponent {
  protected readonly rail = inject(RailStateService);
  protected readonly flyout = inject(RailFlyoutService);
  protected readonly modules = signal<NavModule[]>([]);
  protected readonly loading = signal(true);
  protected readonly categoryIcon = CATEGORY_ICON;

  private readonly router = inject(Router);
  private readonly sidebarMenu = inject(SidebarMenuService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const cachedMenus = this.sidebarMenu.getCachedSidebarMenu();
    if (cachedMenus.length) {
      this.modules.set(this.toNavModules(cachedMenus));
    }

    const subscription = this.sidebarMenu.loadSidebarMenu().subscribe({
      next: (menus) => {
        this.modules.set(this.toNavModules(menus || []));
        this.loading.set(false);
      },
      error: () => {
        this.modules.set(this.toNavModules(cachedMenus));
        this.loading.set(false);
      }
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected categories(moduleId: string): NavCategory[] {
    const mod = this.modules().find((m) => m.id === moduleId);
    return mod ? (Object.keys(mod.categories) as NavCategory[]) : [];
  }

  protected hasCategories(moduleId: string): boolean {
    return this.categories(moduleId).length > 0;
  }

  protected toggleModule(mod: NavModule): void {
    if (this.hasCategories(mod.id)) {
      this.rail.toggleModule(mod.id);
      return;
    }

    this.navigateTo(mod.path);
  }

  protected openCategory(moduleId: string, category: NavCategory, origin: CdkOverlayOrigin): void {
    const mod = this.modules().find((m) => m.id === moduleId);
    const items = mod?.categories[category] ?? [];
    this.flyout.open({ moduleId, moduleLabel: mod?.label ?? '', category, items }, origin);
  }

  protected selectItem(path: string | undefined): void {
    this.navigateTo(path);
    this.flyout.close();
  }

  private toNavModules(menus: SidebarMenuItem[]): NavModule[] {
    const modulesByKey = new Map<string, NavModule>();

    this.sortMenus(menus).forEach((menu) => {
      const category = this.toCategory(menu.label);

      if (category) {
        this.sortMenus(menu.children || []).forEach((child) => {
          const module = this.getOrCreateModule(modulesByKey, child);
          module.categories[category] = this.toCategoryItems(child);
        });
        return;
      }

      const module = this.getOrCreateModule(modulesByKey, menu);
      const categoryChildren = this.sortMenus(menu.children || []).filter((child) => this.toCategory(child.label));

      if (categoryChildren.length) {
        categoryChildren.forEach((child) => {
          const childCategory = this.toCategory(child.label);
          if (childCategory) {
            module.categories[childCategory] = this.toCategoryItems(child);
          }
        });
        return;
      }

      module.categories.Operation = this.toCategoryItems(menu);
    });

    return Array.from(modulesByKey.values()).filter((module) => {
      return module.path || Object.values(module.categories).some((items) => (items || []).length > 0);
    });
  }

  private getOrCreateModule(modulesByKey: Map<string, NavModule>, item: SidebarMenuItem): NavModule {
    const key = this.toModuleId(item);
    const existing = modulesByKey.get(key);
    if (existing) {
      return existing;
    }

    const module: NavModule = {
      id: key,
      label: item.label,
      path: item.path,
      icon: this.toIconName(item.icon, item.label),
      categories: {}
    };
    modulesByKey.set(key, module);
    return module;
  }

  private toCategoryItems(item: SidebarMenuItem): NavItem[] {
    const children = this.sortMenus(item.children || []);
    const source = children.length ? children : item.path ? [item] : [];

    return source.map((child) => ({
      label: child.label,
      path: child.path,
      icon: this.toIconName(child.icon, child.label)
    }));
  }

  private sortMenus(items: SidebarMenuItem[]): SidebarMenuItem[] {
    return [...items].sort((a, b) => {
      const aOrder = a.menuOrder ?? a.subMenuOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.menuOrder ?? b.subMenuOrder ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder || a.label.localeCompare(b.label);
    });
  }

  private toCategory(label: string): NavCategory | null {
    const normalized = label.trim().toLowerCase();
    if (['operation', 'operations'].includes(normalized)) {
      return 'Operation';
    }
    if (['setup', 'setups'].includes(normalized)) {
      return 'Setup';
    }
    if (['report', 'reports'].includes(normalized)) {
      return 'Report';
    }
    return null;
  }

  private toModuleId(item: SidebarMenuItem): string {
    const source = item.path || item.label;
    return source
      .replace(/^\//, '')
      .split('/')[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'menu';
  }

  private toIconName(icon: string | undefined, label: string): string {
    const source = `${icon || ''} ${label}`.toLowerCase();

    if (source.includes('dashboard') || source.includes('home')) return 'home';
    if (source.includes('person') || source.includes('user') || source.includes('customer')) return 'users';
    if (source.includes('kyc') || source.includes('id-card') || source.includes('id card')) return 'id-card';
    if (source.includes('setup') || source.includes('setting') || source.includes('gear') || source.includes('cog')) return 'gear';
    if (source.includes('report') || source.includes('chart') || source.includes('table')) return 'bar-chart';
    if (source.includes('search') || source.includes('list')) return 'search';
    if (source.includes('document') || source.includes('file')) return 'document';
    if (source.includes('folder')) return 'folder';

    return 'help';
  }

  private navigateTo(path: string | undefined): void {
    if (!path) {
      return;
    }

    if (/^https?:\/\//i.test(path)) {
      window.location.href = path;
      return;
    }

    this.router.navigateByUrl(path.startsWith('/') ? path : `/${path}`);
  }
}
