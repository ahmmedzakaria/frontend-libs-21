import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { DynamicPreviewComponent } from '../dynamic-preview/dynamic-preview.component';
import { PreviewFieldConfig, PreviewSectionConfig } from '../dynamic-preview/dynamic-preview.model';
import { WizardComponent } from '../wizard/wizard.component';
import { WizardStepComponent } from '../wizard/wizard-step.component';
import { ActionTypes, ApiEndpoint, ApiService } from '@nexacore/platform';
import {
    DynamicWizardFieldStepConfig,
    DynamicWizardReviewStepConfig,
    DynamicWizardStepConfig,
    DynamicWizardSubmitConfig
} from './dynamic-wizard.model';

/** Every field-step key across `steps` that submits under its own name — i.e.
 * minus any field marked `excludeFromSubmit` or carrying its own
 * `submitFields` override (which replaces default per-key submission with
 * its own key(s), so the field's own name never appears here). A declarative
 * default-forwarding allowlist for a host building e.g. a multipart
 * `FormData` request from the wizard's merged `submitted` value, so a field
 * can only be included by actually existing on the form (no risk of a stale
 * or hand-added authorization-sensitive key lingering in a separately
 * maintained list). Exported standalone (also used as
 * `DynamicWizardComponent.submitFieldKeys`) so a host can derive it from its
 * own step config without needing a live component instance. */
export function submitFieldKeysFrom(steps: DynamicWizardStepConfig[]): string[] {
    return steps.flatMap((step) =>
        'fields' in step ? step.fields.filter((field) => !field.excludeFromSubmit && !field.submitFields).map((field) => field.key) : []
    );
}

/** Builds a `FormData` request from `steps`' field keys and `formValue` (the
 * wizard's merged `submitted` value) — the declarative equivalent of a host
 * hand-writing a `formData.append(...)` call per field. Per field, in order:
 * skipped entirely if `excludeFromSubmit`; if `submitFields` is set, calls it
 * with the field's own value and the full `formValue`, appending each
 * returned entry (a `Blob`/`File` appends directly, everything else is
 * already a string); otherwise appends the field's own key/value via
 * `String(value)`, skipped when the value is null/undefined. */
export function buildSubmitFormData(steps: DynamicWizardStepConfig[], formValue: Record<string, unknown>): FormData {
    const formData = new FormData();
    steps.forEach((step) => {
        if (!('fields' in step)) {
            return;
        }
        step.fields.forEach((field) => {
            const value = formValue[field.key];
            if (field.submitFields) {
                Object.entries(field.submitFields(value, formValue)).forEach(([key, entry]) => formData.append(key, entry));
                return;
            }
            if (field.excludeFromSubmit) {
                return;
            }
            if (value !== null && value !== undefined) {
                formData.append(field.key, String(value));
            }
        });
    });
    return formData;
}

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
export class DynamicWizardComponent<T> {
    private readonly destroyRef = inject(DestroyRef);

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
    /** Supply to have this component build the `FormData` (via
     * `buildSubmitFormData`) and perform the request itself once every field
     * step is valid — see `DynamicWizardSubmitConfig`'s doc. Omit to keep
     * doing both yourself from `submitted`. */
    readonly submitConfig = input<DynamicWizardSubmitConfig | null>(null);

    readonly stepIndexChange = output<number>();
    /** The merged, flat value across every fields-driven step — only emitted
     * once every such step is valid. */
    readonly submitted = output<Record<string, unknown>>();
    /** Emits whatever the `POST` to `submitConfig()`'s matching `*ApiEndpoint`
     * resolves to, once it resolves — only fires when `submitConfig` is set. */
    readonly submitSuccess = output<unknown>();

    readonly stepForms = signal<(FormGroup | null)[]>([]);

    /** See `submitFieldKeysFrom` — the same computation, kept in sync with
     * `steps()` reactively. */
    readonly submitFieldKeys = computed<string[]>(() => submitFieldKeysFrom(this.steps()));

    /** `steps()` with each field step's `initialValue` defaulted from
     * `initialRecord` when the step doesn't declare its own (see
     * `initialRecord`'s doc), and each review step's `reviewSections`
     * auto-generated from the preceding field steps when the step doesn't
     * declare its own (see `DynamicWizardReviewStepConfig.reviewSections`
     * and `buildAutoReviewSections`). */
    protected readonly resolvedSteps = computed<DynamicWizardStepConfig[]>(() => {
        const record = this.initialRecord();
        const withInitialValue = record
            ? this.steps().map((step) => ('fields' in step && step.initialValue === undefined ? { ...step, initialValue: record } : step))
            : this.steps();
        return withInitialValue.map((step, index) => {
            if (!this.isReviewStep(step) || step.reviewSections) {
                return step;
            }
            const precedingFieldSteps = withInitialValue.slice(0, index).filter((s): s is DynamicWizardFieldStepConfig => 'fields' in s);
            return { ...step, reviewSections: this.buildAutoReviewSections(precedingFieldSteps) };
        });
    });

    constructor(private readonly api: ApiService) {
        effect(() => {
            this.stepForms.set(this.steps().map(() => null));
        });
    }

    /** Type guard so the template can narrow before reading `reviewSections` —
     * a review step is identified by the *absence* of `fields` (required on
     * every field step) rather than the presence of `reviewSections`, since
     * the latter is now optional (auto-generated when omitted). */
    protected isReviewStep(step: DynamicWizardStepConfig): step is DynamicWizardReviewStepConfig {
        return !('fields' in step);
    }

    /** One `PreviewSectionConfig` per field step, titled from the step's
     * `label` — each field becomes a `text` preview field (`key`/`label`) in
     * declaration order, unless it sets `hideInReview` (dropped) or
     * `reviewField` (used verbatim instead). */
    private buildAutoReviewSections(fieldSteps: DynamicWizardFieldStepConfig[]): PreviewSectionConfig<Record<string, unknown>>[] {
        return fieldSteps.map((step) => ({
            key: step.key,
            title: step.label,
            columns: step.columns,
            fields: step.fields
                .filter((field) => !field.hideInReview)
                .map((field): PreviewFieldConfig<Record<string, unknown>> => field.reviewField ?? { key: field.key, label: field.label ?? field.key })
        }));
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

        const config = this.submitConfig();
        if (config) {
            const formData = buildSubmitFormData(this.resolvedSteps(), merged);
            const apiEndpoint: ApiEndpoint = config.actionType === ActionTypes.CREATE ? config.createApiEndpoint
                : config.actionType === ActionTypes.UPDATE ? config.updateApiEndpoint
                : config.deleteApiEndpoint;
            this.api.post<T>(apiEndpoint, formData)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((response) => this.submitSuccess.emit(response));
        }
    }
}
