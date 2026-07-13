import {
    Component,
    forwardRef,
    Input,
    Output,
    EventEmitter,
    OnInit,
    ChangeDetectionStrategy
} from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    NG_VALIDATORS,
    FormControl,
    Validators,
    ValidatorFn,
    ValidationErrors, ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ValidationMessageService } from '../../services/validation-message.service';

@Component({
    selector: 'app-textbox',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './textbox.component.html',
    styleUrls: ['./textbox.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextboxComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TextboxComponent),
            multi: true
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextboxComponent implements ControlValueAccessor, OnInit {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() type: 'text' | 'email' | 'password' | 'tel' | 'number' = 'text';
    @Input() required = false;
    @Input() minLength?: number;
    @Input() maxLength?: number;
    @Input() pattern?: string;
    @Input() icon?: string;
    @Input() serverErrors: string[] = [];
    @Input() floating = false;
    @Input() onlyNumber = false;
    @Input() noSpecialChars = false;
    @Input() disabled = false;
    @Input() readonly = false;
    @Input() toggleVisibility = false; // 👁️ NEW FEATURE

    @Output() valueChange = new EventEmitter<string>();

    control = new FormControl('');
    showPassword = false; // 👁️ track toggle state

    private onChange: any = () => {};
    protected onTouched: any = () => {};

    constructor(private messages: ValidationMessageService) {}

    ngOnInit(): void {
        const validators: ValidatorFn[] = [];
        if (this.required) validators.push(Validators.required);
        if (this.minLength) validators.push(Validators.minLength(this.minLength));
        if (this.maxLength) validators.push(Validators.maxLength(this.maxLength));
        if (this.pattern) validators.push(Validators.pattern(this.pattern));
        if (this.type === 'email') validators.push(Validators.email);
        if (this.type === 'password') validators.push(this.passwordValidator());

        this.control.setValidators(validators);

        this.control.valueChanges.subscribe((val) => {
            this.onChange(val);
            this.valueChange.emit(val??undefined);
        });
    }

    // password strength validation
    private passwordValidator(): ValidatorFn {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return (control) => {
            if (!control.value) return null;
            return regex.test(control.value) ? null : { passwordWeak: true };
        };
    }

    writeValue(obj: any): void {
        this.control.setValue(obj, { emitEvent: false });
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
        return this.control.errors;
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    get displayType(): string {
        if (this.type !== 'password') return this.type;
        return this.showPassword ? 'text' : 'password';
    }

    get hasError(): boolean {
        return this.control.invalid && (this.control.touched || this.serverErrors.length > 0);
    }

    get errorMessages(): string[] {
        const msgs = this.messages.buildMessages(this.control.errors);
        return [...msgs, ...this.serverErrors];
    }
}
