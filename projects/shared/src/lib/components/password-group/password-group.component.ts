import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { IconComponent } from '@nexacore/platform';
import { BaseValueAccessor } from '../base/base-value-accessor';

interface PasswordCriteria {
    length: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
}

let nextUid = 0;

/**
 * Deliberately self-contained rather than nesting <app-textbox> internally —
 * bridging three ControlValueAccessor-shaped values (this component's own,
 * plus the confirm field) adds real complexity for very little reuse
 * benefit. It shares Textbox's visual language via the same field-shell
 * mixins instead. Emits the password value once both fields are non-empty
 * and match; the confirm field itself is never part of the emitted value.
 */
@Component({
    selector: 'app-password-group',
    standalone: true,
    imports: [IconComponent],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: PasswordGroupComponent, multi: true },
        { provide: NG_VALIDATORS, useExisting: PasswordGroupComponent, multi: true }
    ],
    templateUrl: './password-group.component.html',
    styleUrl: './password-group.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordGroupComponent extends BaseValueAccessor<string> implements Validator {
    readonly label = input('Password');
    readonly confirmLabel = input('Confirm Password');
    readonly required = input(true);
    readonly showStrength = input(true);

    protected readonly uid = `pg-${nextUid++}`;
    protected readonly passwordVisible = signal(false);
    protected readonly confirmVisible = signal(false);
    protected readonly confirmValue = signal('');
    protected readonly touched = signal(false);
    protected readonly showHints = signal(false);

    protected readonly criteria = computed<PasswordCriteria>(() => {
        const val = this.value() ?? '';
        return {
            length: val.length >= 8,
            upper: /[A-Z]/.test(val),
            lower: /[a-z]/.test(val),
            number: /\d/.test(val),
            special: /[@$!%*?&]/.test(val)
        };
    });

    protected readonly score = computed(
        () => Object.values(this.criteria()).filter(Boolean).length
    );
    protected readonly strengthPercent = computed(() => (this.score() / 5) * 100);
    protected readonly strengthLabel = computed(() => {
        const s = this.score();
        return s <= 2 ? 'Weak' : s <= 4 ? 'Medium' : 'Strong';
    });
    protected readonly missingHints = computed(() => {
        const c = this.criteria();
        const hints: string[] = [];
        if (!c.length) hints.push('Use at least 8 characters');
        if (!c.upper) hints.push('Add an uppercase letter');
        if (!c.lower) hints.push('Add a lowercase letter');
        if (!c.number) hints.push('Add a number');
        if (!c.special) hints.push('Add a special character (@, #, !, etc.)');
        return hints;
    });

    protected readonly mismatch = computed(() => {
        const confirm = this.confirmValue();
        return !!confirm && confirm !== (this.value() ?? '');
    });

    private readonly weak = computed(() => !!this.value() && this.score() < 5);

    validate(): ValidationErrors | null {
        const errors: ValidationErrors = {};
        if (this.required() && !this.value()) {
            errors['required'] = true;
        }
        if (this.value() && this.weak()) {
            errors['passwordWeak'] = true;
        }
        if (this.mismatch()) {
            errors['mismatch'] = true;
        }
        if (this.required() && !this.confirmValue()) {
            errors['confirmRequired'] = true;
        }
        return Object.keys(errors).length ? errors : null;
    }

    onPasswordInput(event: Event): void {
        this.emitValue((event.target as HTMLInputElement).value);
    }

    onConfirmInput(event: Event): void {
        this.confirmValue.set((event.target as HTMLInputElement).value);
    }

    onBlur(): void {
        this.touched.set(true);
        this.markTouched();
    }

    togglePasswordVisibility(): void {
        this.passwordVisible.update((v) => !v);
    }

    toggleConfirmVisibility(): void {
        this.confirmVisible.update((v) => !v);
    }

    toggleHints(show: boolean): void {
        this.showHints.set(show);
    }
}
