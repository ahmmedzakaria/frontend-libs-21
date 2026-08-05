import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { IconComponent } from '../../../layout/index';
import { BaseValueAccessor } from '../base/base-value-accessor';

export interface DropdownOption<T> {
    label: string;
    value: T;
    icon?: string;
    disabled?: boolean;
}

let nextUid = 0;

/**
 * Single-select dropdown built on CDK Overlay with a connected (anchored)
 * position, following the ARIA combobox pattern: role="combobox" on the
 * trigger, role="listbox"/"option" in the panel, arrow-key navigation, and
 * aria-activedescendant instead of moving DOM focus into the panel.
 *
 * Static options, no built-in search — see SmartDropdown for the
 * search/async variant built on the same overlay-positioning approach.
 */
@Component({
    selector: 'app-dropdown',
    standalone: true,
    imports: [OverlayModule, IconComponent],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: DropdownComponent, multi: true }],
    templateUrl: './dropdown.component.html',
    styleUrl: './dropdown.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent<T = string> extends BaseValueAccessor<T> {
    readonly options = input.required<DropdownOption<T>[]>();
    readonly label = input('');
    readonly placeholder = input('Select an option');
    readonly required = input(false);
    readonly errorMessage = input<string | null>(null);
    readonly compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);

    protected readonly uid = `dd-${nextUid++}`;
    protected readonly open = signal(false);
    protected readonly activeIndex = signal(-1);

    protected readonly selectedOption = computed<DropdownOption<T> | null>(() => {
        const value = this.value();
        if (value === null) {
            return null;
        }
        const cmp = this.compareWith();
        return this.options().find((o) => cmp(o.value, value)) ?? null;
    });

    toggle(): void {
        if (this.disabled()) {
            return;
        }
        this.open.update((v) => !v);
        if (this.open()) {
            this.syncActiveIndexToSelection();
        } else {
            this.markTouched();
        }
    }

    close(): void {
        if (!this.open()) {
            return;
        }
        this.open.set(false);
        this.markTouched();
    }

    selectOption(option: DropdownOption<T>): void {
        if (option.disabled) {
            return;
        }
        this.emitValue(option.value);
        this.close();
    }

    optionId(index: number): string {
        return `${this.uid}-opt-${index}`;
    }

    onTriggerKeydown(event: KeyboardEvent): void {
        const opts = this.options();

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.open() ? this.moveActive(1) : this.openAndSync();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.open() ? this.moveActive(-1) : this.openAndSync();
                break;
            case 'Home':
                if (this.open()) {
                    event.preventDefault();
                    this.activeIndex.set(0);
                }
                break;
            case 'End':
                if (this.open()) {
                    event.preventDefault();
                    this.activeIndex.set(opts.length - 1);
                }
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (this.open() && this.activeIndex() >= 0) {
                    this.selectOption(opts[this.activeIndex()]);
                } else {
                    this.toggle();
                }
                break;
            case 'Escape':
                if (this.open()) {
                    event.preventDefault();
                    this.close();
                }
                break;
            case 'Tab':
                this.close();
                break;
        }
    }

    private openAndSync(): void {
        this.open.set(true);
        this.syncActiveIndexToSelection();
    }

    private moveActive(delta: number): void {
        const opts = this.options();
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

    private syncActiveIndexToSelection(): void {
        const cmp = this.compareWith();
        const value = this.value();
        const idx = value === null ? -1 : this.options().findIndex((o) => cmp(o.value, value));
        this.activeIndex.set(idx >= 0 ? idx : 0);
    }
}
