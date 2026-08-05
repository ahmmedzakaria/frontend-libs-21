import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { RailNavComponent } from './rail-nav.component';
import { ApplicationContext, ApplicationContextService } from '../../application-context.service';
import { NavModeService } from '../../core/services/nav-mode.service';
import { BackendLayoutConfig, NavTreeItem } from '../../core/models/layout-config.model';

const NAV_TREE: NavTreeItem[] = [
  { code: 'DASHBOARD', label: 'Dashboard', type: 'feature', route: '/dashboard', privilegeCodes: [], children: [] },
  {
    code: 'CUSTOMERS',
    label: 'Customers',
    type: 'module',
    route: null,
    privilegeCodes: [],
    children: [
      { code: 'CUSTOMER_LIST', label: 'List', type: 'feature', route: '/customers/list', privilegeCodes: [], children: [] },
      { code: 'CUSTOMER_CREATE', label: 'New', type: 'feature', route: '/customers/new', privilegeCodes: [], children: [] }
    ]
  }
];

function stubApplicationContextService(
  navigationMode?: 'MODULE_LIST' | 'MODULE_GROUP_MEGA_PANEL'
): Partial<ApplicationContextService> {
  const layout: BackendLayoutConfig = {
    activeProfileCode: 'DEFAULT',
    availableProfiles: [{ code: 'DEFAULT', navigationMode, brand: { displayName: '', shortName: '' } }],
    navTree: NAV_TREE
  };

  const layoutConfigSignal = signal<BackendLayoutConfig | null>(null);

  return {
    layoutConfig: layoutConfigSignal,
    getCachedLayoutConfig: () => layoutConfigSignal(),
    setLayoutConfig: (config) => layoutConfigSignal.set(config),
    load: () =>
      of({
        privilegeCodes: [],
        layout
      } as ApplicationContext)
  };
}

describe('RailNavComponent', () => {
  it('defaults to grouped mode and expands depth-0 rows to reveal their children inline', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ApplicationContextService, useValue: stubApplicationContextService() }
      ]
    });

    const fixture = TestBed.createComponent(RailNavComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const navMode = TestBed.inject(NavModeService);

    expect(navMode.grouped()).toBe(true);

    const rowsBeforeExpand = component['visibleRows']();
    expect(rowsBeforeExpand.map((r: any) => r.node.label)).toEqual(['Dashboard', 'Customers']);
    expect(rowsBeforeExpand[0].isLeaf).toBe(true);
    expect(rowsBeforeExpand[1].isLeaf).toBe(false);

    // Customers (depth 0, index 1) has real children but no grandchildren, so it
    // never reaches a depth-2 "Category" row — it degrades to an inline list,
    // same shallow-tree behavior supported for a 2-3 level backend nav tree.
    component['onRowClick'](rowsBeforeExpand[1]);
    const rowsAfterExpand = component['visibleRows']();
    expect(rowsAfterExpand.map((r: any) => r.node.label)).toEqual(['Dashboard', 'Customers', 'List', 'New']);
    expect(rowsAfterExpand[2].depth).toBe(1);
  });

  it('switches to flat mode when the backend navigationMode says so, flattening all descendant leaves', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ApplicationContextService, useValue: stubApplicationContextService('MODULE_LIST') }
      ]
    });

    const fixture = TestBed.createComponent(RailNavComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const navMode = TestBed.inject(NavModeService);

    expect(navMode.grouped()).toBe(false);
    expect(component['flatItems'](0).map((i: NavTreeItem) => i.label)).toEqual(['Dashboard']);
    expect(component['flatItems'](1).map((i: NavTreeItem) => i.label)).toEqual(['List', 'New']);
  });
});
