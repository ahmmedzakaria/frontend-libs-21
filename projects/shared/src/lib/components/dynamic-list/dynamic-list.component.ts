import { ChangeDetectionStrategy, Component, DestroyRef, TemplateRef, computed, effect, signal, untracked, viewChildren, input, output } from '@angular/core';
import { AuthorizationDenialService, AuthorizedUiDirective, IconComponent } from '@nexacore/platform';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';
import { ColumnDef, DataTableComponent } from '../data-table/data-table.component';
import { ExportButtonComponent, ExportColumn } from '../export-button/export-button.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { ImagePreviewComponent } from '../image-preview/image-preview.component';
import { PillComponent } from '../pill/pill.component';
import { SearchToolbarEvent, SearchTypeOption } from '../search-toolbar/search-toolbar.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { AccessFeedbackComponent } from '../access-feedback/access-feedback.component';
import { ResourceLoadState } from '../../state/resource-load.state';
import {
    ActionsColumnConfig,
    BadgeColumnConfig,
    DynamicListLoadParams,
    DynamicListLoader,
    ImageColumnConfig,
    ListColumnConfig,
    PillColumnConfig,
    TextColumnConfig
} from './dynamic-list.model';

type TemplatedColumn<T> =
    | BadgeColumnConfig<T>
    | PillColumnConfig<T>
    | ImageColumnConfig<T>
    | ActionsColumnConfig<T>
    | TextColumnConfig<T>;

/** Columns rendered via a generated `<ng-template>` — everything except a plain unformatted `text` column and `custom` (which already carries its own `cellTemplate`). A type guard (not just a boolean predicate) so `@switch` in the template can narrow away `CustomColumnConfig`. */
function needsGeneratedTemplate<T>(column: ListColumnConfig<T>): column is TemplatedColumn<T> {
    return (
        column.type === 'badge' ||
        column.type === 'pill' ||
        column.type === 'image' ||
        column.type === 'actions' ||
        ((column.type === undefined || column.type === 'text') && !!column.format)
    );
}

/**
 * Generalizes the `person-list.component.ts` pattern: given `columns` (badge/pill/image/actions/
 * custom cell config) and a `loadItems` loader — mirroring `DynamicDropdownComponent`'s
 * `loadOptions` convention — this owns the fetch/search/paginate lifecycle that a hand-written
 * list page would otherwise duplicate, composing FilterBar + DataTable + optional ExportButton.
 */
@Component({
    selector: 'app-dynamic-list',
    standalone: true,
    imports: [
        DataTableComponent,
        FilterBarComponent,
        ExportButtonComponent,
        StatusBadgeComponent,
        PillComponent,
        ImagePreviewComponent,
        IconComponent,
        AuthorizedUiDirective,
        AccessFeedbackComponent
    ],
    exportAs: 'dynamicList',
    templateUrl: './dynamic-list.component.html',
    styleUrl: './dynamic-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicListComponent<T> {
    private readonly denials = inject(AuthorizationDenialService);
    private readonly destroyRef = inject(DestroyRef);
    readonly columns = input.required<ListColumnConfig<T>[]>();
    readonly loadItems = input.required<DynamicListLoader<T>>();
    readonly pageSize = input(10);
    /** Choices offered in the pagination's page-size selector; empty renders no selector. */
    readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);
    readonly searchTypes = input<SearchTypeOption[]>([]);
    readonly searchPlaceholder = input('Search…');
    readonly exportColumns = input<ExportColumn<T>[] | null>(null);
    readonly exportFilename = input('export');
    readonly emptyTitle = input('No records yet');
    readonly emptyMessage = input('There is nothing to show here.');

    readonly rowClick = output<T>();

    readonly rows = signal<T[]>([]);
    readonly total = signal(0);
    readonly page = signal(1);
    readonly loading = signal(false);
    readonly loadState = new ResourceLoadState<readonly T[]>();

    /** User-selected page size, overriding the `pageSize` input once they pick one from the selector. */
    private readonly pageSizeOverride = signal<number | null>(null);
    protected readonly effectivePageSize = computed(() => this.pageSizeOverride() ?? this.pageSize());

    private searchQuery = '';
    private searchType: string | null = null;

    protected readonly templatedColumns = computed(() => this.columns().filter(needsGeneratedTemplate<T>));
    private readonly generatedTemplates = viewChildren<TemplateRef<{ $implicit: T }>>('dynTpl');

    protected readonly tableColumns = computed<ColumnDef<T>[]>(() => {
        const generated = this.generatedTemplates();
        const templated = this.templatedColumns();
        return this.columns().map((column) => {
            const base = { key: column.key, header: column.header, align: column.align, sortable: column.sortable };
            if (column.type === 'custom') {
                return { ...base, cellTemplate: column.cellTemplate };
            }
            if (needsGeneratedTemplate(column)) {
                return { ...base, cellTemplate: generated[templated.indexOf(column)] };
            }
            return base;
        });
    });

    constructor() {
        // Required inputs aren't readable synchronously in the constructor body — an effect's
        // first run is deferred until after Angular binds them. Reading them via `untracked`
        // keeps this a true one-shot fetch: no signal read here becomes a dependency, so the
        // effect never reruns on a later `loadItems`/`pageSize` change (mirrors `PersonListComponent`'s
        // own constructor calling `loadData(1)` exactly once).
        effect(() => untracked(() => this.fetch(1)));
    }

    /** Public (not protected) so spec files can drive it directly — same rationale as `DynamicWizardComponent.stepForms`. */
    onSearch(event: SearchToolbarEvent): void {
        this.searchQuery = event.query;
        this.searchType = event.type;
        this.fetch(1);
    }

    onPageChange(page: number): void {
        this.fetch(page);
    }

    onPageSizeChange(size: number): void {
        this.pageSizeOverride.set(size);
        this.fetch(1);
    }

    /** Re-fetches the current page — for a consumer to call after e.g. a delete action completes. */
    reload(): void {
        this.fetch(this.page());
    }

    private fetch(page: number): void {
        this.loading.set(true);
        this.loadState.begin();
        const params: DynamicListLoadParams = {
            query: this.searchQuery,
            searchType: this.searchType,
            page,
            pageSize: this.effectivePageSize()
        };
        this.loadItems()(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (result) => {
                this.rows.set(result.items);
                this.total.set(result.total);
                this.page.set(page);
                this.loading.set(false);
                this.loadState.succeed(result.items, result.total === 0);
            },
            error: (error: unknown) => {
                this.loading.set(false);
                this.rows.set([]);
                this.total.set(0);
                const denial = error instanceof HttpErrorResponse ? this.denials.classify(error) : null;
                if (denial) this.loadState.deny(`[${denial.code}] ${denial.message}`, denial.traceId);
                else this.loadState.fail(readFailureMessage(error), readTraceId(error));
            }
        });
    }
}

function readFailureMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return error instanceof Error ? error.message : 'The records could not be loaded.';
    const body = error.error as { message?: Array<{ code?: string; message?: string }> } | undefined;
    const detail = body?.message?.[0];
    return `${detail?.code ? `[${detail.code}] ` : ''}${detail?.message || error.message || 'The records could not be loaded.'}`;
}

function readTraceId(error: unknown): string | undefined {
    return error instanceof HttpErrorResponse ? error.headers?.get('X-Trace-Id') ?? undefined : undefined;
}
