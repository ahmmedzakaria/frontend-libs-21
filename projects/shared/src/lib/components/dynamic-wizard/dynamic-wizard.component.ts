import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { WizardComponent } from '../wizard/wizard.component';
import { WizardStepComponent } from '../wizard/wizard-step.component';
import { DynamicWizardStepConfig } from './dynamic-wizard.model';

/**
 * Config-driven multi-step form: composes the existing `DynamicFormComponent`
 * (one instance per step, each building its own `FormGroup`) inside the
 * existing `WizardComponent`/`WizardStepComponent` — neither is modified.
 *
 * `WizardComponent`'s own `finished` output only checks the *current* (last)
 * step's validity, so `onFinished()` here re-checks every step before
 * emitting `submitted` — closing the gap where a user navigates back,
 * invalidates an earlier step, then returns to a still-valid last step.
 */
@Component({
    selector: 'app-dynamic-wizard',
    standalone: true,
    imports: [WizardComponent, WizardStepComponent, DynamicFormComponent],
    templateUrl: './dynamic-wizard.component.html',
    styleUrl: './dynamic-wizard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicWizardComponent {
    readonly steps = input.required<DynamicWizardStepConfig[]>();
    readonly nextLabel = input('Next');
    readonly backLabel = input('Back');
    readonly finishLabel = input('Save');

    readonly stepIndexChange = output<number>();
    /** The merged, flat value across every step — only emitted once every
     * step's own form is valid. */
    readonly submitted = output<Record<string, unknown>>();

    readonly stepForms = signal<(FormGroup | null)[]>([]);

    constructor() {
        effect(() => {
            this.stepForms.set(this.steps().map(() => null));
        });
    }

    protected setStepForm(index: number, group: FormGroup): void {
        this.stepForms.update((forms) => {
            const next = [...forms];
            next[index] = group;
            return next;
        });
    }

    protected onFinished(): void {
        const forms = this.stepForms();
        forms.forEach((group) => group?.markAllAsTouched());
        if (forms.some((group) => !group || group.invalid)) {
            return;
        }
        const merged = forms.reduce<Record<string, unknown>>(
            (acc, group) => ({ ...acc, ...(group?.getRawValue() ?? {}) }),
            {}
        );
        this.submitted.emit(merged);
    }
}
