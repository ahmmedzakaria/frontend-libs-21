import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '@nexacore/platform';
import { DropdownOption } from '../components/dropdown/dropdown.component';
import { SmartDropdownLoader, SmartDropdownPage } from '../components/smart-dropdown/smart-dropdown.component';
import { DropdownFieldConfig, FieldConfig, SmartDropdownFieldConfig } from '../components/dynamic-form/dynamic-form.model';
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
        overrides: Partial<DropdownFieldConfig | SmartDropdownFieldConfig> = {}
    ): FieldConfig {
        if (config.dropdownMode === 'static') {
            const base: DropdownFieldConfig = {
                key,
                label,
                type: 'dropdown',
                placeholder: config.placeholder,
                options: this.resolveStaticOptions(config)
            };
            return { ...base, ...overrides } as DropdownFieldConfig;
        }

        const base: SmartDropdownFieldConfig = {
            key,
            label,
            type: 'smart-dropdown',
            mode: config.dropdownMode,
            placeholder: config.placeholder,
            loadOptions: this.toLoader(config),
            compareWith: this.compareFor(config.option),
            displayWith: (value) => this.buildLabel(value as Record<string, unknown>, config.option)
        };
        return { ...base, ...overrides } as SmartDropdownFieldConfig;
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

    private resolveStaticOptions<T>(config: StaticDropdownApiConfig<T>): DropdownOption<unknown>[] {
        return config.listItems.map((item) => ({
            label: this.buildLabel(item as Record<string, unknown>, config.option),
            value: this.buildValue(item as Record<string, unknown>, config.option)
        }));
    }

    private toLoader(config: ApiDropdownApiConfig): SmartDropdownLoader<unknown> {
        return (query: string, page: number) => {
            // Don't fetch on an empty query (e.g. right after opening the
            // panel) — avoids an unbounded "search everything" call.
            if (!query.trim()) {
                return of({ items: [], hasMore: false });
            }
            const body = { page, size: config.pageSize ?? 10, searchText: query, ...config.extraParams };
            // SmartDropdownComponent's own fetchPage() already wraps loader
            // calls in catchError — no need to duplicate that here.
            return this.api.post<DropdownApiPage<Record<string, unknown>>>(config.apiConfig, body).pipe(
                map(
                    (res): SmartDropdownPage<unknown> => ({
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

    private compareFor(mapping: DropdownOptionMapping): (a: unknown, b: unknown) => boolean {
        if (mapping.valueType === 'PRIMITIVE') {
            return (a, b) => a === b;
        }
        const idField = mapping.value[0];
        return (a, b) => (a as Record<string, unknown> | null)?.[idField] === (b as Record<string, unknown> | null)?.[idField];
    }
}
