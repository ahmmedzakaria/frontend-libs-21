import { Observable } from 'rxjs';
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

export abstract class CatalogContentSource {
  abstract getSite(context: CatalogTenantContext): Observable<CatalogSiteView>;
  abstract getCategories(context: CatalogTenantContext): Observable<readonly CatalogCategoryView[]>;
  abstract getProducts(
    context: CatalogTenantContext,
    filter: CatalogProductFilter,
  ): Observable<CatalogPageView<CatalogProductSummaryView>>;
  abstract getProduct(context: CatalogTenantContext, slug: string): Observable<CatalogProductDetailView | null>;
  abstract getPage(context: CatalogTenantContext, slug: string): Observable<CatalogPageContentView | null>;
  abstract getServices(context: CatalogTenantContext): Observable<readonly CatalogServiceView[]>;
  abstract getArticles(context: CatalogTenantContext): Observable<readonly CatalogArticleSummaryView[]>;
  abstract getOrganizations(context: CatalogTenantContext): Observable<readonly CatalogOrganizationView[]>;
  abstract getGallery(context: CatalogTenantContext): Observable<readonly CatalogGalleryItemView[]>;
}
