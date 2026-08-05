import { ChangeDetectionStrategy, Component, TemplateRef, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '@nexacore/platform';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { PaginationComponent } from '../pagination/pagination.component';

export interface ColumnDef<T> {
    /**
     * A real property of `T` for a data-driven column (also what `sortable`
     * and `sort`/`sortChange` key against). A synthetic string (e.g. `'photo'`,
     * `'actions'`) for a purely presentational column that has no backing
     * field — always pair a synthetic key with `cellTemplate`, since there's
     * no raw value to fall back to rendering.
     */
    key: (keyof T & string) | string;
    header: string;
    sortable?: boolean;
    align?: 'start' | 'end' | 'center';
    /** When omitted, renders the raw cell value; set this to project a custom cell (badges, links, row actions). Required for a synthetic (non-`keyof T`) key. */
    cellTemplate?: TemplateRef<{ $implicit: T }>;
}

export interface SortState {
    key: string;
    /** 'none' means "not sorted by this column" — a genuine third state, not just absent. */
    direction: 'asc' | 'desc' | 'none';
}

/**
 * Presentational/"dumb" by design: DataTable never sorts or paginates `data`
 * itself — `sort`/`page`/`total` are inputs the consumer owns, and
 * `sortChange`/`pageChange` are just requests to change them.
 *
 * Row actions use the same `cellTemplate` mechanism as any other custom cell
 * rather than a separate content-projection slot — content projected via
 * `<ng-content>` only inserts once per component instance, not once per row.
 */
@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [NgTemplateOutlet, EmptyStateComponent, PaginationComponent, IconComponent],
    templateUrl: './data-table.component.html',
    styleUrl: './data-table.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T> {
    readonly columns = input.required<ColumnDef<T>[]>();
    readonly data = input.required<T[]>();
    readonly loading = input(false);
    readonly trackBy = input<(item: T) => string | number>();
    readonly emptyTitle = input('No records yet');
    readonly emptyMessage = input('There is nothing to show here.');

    /** Current sort — purely for rendering `aria-sort`/the direction indicator; DataTable never sorts `data` itself. */
    readonly sort = input<SortState | null>(null);
    /** Omit `page`/`total` to skip rendering the internal Pagination control entirely. */
    readonly page = input<number | null>(null);
    readonly pageSize = input(10);
    readonly total = input<number | null>(null);

    readonly rowClick = output<T>();
    readonly sortChange = output<SortState>();
    readonly pageChange = output<number>();

    protected readonly showPagination = computed(() => this.page() !== null && this.total() !== null);

    protected trackRow = (index: number, item: T): string | number => {
        const fn = this.trackBy();
        return fn ? fn(item) : index;
    };

    /** asc → desc → none (unsorted) → asc, cycling per column; switching to a different sortable column always starts at asc. */
    toggleSort(column: ColumnDef<T>): void {
        if (!column.sortable) {
            return;
        }
        const current = this.sort();
        const sameColumn = current?.key === column.key;
        const direction: SortState['direction'] =
            !sameColumn || current!.direction === 'none' ? 'asc' : current!.direction === 'asc' ? 'desc' : 'none';
        this.sortChange.emit({ key: column.key, direction });
    }

    ariaSort(column: ColumnDef<T>): 'ascending' | 'descending' | 'none' | null {
        if (!column.sortable) {
            return null;
        }
        const current = this.sort();
        if (current?.key !== column.key || current.direction === 'none') {
            return 'none';
        }
        return current.direction === 'asc' ? 'ascending' : 'descending';
    }

    /** Only reached for a real `keyof T` column — a synthetic-key column with no `cellTemplate` has no raw value to fall back to. */
    cellValue(row: T, column: ColumnDef<T>): unknown {
        return (row as Record<string, unknown>)[column.key];
    }
}
