import { firstValueFrom } from 'rxjs';
import { CatalogTenantContext } from '../models/catalog-core.models';
import { FixtureCatalogContentSource } from './fixture-catalog-content-source';

describe('FixtureCatalogContentSource', () => {
  const source = new FixtureCatalogContentSource();
  const context: CatalogTenantContext = {
    siteKey: 'nexacore-solutions-demo',
    hostname: 'catalog.localhost',
    locale: 'en',
  };

  it('filters and pages published fixture products', async () => {
    const result = await firstValueFrom(source.getProducts(context, {
      categorySlug: 'structured-cabling',
      page: 0,
      size: 1,
    }));

    expect(result.items).toHaveLength(1);
    expect(result.totalItems).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it('uses the requested locale when searching translations', async () => {
    const result = await firstValueFrom(source.getProducts({ ...context, locale: 'bn' }, {
      query: 'ফাইবার',
      page: 0,
      size: 10,
    }));

    expect(result.items.map(item => item.slug)).toEqual(['high-density-fiber-panel']);
  });

  it('fails closed when fixture hostname does not match', () => {
    expect(() => source.getSite({ ...context, hostname: 'unknown.localhost' }))
      .toThrowError('Fixture tenant context does not match the configured catalog site.');
  });

  it('returns localized home content', async () => {
    const page = await firstValueFrom(source.getPage({ ...context, locale: 'bn' }, ''));
    expect(page?.locale).toBe('bn');
  });
});
