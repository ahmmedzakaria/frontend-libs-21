import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ApplicationContextService, UiPrivilegePolicy } from '../layout/index';
import { AuthService } from './auth.service';
import { AuthorizedUiDirective } from './authorized-ui.directive';

@Component({
    standalone: true,
    imports: [AuthorizedUiDirective],
    template: `<button *appAuthorizedUi="'person.list.delete-button'">Delete</button>`
})
class HostComponent {}

describe('AuthorizedUiDirective', () => {
    it('renders only when the backend policy is satisfied', () => {
        const policies = signal<UiPrivilegePolicy[]>([{
            actionCode: 'person.list.delete-button',
            matchMode: 'ANY',
            privilegeCodes: ['delete']
        }]);
        const granted = new Set<string>();
        TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [
                { provide: ApplicationContextService, useValue: { uiPolicies: policies } },
                { provide: AuthService, useValue: { hasPrivilege: (code: string) => granted.has(code) } }
            ]
        });
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('button')).toBeNull();

        granted.add('delete');
        policies.set([...policies()]);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('button')?.textContent).toContain('Delete');

        policies.set([]);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('button')).toBeNull();
    });
});
