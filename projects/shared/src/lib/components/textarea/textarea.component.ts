import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators } from '@angular/forms';
import { BaseValueAccessor } from '../base/base-value-accessor';
import { ValidationMessageService } from '../../services/validation-message.service';

let nextUid = 0;

@Component({
    selector: 'app-textarea',
    standalone: true,
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: TextareaComponent, multi: true },
        { provide: NG_VALIDATORS, useExisting: TextareaComponent, multi: true }
    ],
    templateUrl: './textarea.component.html',
    styleUrl: './textarea.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextareaComponent extends BaseValueAccessor<string> implements Validator {
    private readonly messages = inject(ValidationMessageService);

    readonly label = input('');
    readonly placeholder = input('');
    readonly rows = input(4);
    readonly maxLength = input<number | null>(null);
    readonly required = input(false);

    protected readonly uid = `ta-${nextUid++}`;
    protected readonly touched = signal(false);
    protected readonly charCount = computed(() => (this.value() ?? '').length);

    private readonly validationErrors = computed<ValidationErrors | null>(() => {
        const control = { value: this.value() ?? '' } as AbstractControl;
        const errors: ValidationErrors = {};
        if (this.required()) Object.assign(errors, Validators.required(control) ?? {});
        if (this.maxLength() != null) Object.assign(errors, Validators.maxLength(this.maxLength()!)(control) ?? {});
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
        this.emitValue((event.target as HTMLTextAreaElement).value);
    }

    onBlur(): void {
        this.touched.set(true);
        this.markTouched();
    }
}
