import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    NG_VALIDATORS,
    Validator,
    ValidationErrors,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';

@Component({
    selector: 'app-checkbox',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './checkbox.component.html',
    styleUrls: ['./checkbox.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CheckboxComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => CheckboxComponent),
            multi: true
        }
    ]
})
export class CheckboxComponent implements ControlValueAccessor, Validator {
    @Input() label = '';
    @Input() description?: string;
    @Input() required = false;
    @Input() helpText?: string;
    @Input() variant: 'default' | 'switch' | 'card' = 'default';
    @Input() disabled = false;
    @Input() indeterminate = false;

    value = false;
    errorMessage: string | null = null;

    private onChange = (val: any) => {};
    private onTouched = () => {};

    writeValue(value: boolean): void {
        this.value = !!value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    validate(): ValidationErrors | null {
        if (this.required && !this.value) {
            this.errorMessage = `${this.label || 'This field'} is required`;
            return { required: true };
        }
        this.errorMessage = null;
        return null;
    }

    toggle(): void {
        if (this.disabled) return;
        this.value = !this.value;
        this.indeterminate = false;
        this.onChange(this.value);
        this.onTouched();
    }
}
