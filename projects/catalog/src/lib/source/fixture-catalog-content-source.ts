import { Observable, of } from 'rxjs';
import { CatalogPageView, CatalogTenantContext } from '../models/catalog-core.models';
import {
  CatalogArticleSummaryView,
  CatalogGalleryItemView,
  CatalogOrganizationView,
  CatalogPageContentView,
  CatalogServiceView,
} from '../models/catalog-content.models';
import {
  CatalogCategoryView,
  CatalogProductDetailView,
  CatalogProductFilter,
  CatalogProductSummaryView,
} from '../models/catalog-product.models';
import { CatalogSiteView } from '../models/catalog-site.models';
import { CATALOG_FIXTURES, CatalogFixtureSet } from '../fixtures/catalog-fixtures';
import { CatalogContentSource } from './catalog-content-source';

export class FixtureCatalogContentSource extends CatalogContentSource {
  constructor(private readonly fixtures: CatalogFixtureSet = CATALOG_FIXTURES) {
    super();
  }

  override getSite(context: CatalogTenantContext): Observable<CatalogSiteView> {
    this.assertContext(context);
    return of(this.fixtures.site);
  }

  override getCategories(context: CatalogTenantContext): Observable<readonly CatalogCategoryView[]> {
    this.assertContext(context);
    return of(this.fixtures.categories);
  }

  override getProducts(
    context: CatalogTenantContext,
    filter: CatalogProductFilter,
  ): Observable<CatalogPageView<CatalogProductSummaryView>> {
    this.assertContext(context);
    const query = filter.query?.trim().toLocaleLowerCase(context.locale);
    const matching = this.fixtures.products.filter(product => {
      const inCategory = !filter.categorySlug || product.categorySlug === filter.categorySlug;
      const inBrand = !filter.brandSlug || product.brand?.slug === filter.brandSlug;
      const isFeatured = filter.featured === undefined || product.featured === filter.featured;
      const matchesQuery = !query || product.translations.some(translation =>
        translation.locale === context.locale
        && `${translation.name} ${translation.summary ?? ''}`.toLocaleLowerCase(context.locale).includes(query)
      );
      return inCategory && inBrand && isFeatured && matchesQuery;
    });
    const start = filter.page * filter.size;
    return of({
      items: matching.slice(start, start + filter.size),
      page: filter.page,
      size: filter.size,
      totalItems: matching.length,
      totalPages: matching.length === 0 ? 0 : Math.ceil(matching.length / filter.size),
    });
  }

  override getProduct(
    context: CatalogTenantContext,
    slug: string,
  ): Observable<CatalogProductDetailView | null> {
    this.assertContext(context);
    return of(this.fixtures.productDetails.find(product => product.slug === slug) ?? null);
  }

  override getPage(
    context: CatalogTenantContext,
    slug: string,
  ): Observable<CatalogPageContentView | null> {
    this.assertContext(context);
    return of(this.fixtures.pages.find(page => page.slug === slug && page.locale === context.locale) ?? null);
  }

  override getServices(context: CatalogTenantContext): Observable<readonly CatalogServiceView[]> {
    this.assertContext(context);
    return of(this.fixtures.services);
  }

  override getArticles(context: CatalogTenantContext): Observable<readonly CatalogArticleSummaryView[]> {
    this.assertContext(context);
    return of(this.fixtures.articles);
  }

  override getOrganizations(context: CatalogTenantContext): Observable<readonly CatalogOrganizationView[]> {
    this.assertContext(context);
    return of(this.fixtures.organizations);
  }

  override getGallery(context: CatalogTenantContext): Observable<readonly CatalogGalleryItemView[]> {
    this.assertContext(context);
    return of(this.fixtures.gallery);
  }

  private assertContext(context: CatalogTenantContext): void {
    if (context.siteKey !== this.fixtures.site.siteKey || context.hostname !== this.fixtures.site.hostname) {
      throw new Error('Fixture tenant context does not match the configured catalog site.');
    }
    if (!this.fixtures.site.supportedLocales.includes(context.locale)) {
      throw new Error(`Unsupported catalog locale: ${context.locale}`);
    }
  }
}
