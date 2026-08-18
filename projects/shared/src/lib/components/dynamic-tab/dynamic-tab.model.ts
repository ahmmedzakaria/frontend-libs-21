import { DropdownOption } from '../dropdown/dropdown.component';
import { FieldConfig } from '../dynamic-form/dynamic-form.model';
import { DynamicListLoader, ListColumnConfig } from '../dynamic-list/dynamic-list.model';
import { PreviewSectionConfig } from '../dynamic-preview/dynamic-preview.model';
import { ExportColumn } from '../export-button/export-button.component';
import { SearchTypeOption } from '../search-toolbar/search-toolbar.component';

interface BaseDynamicTabConfig {
    /** Also used as the `track` key. */
    key: string;
    label: string;
    disabled?: boolean;
}

export interface DynamicTabFieldConfig extends BaseDynamicTabConfig {
    fields: FieldConfig[];
    initialValue?: Record<string, unknown>;
    columns?: number;
}

export interface DynamicTabPreviewConfig extends BaseDynamicTabConfig {
    sections: PreviewSectionConfig<Record<string, unknown>>[];
    data?: Record<string, unknown>;
    heading?: string;
    subheading?: string;
}

/** A tab rendered via DynamicListComponent — the dominant real-world tab
 * shape in this codebase (license/privilege/api-registry admin pages). */
export interface DynamicTabListConfig extends BaseDynamicTabConfig {
    columns: ListColumnConfig<unknown>[];
    loadItems: DynamicListLoader<unknown>;
    pageSize?: number;
    pageSizeOptions?: number[];
    /** Search-type dropdown alongside the query box — omit for a plain single query field. */
    searchTypes?: SearchTypeOption[];
    searchPlaceholder?: string;
    emptyTitle?: string;
    emptyMessage?: string;
    /** Adds an `app-export-button` (CSV) to the list's toolbar when set. */
    exportColumns?: ExportColumn<unknown>[] | null;
    exportFilename?: string;
}

export interface TabFilterFieldConfig {
    key: string;
    label: string;
    options: DropdownOption<unknown>[];
    placeholder?: string;
    value: unknown;
    onChange: (value: unknown) => void;
}

/** Filter dropdown(s) gate whether the list renders — e.g. "pick an owner,
 * then see its entitlements". `ready` and each filter's value/onChange are
 * computed/owned by the caller; this stays a pure render of whatever it's given. */
export interface DynamicTabFilteredListConfig extends BaseDynamicTabConfig {
    filters: TabFilterFieldConfig[];
    ready: boolean;
    emptyFilterHint: string;
    columns: ListColumnConfig<unknown>[];
    loadItems: DynamicListLoader<unknown>;
    pageSize?: number;
    /** Search-type dropdown alongside the query box — omit for a plain single query field. */
    searchTypes?: SearchTypeOption[];
    searchPlaceholder?: string;
    emptyTitle?: string;
    emptyMessage?: string;
    /** Adds an `app-export-button` (CSV) to the list's toolbar when set. */
    exportColumns?: ExportColumn<unknown>[] | null;
    exportFilename?: string;
}

export type DynamicTabConfig = DynamicTabFieldConfig | DynamicTabPreviewConfig | DynamicTabListConfig | DynamicTabFilteredListConfig;
