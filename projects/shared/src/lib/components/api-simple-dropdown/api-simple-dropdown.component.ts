import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { IconComponent } from '@nexacore/platform';
import { DropdownOption } from '../dropdown/dropdown.component';
import { SmartDropdownLoader, SmartDropdownPage } from '../smart-dropdown/smart-dropdown.model';

let nextUid = 0;

/**
 * `SmartDropdownMode: 'api-simple'` implementation — one debounced fetch per
 * query, always page 0, no scroll pagination. One of the three concrete
 * dropdown components `SmartDropdownComponent` delegates to based on its
 * `mode()`; usable directly when a caller already knows they only need this
 * mode. Not a ControlValueAccessor itself — plain `value`/`valueChange`
 * binding, since `SmartDropdownComponent` is the sole form-integration point
 * for all three modes.
 */
@Component({
    selector: 'app-api-simple-dropdown',
    standalone: true,
    imports: [OverlayModule, IconComponent],
    templateUrl: './api-simple-dropdown.component.html',
    styleUrl: './api-simple-dropdown.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApiSimpleDropdownComponent<T = string> {
    readonly value = input<T | null>(null);
    readonly disabled = input(false);
    readonly loadOptions = input<SmartDropdownLoader<T> | null>(null);
    readonly label = input('');
    readonly placeholder = input('Select...');
    readonly searchable = input(true);
    readonly searchPlaceholder = input('Search...');
    readonly debounceMs = input(400);
    readonly errorMessage = input<string | null>(null);
    readonly compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);
    /** Known label for the current value at load time (e.g. editing a record) — avoids a fetch just to display it. */
    readonly initialOption = input<DropdownOption<T> | null>(null);
    /** Last-resort label fallback for a value written onto the control from
     * outside `selectOption()`/`initialOption` — e.g. a value copied in from
     * another control programmatically. */
    readonly displayWith = input<((value: T) => string) | null>(null);

    readonly valueChange = output<T | null>();
    /** Emitted on close/blur — the host bridges this into its own CVA `onTouched`. */
    readonly touched = output<void>();

    protected readonly uid = `sd-simple-${nextUid++}`;
    protected readonly open = signal(false);
    protected readonly query = signal('');
    protected readonly loading = signal(false);
    protected readonly activeIndex = signal(-1);
    /** Set only from `selectOption()` (a real user pick) — `triggerLabel` falls
     * back through `displayOptions()`/`initialOption()`/`displayWith()` for any
     * value that didn't come from a pick, so this alone is never the sole
     * source of truth for what's displayed. */
    private readonly lastPicked = signal<{ value: T; label: string } | null>(null);
    /** Matched to the trigger's live width right before opening, so the
     * overlay panel lines up with its parent field instead of falling back
     * to `$panel-min-width`. */
    protected readonly triggerWidth = signal(0);

    private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
    private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

    private readonly fetchedOptions = signal<DropdownOption<T>[]>([]);
    private readonly search$ = new Subject<string>();

    protected readonly displayOptions = computed<DropdownOption<T>[]>(() => this.fetchedOptions());

    protected readonly selectedOption = computed<DropdownOption<T> | null>(() => {
        const value = this.value();
        if (value === null) {
            return null;
        }
        const cmp = this.compareWith();
        return this.displayOptions().find((o) => cmp(o.value, value)) ?? null;
    });

    protected readonly triggerLabel = computed(() => {
        const value = this.value();
        if (value === null) {
            return null;
        }
        const cmp = this.compareWith();
        const picked = this.lastPicked();
        if (picked && cmp(picked.value, value)) {
            return picked.label;
        }
        const inPool = this.displayOptions().find((o) => cmp(o.value, value));
        if (inPool) {
            return inPool.label;
        }
        const init = this.initialOption();
        if (init && cmp(init.value, value)) {
            return init.label;
        }
        return this.displayWith()?.(value) ?? null;
    });

    constructor() {
        this.search$
            .pipe(
                debounceTime(this.debounceMs()),
                distinctUntilChanged(),
                switchMap((q) => {
                    this.loading.set(true);
                    return this.fetchPage(q);
                }),
                takeUntilDestroyed()
            )
            .subscribe((result) => {
                this.fetchedOptions.set(result.items);
                this.loading.set(false);
                this.activeIndex.set(result.items.length ? 0 : -1);
            });
    }

    toggle(): void {
        if (this.disabled()) {
            return;
        }
        if (this.open()) {
            this.open.set(false);
            this.touched.emit();
            return;
        }

        this.triggerWidth.set(this.triggerButton()?.nativeElement.getBoundingClientRect().width ?? 0);
        // Deferred one microtask so the `cdkConnectedOverlayWidth` binding
        // reaches the CDK directive's input on its own change-detection pass
        // before the overlay actually attaches — see SmartDropdownComponent's
        // original implementation for the full rationale.
        queueMicrotask(() => {
            this.open.set(true);
            this.query.set('');
            this.search$.next('');
        });
    }

    close(): void {
        if (!this.open()) {
            return;
        }
        this.open.set(false);
        this.touched.emit();
    }

    onOverlayAttach(): void {
        this.searchInput()?.nativeElement.focus();
    }

    onQueryInput(event: Event): void {
        const q = (event.target as HTMLInputElement).value;
        this.query.set(q);
        this.search$.next(q);
    }

    selectOption(option: DropdownOption<T>): void {
        if (option.disabled) {
            return;
        }
        this.valueChange.emit(option.value);
        this.lastPicked.set({ value: option.value, label: option.label });
        this.close();
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

    private fetchPage(query: string): Observable<SmartDropdownPage<T>> {
        const loader = this.loadOptions();
        if (!loader) {
            return of({ items: [], hasMore: false });
        }
        return loader(query, 0).pipe(catchError(() => of({ items: [], hasMore: false })));
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
