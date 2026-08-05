import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../../layout/index';
import { BaseValueAccessor } from '../base/base-value-accessor';

export interface CardOption<T> {
    label: string;
    value: T;
    description?: string;
    icon?: string;
    badge?: string;
    disabled?: boolean;
}

@Component({
    selector: 'app-card-selector',
    standalone: true,
    imports: [IconComponent],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: CardSelectorComponent, multi: true }],
    templateUrl: './card-selector.component.html',
    styleUrl: './card-selector.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardSelectorComponent<T = string> extends BaseValueAccessor<T> {
    readonly options = input.required<CardOption<T>[]>();
    readonly label = input('');
    readonly columns = input(3);
    readonly responsive = input(true);
    readonly compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);

    protected readonly focusedIndex = signal(0);

    isSelected(option: CardOption<T>): boolean {
        const value = this.value();
        return value !== null && this.compareWith()(option.value, value);
    }

    select(option: CardOption<T>): void {
        if (option.disabled || this.disabled()) {
            return;
        }
        this.emitValue(option.value);
        this.markTouched();
    }

    onKeydown(event: KeyboardEvent): void {
        const opts = this.options();
        const len = opts.length;
        if (!len) {
            return;
        }
        const cols = this.columns();

        switch (event.key) {
            case 'ArrowRight':
                this.focusedIndex.update((i) => (i + 1) % len);
                event.preventDefault();
                break;
            case 'ArrowLeft':
                this.focusedIndex.update((i) => (i - 1 + len) % len);
                event.preventDefault();
                break;
            case 'ArrowDown':
                this.focusedIndex.update((i) => (i + cols) % len);
                event.preventDefault();
                break;
            case 'ArrowUp':
                this.focusedIndex.update((i) => (i - cols + len) % len);
                event.preventDefault();
                break;
            case 'Enter':
            case ' ': {
                const focused = opts[this.focusedIndex()];
                if (focused) {
                    this.select(focused);
                }
                event.preventDefault();
                break;
            }
        }
    }
}
