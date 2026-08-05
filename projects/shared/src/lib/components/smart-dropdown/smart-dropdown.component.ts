import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, signal, viewChild } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { IconComponent } from '@nexacore/platform';
import { BaseValueAccessor } from '../base/base-value-accessor';
import { DropdownOption } from '../dropdown/dropdown.component';

export type SmartDropdownMode = 'static' | 'api-simple' | 'api-scroll';

export interface SmartDropdownPage<T> {
    items: DropdownOption<T>[];
    hasMore: boolean;
}

/**
 * Fetches one page of options for a query. The caller owns the actual HTTP
 * call (via ApiService, not a raw HttpClient here) and maps its own response
 * shape into DropdownOption<T> — this component has no domain knowledge of
 * what it's listing. `page` is always 0 for 'api-simple' mode; 'api-scroll'
 * calls again with an incrementing page as the user scrolls near the bottom.
 */
export type SmartDropdownLoader<T> = (query: string, page: number) => Observable<SmartDropdownPage<T>>;

let nextUid = 0;

@Component({
    selector: 'app-smart-dropdown',
    standalone: true,
    imports: [OverlayModule, IconComponent],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: SmartDropdownComponent, multi: true },
        { provide: NG_VALIDATORS, useExisting: SmartDropdownComponent, multi: true }
    ],
    templateUrl: './smart-dropdown.component.html',
    styleUrl: './smart-dropdown.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmartDropdownComponent<T = string> extends BaseValueAccessor<T> implements Validator {
    readonly mode = input<SmartDropdownMode>('static');
    /** Options for 'static' mode. */
    readonly options = input<DropdownOption<T>[]>([]);
    /** Fetch function for 'api-simple'/'api-scroll' modes. */
    readonly loadOptions = input<SmartDropdownLoader<T> | null>(null);
    readonly label = input('');
    readonly placeholder = input('Select...');
    readonly searchable = input(true);
    readonly searchPlaceholder = input('Search...');
    readonly debounceMs = input(400);
    readonly required = input(false);
    readonly errorMessage = input<string | null>(null);
    readonly compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);
    /** Known label for the current value at load time (async modes; e.g. editing a record) — avoids a fetch just to display it. */
    readonly initialOption = input<DropdownOption<T> | null>(null);

    protected readonly uid = `sd-${nextUid++}`;
    protected readonly open = signal(false);
    protected readonly query = signal('');
    protected readonly loading = signal(false);
    protected readonly loadingMore = signal(false);
    protected readonly activeIndex = signal(-1);
    protected readonly selectedLabel = signal<string | null>(null);
    /** Matched to the trigger's live width right before opening, so the
     * overlay panel lines up with its parent field instead of falling back
     * to `$panel-min-width`. */
    protected readonly triggerWidth = signal(0);

    private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
    private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

    private readonly page = signal(0);
    private readonly hasMore = signal(false);
    private readonly fetchedOptions = signal<DropdownOption<T>[]>([]);
    private readonly search$ = new Subject<string>();

    protected readonly displayOptions = computed<DropdownOption<T>[]>(() => {
        if (this.mode() === 'static') {
            const q = this.query().trim().toLowerCase();
            const opts = this.options();
            return this.searchable() && q ? opts.filter((o) => o.label.toLowerCase().includes(q)) : opts;
        }
        return this.fetchedOptions();
    });

    protected readonly selectedOption = computed<DropdownOption<T> | null>(() => {
        const value = this.value();
        if (value === null) {
            return null;
        }
        const cmp = this.compareWith();
        const pool = this.mode() === 'static' ? this.options() : this.displayOptions();
        return pool.find((o) => cmp(o.value, value)) ?? null;
    });

    protected readonly triggerLabel = computed(() =>
        this.mode() === 'static' ? (this.selectedOption()?.label ?? null) : this.selectedLabel()
    );

    constructor() {
        super();

        effect(() => {
            const init = this.initialOption();
            const value = this.value();
            if (init && value !== null && this.compareWith()(init.value, value)) {
                this.selectedLabel.set(init.label);
            }
        });

        this.search$
            .pipe(
                debounceTime(this.debounceMs()),
                distinctUntilChanged(),
                switchMap((q) => {
                    this.page.set(0);
                    this.loading.set(true);
                    return this.fetchPage(q, 0);
                }),
                takeUntilDestroyed()
            )
            .subscribe((result) => {
                this.fetchedOptions.set(result.items);
                this.hasMore.set(result.hasMore);
                this.loading.set(false);
                this.activeIndex.set(result.items.length ? 0 : -1);
            });
    }

    validate(): ValidationErrors | null {
        return this.required() && this.value() === null ? { required: true } : null;
    }

    toggle(): void {
        if (this.disabled()) {
            return;
        }
        if (this.open()) {
            this.open.set(false);
            this.markTouched();
            return;
        }

        this.triggerWidth.set(this.triggerButton()?.nativeElement.getBoundingClientRect().width ?? 0);
        // Deferred one microtask so the `cdkConnectedOverlayWidth` binding
        // reaches the CDK directive's input on its own change-detection pass
        // before the overlay actually attaches — opening in the same tick as
        // the width write let the overlay attach with the old (initial 0)
        // width on the very first open, falling back to the panel's CSS
        // `min-width` instead of matching the trigger.
        queueMicrotask(() => {
            this.open.set(true);
            this.query.set('');
            if (this.mode() !== 'static') {
                this.search$.next('');
            }
        });
    }

    close(): void {
        if (!this.open()) {
            return;
        }
        this.open.set(false);
        this.markTouched();
    }

    /** Bound to the overlay's `(attach)` output — fires once the panel is in
     * the DOM, the right moment to move focus into the search box. */
    onOverlayAttach(): void {
        this.searchInput()?.nativeElement.focus();
    }

    onQueryInput(event: Event): void {
        const q = (event.target as HTMLInputElement).value;
        this.query.set(q);
        if (this.mode() !== 'static') {
            this.search$.next(q);
        }
    }

    selectOption(option: DropdownOption<T>): void {
        if (option.disabled) {
            return;
        }
        this.emitValue(option.value);
        this.selectedLabel.set(option.label);
        this.close();
    }

    onPanelScroll(event: Event): void {
        if (this.mode() !== 'api-scroll' || this.loading() || this.loadingMore() || !this.hasMore()) {
            return;
        }
        const el = event.target as HTMLElement;
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
        if (!nearBottom) {
            return;
        }

        const nextPage = this.page() + 1;
        this.loadingMore.set(true);
        this.fetchPage(this.query(), nextPage).subscribe((result) => {
            this.page.set(nextPage);
            this.fetchedOptions.update((current) => [...current, ...result.items]);
            this.hasMore.set(result.hasMore);
            this.loadingMore.set(false);
        });
    }

    onListKeydown(event: KeyboardEvent): void {
        const opts = this.displayOptions();
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.moveActive(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.moveActive(-1);
                break;
            case 'Enter':
                event.preventDefault();
                if (this.activeIndex() >= 0 && opts[this.activeIndex()]) {
                    this.selectOption(opts[this.activeIndex()]);
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.close();
                break;
        }
    }

    private fetchPage(query: string, page: number): Observable<SmartDropdownPage<T>> {
        const loader = this.loadOptions();
        if (!loader) {
            return of({ items: [], hasMore: false });
        }
        return loader(query, page).pipe(catchError(() => of({ items: [], hasMore: false })));
    }

    private moveActive(delta: number): void {
        const opts = this.displayOptions();
        if (!opts.length) {
            return;
        }
        let next = this.activeIndex();
        for (let i = 0; i < opts.length; i++) {
            next = (next + delta + opts.length) % opts.length;
            if (!opts[next].disabled) {
                break;
            }
        }
        this.activeIndex.set(next);
    }
}
