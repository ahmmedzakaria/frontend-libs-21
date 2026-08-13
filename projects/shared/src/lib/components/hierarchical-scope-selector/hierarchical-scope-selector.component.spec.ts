import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { HierarchicalScopeSelectorComponent, HierarchicalScopeValue } from './hierarchical-scope-selector.component';

describe('HierarchicalScopeSelectorComponent', () => {
    function create(): ComponentFixture<HierarchicalScopeSelectorComponent> {
        TestBed.configureTestingModule({ imports: [HierarchicalScopeSelectorComponent] });
        const fixture = TestBed.createComponent(HierarchicalScopeSelectorComponent);
        fixture.componentRef.setInput('loadTenants', () => of([{ id: 1, label: 'Tenant 1' }, { id: 2, label: 'Tenant 2' }]));
        fixture.componentRef.setInput('loadBusinesses', (tenantId: number) => of([{ id: tenantId * 10, label: `Business ${tenantId}` }]));
        fixture.componentRef.setInput('loadBranches', (_tenantId: number, businessId: number) => of([{ id: businessId * 10, label: 'Branch' }]));
        fixture.detectChanges();
        return fixture;
    }

    it('clears descendants when a parent changes', () => {
        const fixture = create();
        const component = fixture.componentInstance;
        const changes: Array<HierarchicalScopeValue | null> = [];
        component.registerOnChange(value => changes.push(value));
        component.writeValue({ tenantId: 1, businessId: 10, branchId: 100 });
        fixture.detectChanges();

        const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
        selects[0].value = '2';
        selects[0].dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(changes.at(-1)).toEqual({ tenantId: 2, businessId: null, branchId: null });

        selects[1].value = '20';
        selects[1].dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(changes.at(-1)).toEqual({ tenantId: 2, businessId: 20, branchId: null });
    });

    it('normalizes structurally invalid values instead of widening scope', () => {
        const fixture = create();
        fixture.componentInstance.writeValue({ tenantId: 1, businessId: null, branchId: 99 });
        expect(fixture.componentInstance.value()).toEqual({ tenantId: 1, businessId: null, branchId: null });
    });
});
