import { TemplateRef } from '@angular/core';
import { Observable } from 'rxjs';
import { PillTone } from '../pill/pill.component';
import { StatusTone } from '../status-badge/status-badge.component';

interface BaseColumnConfig<T> {
    /** A real property of `T`, or a synthetic string (e.g. `'actions'`) for a purely presentational column. */
    key: string;
    header: string;
    align?: 'start' | 'end' | 'center';
    sortable?: boolean;
}

export interface TextColumnConfig<T> extends BaseColumnConfig<T> {
    type?: 'text';
    /** When set, routes the cell through a generated template instead of the raw `row[key]` value. */
    format?: (row: T) => string;
}

export interface BadgeColumnConfig<T> extends BaseColumnConfig<T> {
    type: 'badge';
    status: (row: T) => StatusTone;
    label?: (row: T) => string | null;
}

export interface PillColumnConfig<T> extends BaseColumnConfig<T> {
    type: 'pill';
    label: (row: T) => string;
    tone?: (row: T) => PillTone;
}

export interface ImageColumnConfig<T> extends BaseColumnConfig<T> {
    type: 'image';
    src: (row: T) => string | undefined;
    alt?: (row: T) => string;
    fallbackIcon?: string;
    shape?: 'circle' | 'square';
    size?: number;
}

export interface RowActionConfig<T> {
    icon: string;
    /** Also the button's title/aria-label. */
    label: string;
    onClick: (row: T, event: Event) => void;
    /** Wraps the button in `*appAuthorizedUi` when set; omitted means the action always renders. */
    permissionKey?: string;
    danger?: boolean;
}

export interface ActionsColumnConfig<T> extends BaseColumnConfig<T> {
    type: 'actions';
    actions: RowActionConfig<T>[];
}

export interface CustomColumnConfig<T> extends BaseColumnConfig<T> {
    type: 'custom';
    /** Full escape hatch — passed straight to `ColumnDef.cellTemplate`. */
    cellTemplate: TemplateRef<{ $implicit: T }>;
}

export type ListColumnConfig<T> =
    | TextColumnConfig<T>
    | BadgeColumnConfig<T>
    | PillColumnConfig<T>
    | ImageColumnConfig<T>
    | ActionsColumnConfig<T>
    | CustomColumnConfig<T>;

export interface DynamicListLoadParams {
    query: string;
    searchType: string | null;
    /** 1-based, matches PaginationComponent/DataTableComponent. */
    page: number;
    pageSize: number;
}

export interface DynamicListLoadResult<T> {
    items: T[];
    total: number;
}

export type DynamicListLoader<T> = (params: DynamicListLoadParams) => Observable<DynamicListLoadResult<T>>;
