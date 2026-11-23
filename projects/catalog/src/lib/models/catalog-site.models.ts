import { CatalogLocale, CatalogMediaView, CatalogSeoView } from './catalog-core.models';
import { CatalogCategoryView } from './catalog-product.models';

export interface CatalogNavigationItemView {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly children?: readonly CatalogNavigationItemView[];
}

export interface CatalogContactView {
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly mapUrl?: string;
}

export interface CatalogSocialLinkView {
  readonly provider: 'FACEBOOK' | 'LINKEDIN' | 'YOUTUBE' | 'INSTAGRAM' | 'WHATSAPP';
  readonly url: string;
  readonly label: string;
}

export interface CatalogSiteView {
  readonly siteKey: string;
  readonly hostname: string;
  readonly name: string;
  readonly logo: CatalogMediaView;
  readonly supportedLocales: readonly CatalogLocale[];
  readonly defaultLocale: CatalogLocale;
  readonly navigation: readonly CatalogNavigationItemView[];
  readonly categoryNavigation: readonly CatalogCategoryView[];
  readonly contact: CatalogContactView;
  readonly socialLinks: readonly CatalogSocialLinkView[];
  readonly defaultSeo: CatalogSeoView;
}
