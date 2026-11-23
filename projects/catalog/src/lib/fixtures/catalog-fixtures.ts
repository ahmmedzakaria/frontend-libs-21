import {
  CatalogArticleSummaryView,
  CatalogGalleryItemView,
  CatalogOrganizationView,
  CatalogPageContentView,
  CatalogServiceView,
} from '../models/catalog-content.models';
import { CatalogCategoryView, CatalogProductDetailView, CatalogProductSummaryView } from '../models/catalog-product.models';
import { CatalogSiteView } from '../models/catalog-site.models';

const placeholder = (id: string, alternativeText: string) => ({
  id,
  kind: 'IMAGE' as const,
  url: `/assets/catalog/fixtures/${id}.svg`,
  alternativeText,
  width: 1280,
  height: 720,
});

const structuredCabling: CatalogCategoryView = {
  id: 'category-structured-cabling',
  slug: 'structured-cabling',
  translations: [
    { locale: 'en', name: 'Structured cabling', summary: 'Copper and fiber infrastructure for reliable networks.' },
    { locale: 'bn', name: 'স্ট্রাকচার্ড ক্যাবলিং', summary: 'নির্ভরযোগ্য নেটওয়ার্কের জন্য কপার ও ফাইবার অবকাঠামো।' },
  ],
  image: placeholder('structured-cabling', 'Organized network cabling in a server room'),
  children: [
    {
      id: 'category-copper-cabling',
      parentId: 'category-structured-cabling',
      slug: 'copper-cabling',
      translations: [
        { locale: 'en', name: 'Copper cabling' },
        { locale: 'bn', name: 'কপার ক্যাবলিং' },
      ],
      children: [],
      productCount: 1,
    },
    {
      id: 'category-fiber-cabling',
      parentId: 'category-structured-cabling',
      slug: 'fiber-cabling',
      translations: [
        { locale: 'en', name: 'Fiber cabling' },
        { locale: 'bn', name: 'ফাইবার ক্যাবলিং' },
      ],
      children: [],
      productCount: 1,
    },
  ],
  productCount: 2,
};

const infrastructure: CatalogCategoryView = {
  id: 'category-data-center',
  slug: 'data-center-infrastructure',
  translations: [
    { locale: 'en', name: 'Data center infrastructure', summary: 'Racks, power distribution, and supporting systems.' },
    { locale: 'bn', name: 'ডেটা সেন্টার অবকাঠামো', summary: 'র্যাক, বিদ্যুৎ বিতরণ এবং সহায়ক ব্যবস্থা।' },
  ],
  image: placeholder('data-center', 'Modern data center racks'),
  children: [],
  productCount: 1,
};

const networkCable: CatalogProductSummaryView = {
  id: 'product-cat6-cable',
  slug: 'cat6-network-cable',
  categorySlug: 'structured-cabling',
  brand: { id: 'brand-nexa-lab', slug: 'nexa-lab', name: 'Nexa Lab' },
  translations: [
    { locale: 'en', name: 'Cat6 network cable', summary: 'Low-smoke cable for structured office networks.' },
    { locale: 'bn', name: 'ক্যাট৬ নেটওয়ার্ক কেবল', summary: 'অফিস নেটওয়ার্কের জন্য লো-স্মোক কেবল।' },
  ],
  primaryImage: placeholder('cat6-cable', 'Blue Cat6 network cable coil'),
  model: 'NL-CAT6-LSZH',
  featured: true,
  quoteOnly: true,
};

const fiberPanel: CatalogProductSummaryView = {
  id: 'product-fiber-panel',
  slug: 'high-density-fiber-panel',
  categorySlug: 'structured-cabling',
  translations: [
    { locale: 'en', name: 'High-density fiber panel', summary: 'Modular 1U fiber termination panel.' },
    { locale: 'bn', name: 'হাই-ডেনসিটি ফাইবার প্যানেল', summary: 'মডুলার ১ইউ ফাইবার টার্মিনেশন প্যানেল।' },
  ],
  primaryImage: placeholder('fiber-panel', 'High-density fiber termination panel'),
  model: 'FP-1U-96',
  featured: true,
  quoteOnly: true,
};

const rack: CatalogProductSummaryView = {
  id: 'product-server-rack',
  slug: 'forty-two-u-server-rack',
  categorySlug: 'data-center-infrastructure',
  translations: [
    { locale: 'en', name: '42U server rack', summary: 'Secure rack with modular airflow management.' },
    { locale: 'bn', name: '৪২ইউ সার্ভার র্যাক', summary: 'মডুলার এয়ারফ্লো ব্যবস্থাপনাসহ সুরক্ষিত র্যাক।' },
  ],
  primaryImage: placeholder('server-rack', 'Black 42U data center server rack'),
  model: 'SR-42U-800',
  featured: false,
  quoteOnly: true,
};

