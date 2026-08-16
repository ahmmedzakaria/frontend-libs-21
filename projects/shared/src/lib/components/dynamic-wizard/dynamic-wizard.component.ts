import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { DynamicPreviewComponent } from '../dynamic-preview/dynamic-preview.component';
import { WizardComponent } from '../wizard/wizard.component';
import { WizardStepComponent } from '../wizard/wizard-step.component';
import { DynamicWizardReviewStepConfig, DynamicWizardStepConfig } from './dynamic-wizard.model';

/**
 * Config-driven multi-step form: composes the existing `DynamicFormComponent`
 * (one instance per step, each building its own `FormGroup`) and the existing
 * `DynamicPreviewComponent` (for a formless review/summary step) inside the
 * existing `WizardComponent`/`WizardStepComponent` — none of the three are
 * modified.
 *
 * `WizardComponent`'s own `finished` output only checks the *current* (last)
 * step's validity, so `onFinished()` here re-checks every step before
 * emitting `submitted` — closing the gap where a user navigates back,
 * invalidates an earlier step, then returns to a still-valid last step.
 */
@Component({
    selector: 'app-dynamic-wizard',
    standalone: true,
    imports: [WizardComponent, WizardStepComponent, DynamicFormComponent, DynamicPreviewComponent],
    templateUrl: './dynamic-wizard.component.html',
    styleUrl: './dynamic-wizard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicWizardComponent {
    readonly steps = input.required<DynamicWizardStepConfig[]>();
    /** A flat record (e.g. the record being edited) to seed every field step's
     * `initialValue` from — the declarative equivalent of a host page building
     * one signal per field step and setting them all itself (see
     * `resolvedSteps`). A step that already declares its own `initialValue`
     * keeps it; steps whose fields don't match any of this record's keys
     * (e.g. a step built from derived/composite fields) are unaffected. */
    readonly initialRecord = input<Record<string, unknown> | null>(null);
    readonly nextLabel = input('Next');
    readonly backLabel = input('Back');
    readonly finishLabel = input('Save');

    readonly stepIndexChange = output<number>();
    /** The merged, flat value across every fields-driven step — only emitted
     * once every such step is valid. */
    readonly submitted = output<Record<string, unknown>>();

    readonly stepForms = signal<(FormGroup | null)[]>([]);

    /** `steps()` with each field step's `initialValue` defaulted from
     * `initialRecord` when the step doesn't declare its own — see
     * `initialRecord`'s doc. */
    protected readonly resolvedSteps = computed<DynamicWizardStepConfig[]>(() => {
        const record = this.initialRecord();
        if (!record) {
            return this.steps();
        }
        return this.steps().map((step) => ('fields' in step && step.initialValue === undefined ? { ...step, initialValue: record } : step));
    });

    constructor() {
        effect(() => {
            this.stepForms.set(this.steps().map(() => null));
        });
    }

    /** Type guard so the template can narrow before reading `reviewSections` — mirrors DynamicFormComponent.isTextField. */
    protected isReviewStep(step: DynamicWizardStepConfig): step is DynamicWizardReviewStepConfig {
        return 'reviewSections' in step;
    }

    /** Merges every step's live values up to (not including) `index` — feeds a
     * review step's read-only summary from whatever's been entered so far. */
    protected mergedValuesUpTo(index: number): Record<string, unknown> {
        return this.stepForms()
            .slice(0, index)
            .reduce<Record<string, unknown>>((acc, group) => ({ ...acc, ...(group?.getRawValue() ?? {}) }), {});
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
        // A null entry means that step has no form of its own (a review step) —
        // always valid, the same rule WizardStepComponent documents for its own
        // `form` input; only a *present* invalid form should block Finish.
        if (forms.some((group) => group != null && group.invalid)) {
            return;
        }
        const merged = forms.reduce<Record<string, unknown>>(
            (acc, group) => ({ ...acc, ...(group?.getRawValue() ?? {}) }),
            {}
        );
        this.submitted.emit(merged);
    }
}
