import { CATALOG_ROUTE_MANIFEST } from './catalog-route-manifest';

describe('CATALOG_ROUTE_MANIFEST', () => {
  it('contains unique route paths', () => {
    const paths = CATALOG_ROUTE_MANIFEST.map(route => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('prerenders every public launch route', () => {
    expect(CATALOG_ROUTE_MANIFEST.every(route => route.prerender)).toBe(true);
  });
});
