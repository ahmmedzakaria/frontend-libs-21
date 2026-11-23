export type CatalogRouteKind =
  | 'HOME'
  | 'STATIC_PAGE'
  | 'PRODUCT_INDEX'
  | 'CATEGORY'
  | 'PRODUCT_DETAIL'
  | 'SERVICE_INDEX'
  | 'SERVICE_DETAIL'
  | 'ORGANIZATION_INDEX'
  | 'GALLERY'
  | 'ARTICLE_INDEX'
  | 'ARTICLE_DETAIL'
  | 'CONTACT';

export interface CatalogRouteDefinition {
  readonly path: string;
  readonly kind: CatalogRouteKind;
  readonly navigation: 'PRIMARY' | 'SECONDARY' | 'HIDDEN';
  readonly localized: boolean;
  readonly prerender: boolean;
}

export const CATALOG_ROUTE_MANIFEST: readonly CatalogRouteDefinition[] = [
  { path: '/', kind: 'HOME', navigation: 'PRIMARY', localized: true, prerender: true },
  { path: '/about', kind: 'STATIC_PAGE', navigation: 'PRIMARY', localized: true, prerender: true },
  { path: '/products', kind: 'PRODUCT_INDEX', navigation: 'PRIMARY', localized: true, prerender: true },
  { path: '/products/:categorySlug', kind: 'CATEGORY', navigation: 'HIDDEN', localized: true, prerender: true },
  { path: '/product/:productSlug', kind: 'PRODUCT_DETAIL', navigation: 'HIDDEN', localized: true, prerender: true },
  { path: '/services', kind: 'SERVICE_INDEX', navigation: 'PRIMARY', localized: true, prerender: true },
  { path: '/services/:serviceSlug', kind: 'SERVICE_DETAIL', navigation: 'HIDDEN', localized: true, prerender: true },
  { path: '/clients', kind: 'ORGANIZATION_INDEX', navigation: 'SECONDARY', localized: true, prerender: true },
  { path: '/partners', kind: 'ORGANIZATION_INDEX', navigation: 'SECONDARY', localized: true, prerender: true },
  { path: '/gallery', kind: 'GALLERY', navigation: 'PRIMARY', localized: true, prerender: true },
  { path: '/news', kind: 'ARTICLE_INDEX', navigation: 'PRIMARY', localized: true, prerender: true },
  { path: '/news/:articleSlug', kind: 'ARTICLE_DETAIL', navigation: 'HIDDEN', localized: true, prerender: true },
  { path: '/contact', kind: 'CONTACT', navigation: 'PRIMARY', localized: true, prerender: true },
  { path: '/privacy', kind: 'STATIC_PAGE', navigation: 'SECONDARY', localized: true, prerender: true },
  { path: '/terms', kind: 'STATIC_PAGE', navigation: 'SECONDARY', localized: true, prerender: true },
] as const;
