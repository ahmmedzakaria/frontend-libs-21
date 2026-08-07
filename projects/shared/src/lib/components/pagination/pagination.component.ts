import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '@nexacore/platform';

/**
 * Standalone page-navigation control, designed to be driven by DataTable but
 * usable on its own — page is 1-based throughout. Emits `pageChange` only
 * when the target page actually differs from the current one (clamped to
 * `[1, totalPages]`), so a consumer can wire it straight to `next()`/`prev()`
 * without its own bounds-checking.
 */
@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [IconComponent],
    templateUrl: './pagination.component.html',
    styleUrl: './pagination.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
    readonly page = input.required<number>();
    readonly pageSize = input.required<number>();
    readonly total = input.required<number>();
    /** Page-size choices to offer in a selector next to the range label. Empty (the default) renders no selector. */
    readonly pageSizeOptions = input<number[]>([]);
    readonly pageChange = output<number>();
    readonly pageSizeChange = output<number>();

    protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))));
    protected readonly canPrev = computed(() => this.page() > 1);
    protected readonly canNext = computed(() => this.page() < this.totalPages());
    protected readonly rangeStart = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
    protected readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

    first(): void {
        this.goTo(1);
    }
    prev(): void {
        this.goTo(this.page() - 1);
    }
    next(): void {
        this.goTo(this.page() + 1);
    }
    last(): void {
        this.goTo(this.totalPages());
    }

    onPageSizeSelect(event: Event): void {
        const size = Number((event.target as HTMLSelectElement).value);
        if (size !== this.pageSize()) {
            this.pageSizeChange.emit(size);
        }
    }

    private goTo(page: number): void {
        const clamped = Math.min(Math.max(1, page), this.totalPages());
        if (clamped !== this.page()) {
            this.pageChange.emit(clamped);
        }
    }
}
