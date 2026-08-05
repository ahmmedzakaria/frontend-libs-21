import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators } from '@angular/forms';
import { IconComponent } from '../../../layout/index';
import { BaseValueAccessor } from '../base/base-value-accessor';
import { ValidationMessageService } from '../../services/validation-message.service';

export type TextboxType = 'text' | 'email' | 'tel' | 'number';

let nextUid = 0;

@Component({
    selector: 'app-textbox',
    standalone: true,
    imports: [IconComponent],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: TextboxComponent, multi: true },
        { provide: NG_VALIDATORS, useExisting: TextboxComponent, multi: true }
    ],
    templateUrl: './textbox.component.html',
    styleUrl: './textbox.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextboxComponent extends BaseValueAccessor<string> implements Validator {
    private readonly messages = inject(ValidationMessageService);

    readonly label = input('');
    readonly placeholder = input('');
    readonly type = input<TextboxType>('text');
    /** Icon registry key, e.g. 'user', 'phone' — see @nexacore/layout's ICONS map. */
    readonly icon = input<string | null>(null);
    readonly required = input(false);
    readonly minLength = input<number | null>(null);
    readonly maxLength = input<number | null>(null);
    /** Strips non-digit characters as the user types. */
    readonly onlyNumber = input(false);
    /** Strips everything but letters/digits/spaces as the user types. */
    readonly noSpecialChars = input(false);
    readonly isReadonly = input(false, { alias: 'readonly' });

    protected readonly uid = `tb-${nextUid++}`;
    protected readonly touched = signal(false);

    private readonly validationErrors = computed<ValidationErrors | null>(() => {
        const control = { value: this.value() ?? '' } as AbstractControl;
        const errors: ValidationErrors = {};
        if (this.required()) Object.assign(errors, Validators.required(control) ?? {});
        if (this.minLength() != null) Object.assign(errors, Validators.minLength(this.minLength()!)(control) ?? {});
        if (this.maxLength() != null) Object.assign(errors, Validators.maxLength(this.maxLength()!)(control) ?? {});
        if (this.type() === 'email') Object.assign(errors, Validators.email(control) ?? {});
        return Object.keys(errors).length ? errors : null;
    });

    protected readonly errorMessage = computed(() => {
        if (!this.touched()) {
            return null;
        }
        const msgs = this.messages.buildMessages(this.validationErrors());
        return msgs.length ? msgs.join(' ') : null;
    });

    validate(): ValidationErrors | null {
        return this.validationErrors();
    }

    onInput(event: Event): void {
        const inputEl = event.target as HTMLInputElement;
        let val = inputEl.value;
        if (this.onlyNumber()) {
            val = val.replace(/[^0-9]/g, '');
        } else if (this.noSpecialChars()) {
            val = val.replace(/[^a-zA-Z0-9\s]/g, '');
        }
        if (val !== inputEl.value) {
            inputEl.value = val;
        }
        this.emitValue(val);
    }

    onBlur(): void {
        this.touched.set(true);
        this.markTouched();
    }
}
