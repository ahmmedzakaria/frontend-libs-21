import {
  CatalogLocalizedText,
  CatalogMediaView,
  CatalogPublicationState,
  CatalogSeoView,
} from './catalog-core.models';

export interface CatalogCategoryView {
  readonly id: string;
  readonly slug: string;
  readonly parentId?: string;
  readonly translations: readonly CatalogLocalizedText[];
  readonly image?: CatalogMediaView;
  readonly children: readonly CatalogCategoryView[];
  readonly productCount: number;
}

export interface CatalogBrandView {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly logo?: CatalogMediaView;
}

export interface CatalogSpecificationView {
  readonly group: string;
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
}

export interface CatalogDocumentView {
  readonly id: string;
  readonly label: string;
  readonly type: 'DATASHEET' | 'BROCHURE' | 'CERTIFICATE' | 'MANUAL';
  readonly media: CatalogMediaView;
}

export interface CatalogProductSummaryView {
  readonly id: string;
  readonly slug: string;
  readonly categorySlug: string;
  readonly brand?: CatalogBrandView;
  readonly translations: readonly CatalogLocalizedText[];
  readonly primaryImage?: CatalogMediaView;
  readonly model?: string;
  readonly featured: boolean;
  readonly quoteOnly: boolean;
}

export interface CatalogProductDetailView extends CatalogProductSummaryView {
  readonly publicationState?: CatalogPublicationState;
  readonly gallery: readonly CatalogMediaView[];
  readonly specifications: readonly CatalogSpecificationView[];
  readonly documents: readonly CatalogDocumentView[];
  readonly relatedProducts: readonly CatalogProductSummaryView[];
  readonly seo: CatalogSeoView;
}

export interface CatalogProductFilter {
  readonly query?: string;
  readonly categorySlug?: string;
  readonly brandSlug?: string;
  readonly featured?: boolean;
  readonly page: number;
  readonly size: number;
}
