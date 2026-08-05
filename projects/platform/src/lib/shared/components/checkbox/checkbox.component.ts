import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../../layout/index';
import { BaseValueAccessor } from '../base/base-value-accessor';

let nextUid = 0;

@Component({
    selector: 'app-checkbox',
    standalone: true,
    imports: [IconComponent],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: CheckboxComponent, multi: true }],
    templateUrl: './checkbox.component.html',
    styleUrl: './checkbox.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent extends BaseValueAccessor<boolean> {
    readonly label = input<string>('');
    /** Visual "partially selected" state — e.g. a table header checkbox when only some rows are selected. */
    readonly indeterminate = input<boolean>(false);

    protected readonly uid = `cb-${nextUid++}`;

    handleChange(event: Event): void {
        this.emitValue((event.target as HTMLInputElement).checked);
    }
}
