import { describe, expect, it } from 'vitest';
import { findRoutePolicy, isRoutePolicyAllowed, matchesRouteUrl, normalizeRouteUrl } from './route-privilege.guard';
import { RoutePrivilegePolicy } from '../layout/index';

describe('route privilege policy matching', () => {
    const policies: RoutePrivilegePolicy[] = [
        { routeUrl: '/person/:id/edit', matchMode: 'ANY', privilegeCodes: ['update'] },
        { routeUrl: '/person/create', matchMode: 'ANY', privilegeCodes: ['create'] },
        { routeUrl: '/person/:id/preview', matchMode: 'ANY', privilegeCodes: ['view'] }
    ];

    it('normalizes query strings, fragments and trailing slashes', () => {
        expect(normalizeRouteUrl('/person/25/preview/?tab=documents#top')).toBe('/person/25/preview');
    });

    it('matches a parameter segment without spanning path separators', () => {
        expect(matchesRouteUrl('/person/:id/edit', '/person/25/edit')).toBe(true);
        expect(matchesRouteUrl('/person/:id/edit', '/person/25/details/edit')).toBe(false);
    });

    it('prefers a static route over a parameterized route', () => {
        const withAmbiguousPolicy: RoutePrivilegePolicy[] = [
            ...policies,
            { routeUrl: '/person/:id', matchMode: 'ANY', privilegeCodes: ['view'] }
        ];
        expect(findRoutePolicy(withAmbiguousPolicy, '/person/create')?.privilegeCodes).toEqual(['create']);
    });

    it('matches preview URLs after removing query parameters', () => {
        expect(findRoutePolicy(policies, '/person/25/preview?tab=documents')?.privilegeCodes).toEqual(['view']);
    });

    it('supports ANY and ALL while failing closed for missing requirements', () => {
        const granted = new Set(['view']);
        expect(isRoutePolicyAllowed(
            { routeUrl: '/person', matchMode: 'ANY', privilegeCodes: ['view', 'search'] },
            code => granted.has(code)
        )).toBe(true);
        expect(isRoutePolicyAllowed(
            { routeUrl: '/person', matchMode: 'ALL', privilegeCodes: ['view', 'search'] },
            code => granted.has(code)
        )).toBe(false);
        expect(isRoutePolicyAllowed(undefined, code => granted.has(code))).toBe(false);
    });
});
