import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef, HostListener } from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    NG_VALIDATORS,
    Validator,
    ValidationErrors,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';

export interface CardOption {
    label: string;
    value: any;
    description?: string;
    icon?: string;
    badge?: string;
    disabled?: boolean;
}

@Component({
    selector: 'app-card-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './card-selector.component.html',
    styleUrls: ['./card-selector.component.scss'],
    animations: [
        trigger('selectAnim', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.95)' }),
                animate('150ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
            ])
        ])
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CardSelectorComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => CardSelectorComponent),
            multi: true
        }
    ]
})
export class CardSelectorComponent implements ControlValueAccessor, Validator {
    @Input() label = '';
    @Input() options: CardOption[] = [];
    @Input() required = false;
    @Input() columns = 3;
    @Input() helpText?: string;
    @Input() responsive = true;

    value: any;
    focusedIndex = 0;
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

    trackByValue(_: number, item: CardOption) {
        return item.value;
    }

    // --- Keyboard Navigation ---
    @HostListener('keydown', ['$event'])
    handleKeyboard(event: KeyboardEvent) {
        const cols = this.columns;
        const len = this.options.length;
        switch (event.key) {
            case 'ArrowRight':
                this.focusedIndex = (this.focusedIndex + 1) % len;
                event.preventDefault();
                break;
            case 'ArrowLeft':
                this.focusedIndex = (this.focusedIndex - 1 + len) % len;
                event.preventDefault();
                break;
            case 'ArrowDown':
                this.focusedIndex = (this.focusedIndex + cols) % len;
                event.preventDefault();
                break;
            case 'ArrowUp':
                this.focusedIndex = (this.focusedIndex - cols + len) % len;
                event.preventDefault();
                break;
            case 'Enter':
            case ' ':
                const focused = this.options[this.focusedIndex];
                if (focused && !focused.disabled) this.onSelect(focused.value);
                event.preventDefault();
                break;
        }
    }
}
