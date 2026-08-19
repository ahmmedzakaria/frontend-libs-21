import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '@nexacore/platform';
import { DropdownOption } from '../components/dropdown/dropdown.component';
import { DynamicDropdownLoader, DynamicDropdownPage } from '../components/dynamic-dropdown/dynamic-dropdown.model';
import { DropdownFieldConfig, FieldConfig, DynamicDropdownFieldConfig } from '../components/dynamic-form/dynamic-form.model';
import { ApiDropdownApiConfig, DropdownApiConfig, DropdownOptionMapping, StaticDropdownApiConfig } from './dropdown-api-config.model';

interface DropdownApiPage<T> {
    content: T[];
    totalPages: number;
}

/**
 * Turns a declarative `DropdownApiConfig` into a ready `FieldConfig` —
 * centralizes the loader/compare/display boilerplate every API-backed
 * dropdown previously had to hand-write per page (see GisService-driven
 * fields on PersonFormComponent for the pattern this replaces).
 */
@Injectable({ providedIn: 'root' })
export class DropdownConfigService {
    private readonly api = inject(ApiService);

    field(
        key: string,
        label: string,
        config: DropdownApiConfig,
        overrides: Partial<DropdownFieldConfig | DynamicDropdownFieldConfig> = {}
    ): FieldConfig {
        if (config.dropdownMode === 'static') {
            const base: DropdownFieldConfig = {
                key,
                label,
                type: 'dropdown',
                placeholder: config.placeholder,
                options: this.resolveOptions(config)
            };
            return { ...base, ...overrides } as DropdownFieldConfig;
        }

        const base: DynamicDropdownFieldConfig = {
            key,
            label,
            type: 'dynamic-dropdown',
            mode: config.dropdownMode,
            placeholder: config.placeholder,
            loadOptions: this.resolveLoader(config),
            compareWith: this.resolveCompareWith(config.option),
            displayWith: this.resolveDisplayWith(config.option)
        };
        return { ...base, ...overrides } as DynamicDropdownFieldConfig;
    }

    /**
     * Edit-mode support: given a saved raw id (e.g. a foreign-key column on
     * the record being edited), calls the config's `lookup` endpoint and
     * resolves the response into the value/label a `field()`-built control
     * needs to start pre-selected — replaces hand-writing a hookup like
     * `GisService.getLocationById(...)` -> `{id, gisCode, detailLocation}`
     * per page. Emits `null` when there's no `lookup` configured, `id` is
     * empty, or the lookup call fails/returns nothing (nothing to resolve —
     * the field just starts empty, same as before this existed).
     */
    resolveInitialValue(config: DropdownApiConfig, id: unknown): Observable<unknown> {
        if (config.dropdownMode === 'static' || !config.lookup || id === null || id === undefined || id === '') {
            return of(null);
        }
        const { apiConfig, requestBody, mapItem } = config.lookup;
        return this.api.post<unknown>(apiConfig, requestBody(id)).pipe(
            map((response) => {
                const item = mapItem ? mapItem(response, id) : (response as Record<string, unknown> | null);
                return item ? this.buildValue(item, config.option) : null;
            }),
            catchError(() => of(null))
        );
    }

    /** Options for 'static' mode — the label/value pairs a plain `<app-dropdown>`
     * or `<app-dynamic-dropdown>` (mode 'static') can render directly. */
    resolveOptions<T>(config: StaticDropdownApiConfig<T>): DropdownOption<unknown>[] {
        return config.listItems.map((item) => ({
            label: this.buildLabel(item as Record<string, unknown>, config.option),
            value: this.buildValue(item as Record<string, unknown>, config.option)
        }));
    }

    /** Loader for 'api-simple'/'api-scroll' modes — what `<app-dynamic-dropdown>`
     * calls per query/page. */
    resolveLoader(config: ApiDropdownApiConfig): DynamicDropdownLoader<unknown> {
        return (query: string, page: number) => {
            // Don't fetch on an empty query (e.g. right after opening the
            // panel) — avoids an unbounded "search everything" call.
            if (!query.trim()) {
                return of({ items: [], hasMore: false });
            }
            const body = { page, size: config.pageSize ?? 10, searchText: query, ...config.extraParams };
            // DynamicDropdownComponent's own fetchPage() already wraps loader
            // calls in catchError — no need to duplicate that here.
            return this.api.post<DropdownApiPage<Record<string, unknown>>>(config.apiConfig, body).pipe(
                map(
                    (res): DynamicDropdownPage<unknown> => ({
                        items: (res?.content ?? []).map((item) => ({
                            label: this.buildLabel(item, config.option),
                            value: this.buildValue(item, config.option)
                        })),
                        hasMore: page + 1 < (res?.totalPages ?? 0)
                    })
                )
            );
        };
    }

    private buildLabel(item: Record<string, unknown>, mapping: DropdownOptionMapping): string {
        if (mapping.labelLogic) {
            return mapping.labelLogic.replace(/\[(\w+)]/g, (_match, field) => String(item[field] ?? '')).trim();
        }
        return mapping.labelData
            .map((field) => item[field])
            .filter((v) => v !== null && v !== undefined && v !== '')
            .join(' ');
    }

    private buildValue(item: Record<string, unknown>, mapping: DropdownOptionMapping): unknown {
        if (mapping.valueType === 'PRIMITIVE') {
            return item[mapping.value[0]];
        }
        return Object.fromEntries(mapping.value.map((field) => [field, item[field]]));
    }

    /** Equality check derived from the option mapping — 'JSON_OBJECT' values
     * compare by their id field rather than by reference, since a freshly
     * fetched page never returns the same object instance as the one
     * currently held by the control's value. */
    resolveCompareWith(mapping: DropdownOptionMapping): (a: unknown, b: unknown) => boolean {
        if (mapping.valueType === 'PRIMITIVE') {
            return (a, b) => a === b;
        }
        const idField = mapping.value[0];
        return (a, b) => (a as Record<string, unknown> | null)?.[idField] === (b as Record<string, unknown> | null)?.[idField];
    }

    /** Last-resort label fallback for a value written onto the control from
     * outside a normal pick (e.g. copied in from another field programmatically). */
    resolveDisplayWith(mapping: DropdownOptionMapping): (value: unknown) => string {
        return (value) => this.buildLabel(value as Record<string, unknown>, mapping);
    }
}
