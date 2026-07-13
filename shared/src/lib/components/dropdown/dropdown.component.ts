import { CommonModule } from '@angular/common';
import {
    Component,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostListener,
    Input,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {
    ControlValueAccessor,
    FormsModule,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    ValidationErrors,
    Validator
} from '@angular/forms';

@Component({
    selector: 'app-dropdown',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DropdownComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DropdownComponent),
            multi: true
        }
    ]
})
export class DropdownComponent implements ControlValueAccessor, Validator, OnInit {
    @Input() label = '';
    @Input() placeholder = 'Select an option';
    @Input() options: { label: string; value: any; icon?: string }[] = [];
    @Input() required = false;
    @Input() searchable = true;
    @Input() disabled = false;
    @Input() helpText?: string;

    @Output() changed = new EventEmitter<any>();

    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    showDropdown = false;
    filteredOptions: { label: string; value: any; icon?: string }[] = [];
    value: any = null;
    searchTerm = '';
    errorMessage: string | null = null;
    focusedIndex = 0;
    selectedLabel = '';

    private onChange = (val: any) => {};
    private onTouched = () => {};

    constructor(private el: ElementRef) {}

    ngOnInit(): void {
        this.filteredOptions = [...this.options];
    }

    writeValue(value: any): void {
        this.value = value;
        this.updateSelectedLabel();
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

    toggleDropdown(): void {
        if (this.disabled) return;
        this.showDropdown = !this.showDropdown;
        if (this.showDropdown && this.searchable) {
            setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
        }
    }

    selectOption(option: any): void {
        this.value = option.value;
        this.updateSelectedLabel();
        this.onChange(this.value);
        this.changed.emit(option.value);
        this.onTouched();
        this.showDropdown = false;
    }

    filterOptions(element: any): void {
        this.searchTerm = (element as HTMLInputElement).value;
        this.filteredOptions = this.options.filter(opt =>
            opt.label.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    private updateSelectedLabel(): void {
        const selected = this.options.find(o => o.value === this.value);
        this.selectedLabel = selected ? selected.label : '';
    }

    @HostListener('document:click', ['$event'])
    handleOutsideClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!this.el.nativeElement.contains(target)) {
            this.showDropdown = false;
        }
    }

    @HostListener('keydown', ['$event'])
    handleKeyboard(event: KeyboardEvent): void {
        if (!this.showDropdown) return;
        const maxIndex = this.filteredOptions.length - 1;

        switch (event.key) {
            case 'ArrowDown':
                this.focusedIndex = this.focusedIndex < maxIndex ? this.focusedIndex + 1 : 0;
                event.preventDefault();
                break;
            case 'ArrowUp':
                this.focusedIndex = this.focusedIndex > 0 ? this.focusedIndex - 1 : maxIndex;
                event.preventDefault();
                break;
            case 'Enter':
                const selected = this.filteredOptions[this.focusedIndex];
                if (selected) this.selectOption(selected);
                event.preventDefault();
                break;
            case 'Escape':
                this.showDropdown = false;
                break;
        }
    }

    protected readonly HTMLInputElement = HTMLInputElement;
}
