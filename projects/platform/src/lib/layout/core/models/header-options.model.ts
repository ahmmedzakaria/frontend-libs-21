/**
 * Static placeholder data backing the header's dropdowns (Apps launcher,
 * global search type selector, Tenant switcher, Language picker). None of
 * this is backend-sourced — it's the same demo/POC data HeaderComponent
 * always shipped with, just centralized here so any consumer of this
 * package can reuse it instead of redeclaring its own copy.
 */

export interface HeaderAppTile {
    name: string;
    icon: string;
}

export const DEFAULT_HEADER_APPS: HeaderAppTile[] = [
    { name: 'Case Management', icon: 'folder' },
    { name: 'Document Vault', icon: 'document' },
    { name: 'Risk Analytics', icon: 'bar-chart' },
    { name: 'HR Portal', icon: 'users' },
    { name: 'Loan Origination', icon: 'percent' },
    { name: 'Audit Console', icon: 'search' },
    { name: 'Reporting Suite', icon: 'trend' },
    { name: 'Admin Portal', icon: 'gear' },
    { name: 'Helpdesk', icon: 'help' }
];

export const TCODE_SEARCH_TYPE = 'T Code';

/** Global search's "search by" options — `TCODE_SEARCH_TYPE` is always last. */
export const DEFAULT_SEARCH_TYPES = ['Customer Name', 'National ID', 'Passport', 'Phone', 'Case Number', TCODE_SEARCH_TYPE] as const;

export const DEFAULT_HEADER_TENANTS: string[] = ['Prime Bank Ltd.', 'Northgate Finance', 'Meridian Trust Co.'];

export interface HeaderLanguage {
    code: string;
    label: string;
}

export const DEFAULT_HEADER_LANGUAGES: HeaderLanguage[] = [
    { code: 'en', label: 'English' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ar', label: 'العربية' }
];
