import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
    selector: 'app-textarea',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './textarea.component.html',
    styleUrls: ['./textarea.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextareaComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TextareaComponent),
            multi: true
        }
    ]
})
export class TextareaComponent implements ControlValueAccessor, Validator, AfterViewInit {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() rows = 3;
    @Input() maxLength?: number;
    @Input() helpText?: string;
    @Input() required = false;
    @Input() autoResize = true;
    @Input() disabled = false;

    @ViewChild('textareaEl') textareaEl!: ElementRef<HTMLTextAreaElement>;

    value = '';
    touched = false;
    errorMessage: string | null = null;

    private onChange = (val: any) => {};
    private onTouched = () => {};

    ngAfterViewInit(): void {
        if (this.autoResize) {
            this.adjustHeight();
        }
    }

    writeValue(value: string): void {
        this.value = value || '';
        if (this.autoResize) this.adjustHeight();
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
        if (this.required && !this.value.trim()) {
            this.errorMessage = `${this.label || 'This field'} is required`;
            return { required: true };
        }
        this.errorMessage = null;
        return null;
    }

    onInput(event: Event): void {
        const input = event.target as HTMLTextAreaElement;
        this.value = input.value;
        this.onChange(this.value);
        if (this.autoResize) this.adjustHeight();
    }

    onBlur(): void {
        this.touched = true;
        this.onTouched();
    }

    private adjustHeight(): void {
        const el = this.textareaEl?.nativeElement;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    }
}
