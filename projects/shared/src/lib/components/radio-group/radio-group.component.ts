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
    selector: 'app-radio-group',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './radio-group.component.html',
    styleUrls: ['./radio-group.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RadioGroupComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => RadioGroupComponent),
            multi: true
        }
    ]
})
export class RadioGroupComponent implements ControlValueAccessor, Validator {
    @Input() label = '';
    @Input() options: { label: string; value: any; description?: string; icon?: string }[] = [];
    @Input() required = false;
    @Input() helpText?: string;
    @Input() layout: 'horizontal' | 'vertical' | 'grid' = 'horizontal';
    @Input() columns = 3;

    value: any;
    disabled = false;
    errorMessage: string | null = null;

    private onChange = (val: any) => {};
    private onTouched = () => {};

    writeValue(value: any): void {
        this.value = value;
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

    onSelect(value: any): void {
        if (this.disabled) return;
        this.value = value;
        this.onChange(value);
        this.onTouched();
    }

    trackByValue(_: number, item: any) {
        return item.value;
    }
}
