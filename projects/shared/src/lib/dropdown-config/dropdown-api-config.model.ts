import { ApiEndpoint } from '@nexacore/platform';

export type DropdownValueType = 'PRIMITIVE' | 'JSON_OBJECT';

export interface DropdownOptionMapping {
    /** Field(s) on each raw item used to build the label. */
    labelData: string[];
    /** Template combining labelData fields, e.g. '[code] name' — bracketed
     * tokens are replaced by that field's value. Omit to space-join labelData
     * fields in order. */
    labelLogic?: string;
    /** Field(s) on each raw item used to build the emitted value. */
    value: string[];
    /** 'PRIMITIVE': emit value[0]'s raw field value as-is.
     *  'JSON_OBJECT': emit an object keyed by each field in `value`. */
    valueType: DropdownValueType;
}

export interface StaticDropdownApiConfig<T = unknown> {
    dropdownMode: 'static';
    listItems: T[];
    option: DropdownOptionMapping;
    placeholder?: string;
}

/**
 * Edit-mode support: resolves a saved raw id into this field's proper initial
 * value (and label) via a dedicated fetch-by-id call, for dropdowns where the
 * id alone isn't enough to render a label without hitting the API — e.g. a
 * foreign-key column saved on the record being edited.
 */
export interface DropdownLookupConfig {
    apiConfig: ApiEndpoint;
    /** Builds the lookup request body from the raw id passed to `DropdownConfigService.resolveInitialValue()`. */
    requestBody: (id: unknown) => Record<string, unknown>;
    /** Merges the lookup response with the original id into an item shaped
     * like a normal option-source item (same shape `option` expects) — needed
     * whenever the lookup response doesn't echo back every field the option
     * mapping reads (the id itself is often only known by the caller, not
     * returned by a get-by-id endpoint). Return null to signal "not found".
     * Defaults to using the response as-is when omitted. */
    mapItem?: (response: unknown, id: unknown) => Record<string, unknown> | null;
}

export interface ApiDropdownApiConfig {
    dropdownMode: 'api-simple' | 'api-scroll';
    apiConfig: ApiEndpoint;
    option: DropdownOptionMapping;
    pageSize?: number;
    /** Extra static fields merged into every request body alongside page/size/searchText. */
    extraParams?: Record<string, unknown>;
    lookup?: DropdownLookupConfig;
    placeholder?: string;
}

export type DropdownApiConfig<T = unknown> = StaticDropdownApiConfig<T> | ApiDropdownApiConfig;