const productDetails: readonly CatalogProductDetailView[] = [networkCable, fiberPanel, rack].map(product => ({
  ...product,
  gallery: product.primaryImage ? [product.primaryImage] : [],
  specifications: [
    { group: 'General', label: 'Model', value: product.model ?? 'Not specified' },
    { group: 'Commercial', label: 'Availability', value: 'Request a quote' },
  ],
  documents: [],
  relatedProducts: [networkCable, fiberPanel, rack].filter(candidate => candidate.id !== product.id).slice(0, 2),
  seo: {
    title: `${product.translations[0].name} | NexaCore Solutions`,
    description: product.translations[0].summary ?? product.translations[0].name,
    canonicalPath: `/product/${product.slug}`,
    image: product.primaryImage,
  },
}));

const pages: readonly CatalogPageContentView[] = [
  {
    key: 'home',
    slug: '',
    locale: 'en',
    title: 'Infrastructure built for dependable operations',
    sections: [
      {
        id: 'home-hero',
        type: 'HERO',
        heading: 'Plan, build, and support critical infrastructure',
        body: 'Explore network, data center, power, and security solutions designed around your operating environment.',
        image: placeholder('home-hero', 'Engineers reviewing data center infrastructure'),
        primaryAction: { label: 'Explore products', path: '/products' },
        secondaryAction: { label: 'Discuss a project', path: '/contact' },
      },
      {
        id: 'home-features',
        type: 'FEATURE_GRID',
        heading: 'Why work with us',
        items: [
          { id: 'feature-design', title: 'Solution design', description: 'Requirements-led architecture and product selection.' },
          { id: 'feature-delivery', title: 'Coordinated delivery', description: 'Clear implementation milestones and ownership.' },
          { id: 'feature-support', title: 'Lifecycle support', description: 'Operational guidance after deployment.' },
        ],
      },
    ],
    seo: {
      title: 'NexaCore Solutions | IT infrastructure and security',
      description: 'Product catalog and infrastructure solutions for networks, data centers, power, and security.',
      canonicalPath: '/',
      image: placeholder('home-hero', 'Engineers reviewing data center infrastructure'),
    },
  },
  {
    key: 'home',
    slug: '',
    locale: 'bn',
    title: 'নির্ভরযোগ্য কার্যক্রমের জন্য অবকাঠামো',
    sections: [
      {
        id: 'home-hero-bn',
        type: 'HERO',
        heading: 'গুরুত্বপূর্ণ অবকাঠামো পরিকল্পনা, নির্মাণ ও সহায়তা',
        body: 'আপনার কার্যপরিবেশ অনুযায়ী নেটওয়ার্ক, ডেটা সেন্টার, পাওয়ার ও নিরাপত্তা সমাধান দেখুন।',
        image: placeholder('home-hero', 'ডেটা সেন্টার অবকাঠামো পর্যালোচনা করছেন প্রকৌশলীরা'),
        primaryAction: { label: 'পণ্য দেখুন', path: '/products' },
        secondaryAction: { label: 'প্রকল্প নিয়ে আলোচনা করুন', path: '/contact' },
      },
    ],
    seo: {
      title: 'নেক্সাকোর সল্যুশনস | আইটি অবকাঠামো ও নিরাপত্তা',
      description: 'নেটওয়ার্ক, ডেটা সেন্টার, পাওয়ার ও নিরাপত্তার জন্য পণ্য ও সমাধান।',
      canonicalPath: '/bn',
      image: placeholder('home-hero', 'ডেটা সেন্টার অবকাঠামো পর্যালোচনা করছেন প্রকৌশলীরা'),
    },
  },
];

const services: readonly CatalogServiceView[] = [
  {
    id: 'service-network-design',
    slug: 'network-design-and-cabling',
    translations: [
      { locale: 'en', name: 'Network design and cabling', summary: 'Survey, architecture, installation, testing, and handover for copper and fiber networks.' },
      { locale: 'bn', name: 'নেটওয়ার্ক ডিজাইন ও ক্যাবলিং', summary: 'কপার ও ফাইবার নেটওয়ার্কের জরিপ, নকশা, স্থাপন, পরীক্ষা ও হস্তান্তর।' },
    ],
    image: placeholder('structured-cabling', 'Structured network cabling installation'),
  },
  {
    id: 'service-data-center',
    slug: 'data-center-implementation',
    translations: [
      { locale: 'en', name: 'Data center implementation', summary: 'Coordinated racks, power, containment, monitoring, and operational readiness.' },
      { locale: 'bn', name: 'ডেটা সেন্টার বাস্তবায়ন', summary: 'র্যাক, পাওয়ার, কন্টেইনমেন্ট, মনিটরিং ও অপারেশনাল প্রস্তুতির সমন্বিত বাস্তবায়ন।' },
    ],
    image: placeholder('data-center', 'Data center implementation'),
  },
  {
    id: 'service-security',
    slug: 'physical-security-systems',
    translations: [
      { locale: 'en', name: 'Physical security systems', summary: 'Integrated surveillance and access-control planning for operational sites.' },
      { locale: 'bn', name: 'ফিজিক্যাল সিকিউরিটি সিস্টেম', summary: 'অপারেশনাল স্থাপনার জন্য সমন্বিত নজরদারি ও প্রবেশ নিয়ন্ত্রণ পরিকল্পনা।' },
    ],
    image: placeholder('security-systems', 'Security monitoring equipment'),
  },
];

