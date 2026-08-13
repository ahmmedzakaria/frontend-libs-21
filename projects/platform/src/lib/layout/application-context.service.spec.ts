import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from '../api-common/index';
import { ApplicationAuthorizationContext, ApplicationContextService } from './application-context.service';

const VALID_CONTEXT: ApplicationAuthorizationContext = {
    clientCode: 'WEB',
    clientType: 'WEB',
    effectiveTenant: {
        tenantId: 7,
        tenantCode: 'TENANT_7',
        hostname: 'tenant.example.test',
        scopeAssignments: [{ tenantId: 7, businessId: 3, branchId: null }]
    },
    privilegeCodes: ['VIEW'],
    routePolicies: [{ routeUrl: '/person', matchMode: 'ANY', privilegeCodes: ['VIEW'] }],
    uiPolicies: [{ actionCode: ' Person.List.View ', matchMode: 'ANY', privilegeCodes: ['VIEW'] }]
};

describe('ApplicationContextService', () => {
    beforeEach(() => {
        ['clientCode', 'clientType', 'privilegeCodes', 'routePolicies', 'uiPolicies',
            'layoutConfig', 'effectiveTenant', 'authorizationVersion']
            .forEach(key => localStorage.removeItem(key));
    });

    function create(post: ReturnType<typeof vi.fn> = vi.fn(() => of(VALID_CONTEXT))) {
        TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: { post } }] });
        return { service: TestBed.inject(ApplicationContextService), post };
    }

    it('does not trust persisted authorization state before a live request', () => {
        localStorage.setItem('privilegeCodes', JSON.stringify(['STALE_ADMIN']));
        const { service } = create();
        expect(service.loaded()).toBe(false);
        expect(service.hasPrivilege('STALE_ADMIN')).toBe(false);
    });

    it('validates, normalizes and exposes one live authorization context', () => {
        const { service } = create();
        service.ensureLoaded().subscribe();
        expect(service.loaded()).toBe(true);
        expect(service.hasPrivilege('VIEW')).toBe(true);
        expect(service.uiPolicies()[0].actionCode).toBe('person.list.view');
        expect(service.effectiveTenant()?.scopeAssignments[0].businessId).toBe(3);
    });

    it('shares concurrent loads and refreshes through one request', () => {
        const response = new Subject<ApplicationAuthorizationContext>();
        const post = vi.fn(() => response.asObservable());
        const { service } = create(post);
        service.ensureLoaded().subscribe();
        service.ensureLoaded().subscribe();
        expect(post).toHaveBeenCalledTimes(1);
        response.next(VALID_CONTEXT);
        response.complete();
    });

    it('fails closed and clears cached state for malformed context', () => {
        localStorage.setItem('privilegeCodes', JSON.stringify(['STALE_ADMIN']));
        const { service } = create(vi.fn(() => of({ clientCode: 'WEB' })));
        let receivedError: unknown;
        service.ensureLoaded().subscribe({ error: error => receivedError = error });
        expect(receivedError).toBeInstanceOf(Error);
        expect(service.context()).toBeNull();
        expect(localStorage.getItem('privilegeCodes')).toBeNull();
    });
});
