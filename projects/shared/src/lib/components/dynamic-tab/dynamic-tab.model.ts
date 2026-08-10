import { FieldConfig } from '../dynamic-form/dynamic-form.model';
import { DynamicListLoader, ListColumnConfig } from '../dynamic-list/dynamic-list.model';
import { PreviewSectionConfig } from '../dynamic-preview/dynamic-preview.model';

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
    searchPlaceholder?: string;
    emptyTitle?: string;
    emptyMessage?: string;
}

export type DynamicTabConfig = DynamicTabFieldConfig | DynamicTabPreviewConfig | DynamicTabListConfig;