const articles: readonly CatalogArticleSummaryView[] = [
  {
    id: 'article-cabling-checklist',
    slug: 'structured-cabling-project-checklist',
    title: 'A practical structured cabling project checklist',
    excerpt: 'Questions to settle before product selection, installation, testing, and handover.',
    publishedAt: '2026-10-15T00:00:00Z',
    heroImage: placeholder('article-cabling', 'Technician testing structured cabling'),
    tags: ['Cabling', 'Planning'],
  },
  {
    id: 'article-rack-airflow',
    slug: 'server-rack-airflow-basics',
    title: 'Server rack airflow basics',
    excerpt: 'How rack layout and cable management influence cooling and maintainability.',
    publishedAt: '2026-09-28T00:00:00Z',
    heroImage: placeholder('article-airflow', 'Server racks arranged for controlled airflow'),
    tags: ['Data center', 'Operations'],
  },
];

const organizations: readonly CatalogOrganizationView[] = [
  { id: 'partner-one', name: 'Technology Partner One', kind: 'PARTNER', logo: placeholder('partner-one', 'Technology Partner One logo') },
  { id: 'partner-two', name: 'Technology Partner Two', kind: 'PARTNER', logo: placeholder('partner-two', 'Technology Partner Two logo') },
  { id: 'client-one', name: 'Enterprise Client One', kind: 'CLIENT', logo: placeholder('client-one', 'Enterprise Client One logo') },
  { id: 'client-two', name: 'Public Sector Client Two', kind: 'CLIENT', logo: placeholder('client-two', 'Public Sector Client Two logo') },
];

const gallery: readonly CatalogGalleryItemView[] = [
  { id: 'gallery-installation', type: 'PHOTO', title: 'Structured cabling installation', media: placeholder('gallery-installation', 'Organized structured cabling installation') },
  { id: 'gallery-racks', type: 'PHOTO', title: 'Rack deployment', media: placeholder('gallery-racks', 'Completed server rack deployment') },
  { id: 'gallery-certificate', type: 'CERTIFICATION', title: 'Synthetic certification example', media: placeholder('gallery-certificate', 'Placeholder certification document') },
];

const site: CatalogSiteView = {
  siteKey: 'nexacore-solutions-demo',
  hostname: 'catalog.localhost',
  name: 'NexaCore Solutions',
  logo: placeholder('brand-logo', 'NexaCore Solutions'),
  supportedLocales: ['en', 'bn'],
  defaultLocale: 'en',
  navigation: [
    { id: 'nav-products', label: 'Products', path: '/products' },
    { id: 'nav-services', label: 'Services', path: '/services' },
    { id: 'nav-about', label: 'About', path: '/about' },
    { id: 'nav-news', label: 'News', path: '/news' },
    { id: 'nav-contact', label: 'Contact', path: '/contact' },
  ],
  categoryNavigation: [structuredCabling, infrastructure],
  contact: {
    email: 'sales@example.invalid',
    phone: '+880 0000 000000',
    address: 'Dhaka, Bangladesh',
  },
  socialLinks: [],
  defaultSeo: {
    title: 'NexaCore Solutions',
    description: 'Synthetic Phase 0 catalog fixture site.',
    canonicalPath: '/',
  },
};

export interface CatalogFixtureSet {
  readonly site: CatalogSiteView;
  readonly categories: readonly CatalogCategoryView[];
  readonly products: readonly CatalogProductSummaryView[];
  readonly productDetails: readonly CatalogProductDetailView[];
  readonly pages: readonly CatalogPageContentView[];
  readonly services: readonly CatalogServiceView[];
  readonly articles: readonly CatalogArticleSummaryView[];
  readonly organizations: readonly CatalogOrganizationView[];
  readonly gallery: readonly CatalogGalleryItemView[];
}

export const CATALOG_FIXTURES: CatalogFixtureSet = {
  site,
  categories: [structuredCabling, infrastructure],
  products: [networkCable, fiberPanel, rack],
  productDetails,
  pages,
  services,
  articles,
  organizations,
  gallery,
};
