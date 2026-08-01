/** Backend `NavNodeDto` returned in `layout.navTree`. */
export interface NavTreeItem {
  code: string;
  tCode?: string | null;
  label: string;
  type: 'group' | 'module' | 'category' | 'featureGroup' | 'feature';
  icon?: string;
  route?: string | null;
  privilegeCodes: string[];
  children: NavTreeItem[];
}

/** The 8 hue/neutral primaries every derived CSS token in _tokens.scss's `color-mix()` chain computes from. */
export interface LayoutThemePrimaries {
  text: string;
  paper: string;
  card: string;
  accent: string;
  amber: string;
  red: string;
  success: string;
  info: string;
}

/** Optional per-theme fine-tuning that overrides the standard `--chrome-*` derivation. */
export interface LayoutThemeChromeOverrides {
  accentSoft?: string;
  bg?: string;
  border?: string;
  borderStrong?: string;
  hoverBg?: string;
  activeBg?: string;
  searchBg?: string;
  searchBorder?: string;
  searchText?: string;
  searchPlaceholder?: string;
}

export interface LayoutTheme {
  id: string;
  label: string;
  base: 'light' | 'dark';
  /** Accent swatch shown in the theme picker; 'sun'/'moon' use an icon instead of a color chip. */
  swatch: string;
  primaries: LayoutThemePrimaries;
  chromeOverrides?: LayoutThemeChromeOverrides | null;
}

/** Size primitives + fixed chrome dimensions, in px. */
export interface LayoutSizes {
  spaceUnit: number;
  radiusBase: number;
  fontSizeBase: number;
  headerHeight: number;
  statusBarHeight: number;
  /** Left nav (RailNavComponent) width in its icon-only/expanded states. */
  railWidthCollapsed: number;
  railWidthExpanded: number;
}

export type LayoutFontSource = 'SYSTEM' | 'GOOGLE_FONTS' | 'CUSTOM_URL' | string;

export interface LayoutFonts {
  bodyFamily: string;
  headingFamily: string;
  monoFamily: string;
  fontSource: LayoutFontSource;
  fontUrl?: string | null;
  fallbackStack: string;
}

export interface LayoutBrand {
  displayName: string;
  shortName: string;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  supportUrl?: string | null;
}

/**
 * Behavior flags for a layout profile, applied by `LayoutConfigService` and
 * `LayoutComponent`. `commandBarEnabled` is the one exception — no command-bar UI
 * exists in this codebase, so it's modeled but intentionally unconsumed.
 */
export interface LayoutProfile {
  id?: number;
  code: string;
  name?: string;
  description?: string;
  layoutType?: string;
  navigationMode?: string;
  themeMode?: string;
  density?: string;
  topbarEnabled?: boolean;
  sidebarEnabled?: boolean;
  sidebarCollapsed?: boolean;
  footerEnabled?: boolean;
  breadcrumbEnabled?: boolean;
  commandBarEnabled?: boolean;
  rtlEnabled?: boolean;
  active?: boolean;
  brand: LayoutBrand;
}

/** The `layout` payload nested inside ApplicationContext, from `system/privilege/context`. */
export interface BackendLayoutConfig {
  activeProfileCode?: string;
  availableProfiles?: LayoutProfile[];
  navTree?: NavTreeItem[];
  themes?: LayoutTheme[];
  sizes?: LayoutSizes;
  fonts?: LayoutFonts;
}
