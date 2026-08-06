import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CardSelectorComponent } from '../card-selector/card-selector.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { PasswordGroupComponent } from '../password-group/password-group.component';
import { RadioGroupComponent } from '../radio-group/radio-group.component';
import { SmartDropdownComponent } from '../smart-dropdown/smart-dropdown.component';
import { TextareaComponent } from '../textarea/textarea.component';
import { TextboxComponent } from '../textbox/textbox.component';
import { ValidationMessageService } from '../../services/validation-message.service';
import { FieldConfig, TextFieldConfig } from './dynamic-form.model';

function requiredArray(control: AbstractControl): ValidationErrors | null {
    return Array.isArray(control.value) && control.value.length > 0 ? null : { required: true };
}

function defaultValueFor(field: FieldConfig): unknown {
    switch (field.type) {
        case 'checkbox':
            return false;
        case 'file-upload':
            return [];
        case 'date-range':
            return { start: null, end: null };
        case 'radio':
        case 'dropdown':
        case 'smart-dropdown':
        case 'card-selector':
            return null;
        default:
            return '';
    }
}

function validatorsFor(field: FieldConfig): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    if (field.required) {
        if (field.type === 'checkbox') {
            validators.push(Validators.requiredTrue);
        } else if (field.type === 'file-upload') {
            validators.push(requiredArray);
        } else {
            validators.push(Validators.required);
        }
    }
    if (field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number') {
        if (field.minLength != null) {
            validators.push(Validators.minLength(field.minLength));
        }
        if (field.maxLength != null) {
            validators.push(Validators.maxLength(field.maxLength));
        }
    } else if (field.type === 'textarea' && field.maxLength != null) {
        validators.push(Validators.maxLength(field.maxLength));
    }
    if (field.type === 'email') {
        validators.push(Validators.email);
    }
    return validators;
}

/**
 * Renders a `FieldConfig[]` into a single flat `FormGroup`, composing the
 * existing Tier 1 form controls (Textbox, Dropdown, DatePicker, ...) instead
 * of any new input markup — see `dynamic-form.model.ts` for the field
 * vocabulary. Multi-step/wizard composition is intentionally out of scope;
 * nest this inside `<app-wizard-step [form]="...">` if that's ever needed.
 */
@Component({
    selector: 'app-dynamic-form',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        TextboxComponent,
        TextareaComponent,
        CheckboxComponent,
        RadioGroupComponent,
        DropdownComponent,
        SmartDropdownComponent,
        DatePickerComponent,
        CardSelectorComponent,
        FileUploadComponent,
        PasswordGroupComponent
    ],
    exportAs: 'dynamicForm',
    templateUrl: './dynamic-form.component.html',
    styleUrl: './dynamic-form.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormComponent {
    private readonly messages = inject(ValidationMessageService);

    readonly fields = input.required<FieldConfig[]>();
    readonly initialValue = input<Record<string, unknown>>({});
    readonly columns = input(1);

    /** Fires once, right after the FormGroup is (re)built from `fields()`. */
    readonly formReady = output<FormGroup>();
    readonly valueChange = output<Record<string, unknown>>();
    /** Fires from `submit()`, only when the built form is valid. */
    readonly submitted = output<Record<string, unknown>>();

    readonly form = signal<FormGroup | null>(null);
    /** Bumped on every control event (value/status/touched) so `errorFor()`
     * re-evaluates under OnPush — `markAsTouched()` alone doesn't emit
     * `statusChanges`, only `AbstractControl.events` covers every case. */
    private readonly formVersion = signal(0);

    constructor() {
        effect((onCleanup) => {
            const fields = this.fields();
            const initial = this.initialValue();
            const group = new FormGroup(
                Object.fromEntries(fields.map((field) => [field.key, this.buildControl(field, initial)]))
            );
            this.form.set(group);
            this.formReady.emit(group);

            const valueSub = group.valueChanges.subscribe(() => this.valueChange.emit(group.getRawValue()));
            const eventsSub = group.events.subscribe(() => this.formVersion.update((n) => n + 1));
            onCleanup(() => {
                valueSub.unsubscribe();
                eventsSub.unsubscribe();
            });
        });
    }

    /** For control types with no self-rendered error text (Dropdown,
     * SmartDropdown, DatePicker) — everything else self-validates and
     * self-displays via its own `NG_VALIDATORS` + touched state. */
    errorFor(key: string): string | null {
        this.formVersion();
        const control = this.form()?.get(key);
        if (!control || !control.touched || control.valid) {
            return null;
        }
        const message = this.messages.buildMessages(control.errors).join(' ');
        return message || null;
    }

    isTextField(field: FieldConfig): field is TextFieldConfig {
        return field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number';
    }

    submit(): void {
        const group = this.form();
        if (!group) {
            return;
        }
        group.markAllAsTouched();
        if (group.valid) {
            this.submitted.emit(group.getRawValue());
        }
    }

    private buildControl(field: FieldConfig, initial: Record<string, unknown>): FormControl {
        const value = field.key in initial ? initial[field.key] : defaultValueFor(field);
        return new FormControl(value, { validators: validatorsFor(field) });
    }
}
