import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseValueAccessor } from '../base/base-value-accessor';

export interface RadioOption<T> {
    label: string;
    value: T;
    disabled?: boolean;
}

let nextUid = 0;

@Component({
    selector: 'app-radio-group',
    standalone: true,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: RadioGroupComponent, multi: true }],
    templateUrl: './radio-group.component.html',
    styleUrl: './radio-group.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioGroupComponent<T = string> extends BaseValueAccessor<T> {
    readonly options = input.required<RadioOption<T>[]>();
    readonly label = input<string>('');
    readonly layout = input<'row' | 'column'>('column');
    readonly compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);

    protected readonly groupName = `rg-${nextUid++}`;

    isSelected(option: RadioOption<T>): boolean {
        const current = this.value();
        return current !== null && this.compareWith()(option.value, current);
    }

    select(option: RadioOption<T>): void {
        if (option.disabled || this.disabled()) {
            return;
        }
        this.emitValue(option.value);
        this.markTouched();
    }

    optionId(index: number): string {
        return `${this.groupName}-opt-${index}`;
    }
}
