import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DynamicAttachmentComponent } from '../dynamic-attachment/dynamic-attachment.component';
import { CardSelectorComponent } from '../card-selector/card-selector.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { PasswordGroupComponent } from '../password-group/password-group.component';
import { RadioGroupComponent } from '../radio-group/radio-group.component';
import { SmartDropdownComponent } from '../smart-dropdown/smart-dropdown.component';
import { TextareaComponent } from '../textarea/textarea.component';
import { TextboxComponent } from '../textbox/textbox.component';
import { ValidationMessageService } from '../../services/validation-message.service';
import { DropdownConfigService } from '../../dropdown-config/dropdown-config.service';
import { FieldConfig, TextFieldConfig } from './dynamic-form.model';

function requiredArray(control: AbstractControl): ValidationErrors | null {
    return Array.isArray(control.value) && control.value.length > 0 ? null : { required: true };
}

function defaultValueFor(field: FieldConfig): unknown {
    switch (field.type) {
        case 'checkbox':
            return false;
        case 'attachment':
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
        } else if (field.type === 'attachment') {
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
        DynamicAttachmentComponent,
        PasswordGroupComponent
    ],
    exportAs: 'dynamicForm',
    templateUrl: './dynamic-form.component.html',
    styleUrl: './dynamic-form.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormComponent {
    private readonly messages = inject(ValidationMessageService);
    private readonly dropdownConfigService = inject(DropdownConfigService);

    /** Bound to `app-smart-dropdown`'s `compareWith` when a field doesn't supply
     * its own — binding an `input()` to an explicit `undefined` overrides the
     * component's own declared default instead of falling back to it, so this
     * has to be a real fallback value, not `field.compareWith ?? undefined`. */
    protected readonly defaultCompareWith = (a: unknown, b: unknown) => a === b;

    readonly fields = input.required<FieldConfig[]>();
    readonly initialValue = input<Record<string, unknown>>({});
    readonly columns = input(1);

    /** `fields()` with any plain-'dropdown'-typed `dropdownConfig`-carrying
     * field resolved into its full options/placeholder via
     * `DropdownConfigService.field()` — lets call sites declare
     * `{ key, type: 'dropdown', label, dropdownConfig }` directly instead of
     * calling the service themselves. A 'smart-dropdown'-typed field's
     * `dropdownConfig` is left untouched here and passed straight through to
     * `<app-smart-dropdown>`, which now resolves it itself (see
     * SmartDropdownComponent) — `<app-dropdown>` has no such input, so it
     * still needs pre-resolving. Used for both rendering and building the
     * FormGroup below. */
    protected readonly resolvedFields = computed<FieldConfig[]>(() => this.fields().map((field) => this.resolveField(field)));

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
            const fields = this.resolvedFields();
            const initial = this.initialValue();
            const group = new FormGroup(
                Object.fromEntries(fields.map((field) => [field.key, this.buildControl(field, initial)]))
            );
            this.form.set(group);
            this.formReady.emit(group);

            const valueSub = group.valueChanges.subscribe(() => this.valueChange.emit(group.getRawValue()));
            const eventsSub = group.events.subscribe(() => this.formVersion.update((n) => n + 1));

            // Wires each `subscribeEvent` field to the field publishing the same
            // `publishEvent` name, in the same FormGroup — see `dynamic-form.model.ts`.
            const eventSubs = fields.flatMap((field) => {
                const subscribeEvent = field.subscribeEvent;
                const publisher = subscribeEvent && fields.find((f) => f.publishEvent === subscribeEvent.event);
                const publisherControl = publisher && group.get(publisher.key);
                const subscriberControl = group.get(field.key);
                if (!subscribeEvent || !publisherControl || !subscriberControl) {
                    return [];
                }
                return [
                    publisherControl.valueChanges.subscribe((payload) => {
                        const next = subscribeEvent.handler(payload, group.getRawValue());
                        if (next !== undefined) {
                            subscriberControl.setValue(next);
                        }
                    })
                ];
            });

            onCleanup(() => {
                valueSub.unsubscribe();
                eventsSub.unsubscribe();
                eventSubs.forEach((sub) => sub.unsubscribe());
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

    isVisible(field: FieldConfig): boolean {
        this.formVersion();
        return !field.visibleWhen || field.visibleWhen(this.form()?.getRawValue() ?? {});
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

    private resolveField(field: FieldConfig): FieldConfig {
        if (field.type !== 'dropdown' || !field.dropdownConfig) {
            return field;
        }
        const { dropdownConfig, ...overrides } = field;
        return this.dropdownConfigService.field(field.key, field.label ?? field.key, dropdownConfig, overrides);
    }
}
