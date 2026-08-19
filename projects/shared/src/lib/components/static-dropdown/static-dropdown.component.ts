import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { IconComponent } from '@nexacore/platform';
import { DropdownOption } from '../dropdown/dropdown.component';

let nextUid = 0;

/**
 * `DynamicDropdownMode: 'static'` implementation — options are supplied up
 * front and filtered locally as the user types, no HTTP involved. One of the
 * three concrete dropdown components `DynamicDropdownComponent` delegates to
 * based on its `mode()`; usable directly when a caller already knows they
 * only need this mode. Not a ControlValueAccessor itself — plain
 * `value`/`valueChange` binding, since `DynamicDropdownComponent` is the sole
 * form-integration point for all three modes.
 */
@Component({
    selector: 'app-static-dropdown',
    standalone: true,
    imports: [OverlayModule, IconComponent],
    templateUrl: './static-dropdown.component.html',
    styleUrl: './static-dropdown.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaticDropdownComponent<T = string> {
    readonly value = input<T | null>(null);
    readonly disabled = input(false);
    readonly options = input<DropdownOption<T>[]>([]);
    readonly label = input('');
    readonly placeholder = input('Select...');
    readonly searchable = input(true);
    readonly searchPlaceholder = input('Search...');
    readonly errorMessage = input<string | null>(null);
    readonly compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);

    readonly valueChange = output<T | null>();
    /** Emitted on close/blur — the host bridges this into its own CVA `onTouched`. */
    readonly touched = output<void>();

    protected readonly uid = `sd-static-${nextUid++}`;
    protected readonly open = signal(false);
    protected readonly query = signal('');
    protected readonly activeIndex = signal(-1);
    /** Matched to the trigger's live width right before opening, so the
     * overlay panel lines up with its parent field instead of falling back
     * to `$panel-min-width`. */
    protected readonly triggerWidth = signal(0);

    private readonly triggerButton = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
    private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

    protected readonly displayOptions = computed<DropdownOption<T>[]>(() => {
        const q = this.query().trim().toLowerCase();
        const opts = this.options();
        return this.searchable() && q ? opts.filter((o) => o.label.toLowerCase().includes(q)) : opts;
    });

    protected readonly selectedOption = computed<DropdownOption<T> | null>(() => {
        const value = this.value();
        if (value === null) {
            return null;
        }
        const cmp = this.compareWith();
        return this.options().find((o) => cmp(o.value, value)) ?? null;
    });

    protected readonly triggerLabel = computed(() => this.selectedOption()?.label ?? null);

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
        // before the overlay actually attaches — see DynamicDropdownComponent's
        // original implementation for the full rationale.
        queueMicrotask(() => {
            this.open.set(true);
            this.query.set('');
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
        this.query.set((event.target as HTMLInputElement).value);
    }

    selectOption(option: DropdownOption<T>): void {
        if (option.disabled) {
            return;
        }
        this.valueChange.emit(option.value);
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
