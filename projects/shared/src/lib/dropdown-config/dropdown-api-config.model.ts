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
}

export interface ApiDropdownApiConfig {
    dropdownMode: 'api-simple' | 'api-scroll';
    apiConfig: ApiEndpoint;
    option: DropdownOptionMapping;
    pageSize?: number;
    /** Extra static fields merged into every request body alongside page/size/searchText. */
    extraParams?: Record<string, unknown>;
}

export type DropdownApiConfig<T = unknown> = StaticDropdownApiConfig<T> | ApiDropdownApiConfig;
