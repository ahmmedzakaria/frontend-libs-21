import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    forwardRef,
    Input,
    OnInit,
    Output
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormBuilder,
    FormGroup,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR, ReactiveFormsModule,
    ValidationErrors,
    Validators
} from '@angular/forms';
import { TextboxComponent } from '../textbox/textbox.component';
import { ValidationMessageService } from '../../services/validation-message.service';

@Component({
    selector: 'app-password-group',
    standalone: true,
    imports: [CommonModule, TextboxComponent, ReactiveFormsModule],
    templateUrl: './password-group.component.html',
    styleUrls: ['./password-group.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PasswordGroupComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PasswordGroupComponent),
            multi: true
        }
    ]
})
export class PasswordGroupComponent implements ControlValueAccessor, OnInit {
    @Input() label = 'Password';
    @Input() confirmLabel = 'Confirm Password';
    @Input() required = true;
    @Input() floating = true;
    @Input() showStrength = true;
    @Input() disabled = false;

    @Output() valueChange = new EventEmitter<string>();

    form!: FormGroup;
    showHints = false; // show tooltip panel

    private onChange = (value: any) => {};
    private onTouched = () => {};

    constructor(private fb: FormBuilder, private msg: ValidationMessageService) {}

    ngOnInit(): void {
        this.form = this.fb.group(
            {
                password: [
                    '',
                    [
                        this.required ? Validators.required : Validators.nullValidator,
                        this.passwordStrengthValidator()
                    ]
                ],
                confirmPassword: [
                    '',
                    this.required ? Validators.required : Validators.nullValidator
                ]
            },
            { validators: [this.matchPasswordsValidator()] }
        );

        this.form.valueChanges.subscribe(val => {
            if (this.form.valid) {
                this.onChange(val.password);
                this.valueChange.emit(val.password);
            } else {
                this.onChange(null);
            }
        });
    }

    writeValue(value: any): void {
        if (value) {
            this.form.patchValue({ password: value, confirmPassword: value }, { emitEvent: false });
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        isDisabled ? this.form.disable() : this.form.enable();
    }

    validate(): ValidationErrors | null {
        return this.form.valid ? null : { invalid: true };
    }

    // ---------------- Password validation helpers ----------------

    private passwordStrengthValidator() {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        return (control: AbstractControl) => {
            if (!control.value) return null;
            return regex.test(control.value) ? null : { passwordWeak: true };
        };
    }

    private matchPasswordsValidator() {
        return (group: AbstractControl): ValidationErrors | null => {
            const pass = group.get('password')?.value;
            const confirm = group.get('confirmPassword')?.value;
            return pass && confirm && pass !== confirm ? { mismatch: true } : null;
        };
    }

    // ---------------- Strength logic ----------------

    get passwordControl() {
        return this.form.get('password');
    }

    get confirmControl() {
        return this.form.get('confirmPassword');
    }

    get showMismatchError(): boolean {
        return this.form.hasError('mismatch') && this.confirmControl?.touched!;
    }

    get passwordCriteria() {
        const val = this.passwordControl?.value || '';
        return {
            length: val.length >= 8,
            upper: /[A-Z]/.test(val),
            lower: /[a-z]/.test(val),
            number: /\d/.test(val),
            special: /[@$!%*?&]/.test(val)
        };
    }

    get passwordScore(): number {
        const c = this.passwordCriteria;
        return [c.length, c.upper, c.lower, c.number, c.special].filter(Boolean).length;
    }

    get strengthPercent(): number {
        return (this.passwordScore / 5) * 100;
    }

    get strengthLabel(): string {
        if (this.passwordScore <= 2) return 'Weak';
        if (this.passwordScore <= 4) return 'Medium';
        return 'Strong';
    }

    get missingHints(): string[] {
        const c = this.passwordCriteria;
        const hints: string[] = [];
        if (!c.length) hints.push('Use at least 8 characters');
        if (!c.upper) hints.push('Add an uppercase letter');
        if (!c.lower) hints.push('Add a lowercase letter');
        if (!c.number) hints.push('Add a number');
        if (!c.special) hints.push('Add a special character (@, #, !, etc.)');
        return hints;
    }

    // tooltip visibility
    toggleHints(show: boolean) {
        this.showHints = show;
    }
}
