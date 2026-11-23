export type CatalogLocale = 'en' | 'bn';

export type CatalogPublicationState = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CatalogLocalizedText {
  readonly locale: CatalogLocale;
  readonly name: string;
  readonly summary?: string;
  readonly description?: string;
}

export interface CatalogMediaView {
  readonly id: string;
  readonly kind: 'IMAGE' | 'DOCUMENT' | 'VIDEO_EMBED';
  readonly url: string;
  readonly alternativeText: string;
  readonly title?: string;
  readonly mimeType?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface CatalogSeoView {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath: string;
  readonly image?: CatalogMediaView;
  readonly noIndex?: boolean;
}

export interface CatalogPageRequest {
  readonly page: number;
  readonly size: number;
}

export interface CatalogPageView<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface CatalogTenantContext {
  readonly siteKey: string;
  readonly hostname: string;
  readonly locale: CatalogLocale;
}
