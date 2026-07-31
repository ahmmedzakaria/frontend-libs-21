import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { RailNavComponent } from './rail-nav.component';
import { SidebarMenuService, ApplicationContext } from '../../sidebar-menu.service';
import { NavModeService } from '../../core/services/nav-mode.service';

const FLAT_MENUS = [
  { label: 'Dashboard', path: '/dashboard', menuOrder: 1 },
  {
    label: 'Customers',
    path: '/customers',
    menuOrder: 2,
    children: [
      { label: 'List', path: '/customers/list', menuOrder: 1 },
      { label: 'New', path: '/customers/new', menuOrder: 2 }
    ]
  }
];

function stubSidebarMenuService(context: Partial<ApplicationContext>): Partial<SidebarMenuService> {
  return {
    getCachedSidebarMenu: () => [],
    getCachedEnabledModules: () => context.enabledModules || [],
    loadApplicationContext: () =>
      of({
        menus: context.menus || [],
        privilegeCodes: [],
        enabledModules: context.enabledModules || [],
        enabledSubmodules: [],
        enabledFeatures: []
      } as ApplicationContext)
  };
}

describe('RailNavComponent', () => {
  it('renders flat (single-click) items when enabledModules is empty', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SidebarMenuService, useValue: stubSidebarMenuService({ menus: FLAT_MENUS, enabledModules: [] }) }
      ]
    });

    const fixture = TestBed.createComponent(RailNavComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const navMode = TestBed.inject(NavModeService);

    expect(navMode.grouped()).toBe(false);

    const dashboardModule = component['modules']().find((m) => m.id === 'dashboard')!;
    const customersModule = component['modules']().find((m) => m.id === 'customers')!;

    // Dashboard has no real children -> should be a direct link, not expandable.
    expect(component['hasExpandableChildren'](dashboardModule.id)).toBe(false);

    // Customers has 2 real children -> should expand to a flat list (no Operation/Setup/Report categories).
    expect(component['hasExpandableChildren'](customersModule.id)).toBe(true);
    expect(component['flatItems'](customersModule.id).map((i) => i.label)).toEqual(['List', 'New']);
  });

  it('keeps grouped/category behavior when enabledModules is populated', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: SidebarMenuService,
          useValue: stubSidebarMenuService({ menus: FLAT_MENUS, enabledModules: ['compliance'] })
        }
      ]
    });

    const fixture = TestBed.createComponent(RailNavComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const navMode = TestBed.inject(NavModeService);

    expect(navMode.grouped()).toBe(true);

    const customersModule = component['modules']().find((m) => m.id === 'customers')!;
    expect(component['hasExpandableChildren'](customersModule.id)).toBe(component['hasCategories'](customersModule.id));
  });
});
