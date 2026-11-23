import { CatalogLocalizedText, CatalogMediaView, CatalogSeoView } from './catalog-core.models';

export type CatalogPageSection =
  | CatalogHeroSection
  | CatalogRichTextSection
  | CatalogFeatureGridSection
  | CatalogLogoCloudSection
  | CatalogCallToActionSection;

interface CatalogSectionBase {
  readonly id: string;
  readonly heading?: string;
}

export interface CatalogHeroSection extends CatalogSectionBase {
  readonly type: 'HERO';
  readonly body: string;
  readonly image?: CatalogMediaView;
  readonly primaryAction?: CatalogActionView;
  readonly secondaryAction?: CatalogActionView;
}

export interface CatalogRichTextSection extends CatalogSectionBase {
  readonly type: 'RICH_TEXT';
  readonly safeHtml: string;
}

export interface CatalogFeatureGridSection extends CatalogSectionBase {
  readonly type: 'FEATURE_GRID';
  readonly items: readonly CatalogFeatureView[];
}

export interface CatalogLogoCloudSection extends CatalogSectionBase {
  readonly type: 'LOGO_CLOUD';
  readonly items: readonly CatalogOrganizationView[];
}

export interface CatalogCallToActionSection extends CatalogSectionBase {
  readonly type: 'CALL_TO_ACTION';
  readonly body: string;
  readonly action: CatalogActionView;
}

export interface CatalogActionView {
  readonly label: string;
  readonly path: string;
}

export interface CatalogFeatureView {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface CatalogPageContentView {
  readonly key: string;
  readonly slug: string;
  readonly locale: string;
  readonly title: string;
  readonly sections: readonly CatalogPageSection[];
  readonly seo: CatalogSeoView;
}

export interface CatalogServiceView {
  readonly id: string;
  readonly slug: string;
  readonly translations: readonly CatalogLocalizedText[];
  readonly image?: CatalogMediaView;
}

export interface CatalogArticleSummaryView {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly publishedAt: string;
  readonly heroImage?: CatalogMediaView;
  readonly tags: readonly string[];
}

export interface CatalogOrganizationView {
  readonly id: string;
  readonly name: string;
  readonly kind: 'CLIENT' | 'PARTNER';
  readonly logo?: CatalogMediaView;
  readonly website?: string;
}

export interface CatalogGalleryItemView {
  readonly id: string;
  readonly type: 'PHOTO' | 'CERTIFICATION' | 'VIDEO';
  readonly title: string;
  readonly media: CatalogMediaView;
}
