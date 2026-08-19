import { ChangeDetectionStrategy, Component, DestroyRef, WritableSignal, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { FieldConfig } from '../dynamic-form/dynamic-form.model';
import { DynamicPreviewComponent } from '../dynamic-preview/dynamic-preview.component';
import { PreviewFieldConfig, PreviewSectionConfig } from '../dynamic-preview/dynamic-preview.model';
import { WizardComponent } from '../wizard/wizard.component';
import { WizardStepComponent } from '../wizard/wizard-step.component';
import { ActionTypes, ApiEndpoint, ApiService } from '@nexacore/platform';
import {
    DynamicWizardButtonConfig,
    DynamicWizardData,
    DynamicWizardFieldStepConfig,
    DynamicWizardReviewStepConfig,
    DynamicWizardStepConfig
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

    /** Everything the wizard needs from the host: the entity being created/
     * edited, plus the wizard's own configuration (steps + optional submit
     * behavior) — see `DynamicWizardData`'s doc. Replaces separate `steps`/
     * `initialRecord`/`submitConfig` inputs so a host builds one object
     * instead of three independently-bound ones. */
    readonly data = input.required<DynamicWizardData>();

    private readonly steps = computed(() => this.data().config.steps);
    private readonly submitConfig = computed(() => this.data().config.submitConfig ?? null);
    private readonly buttons = computed<DynamicWizardButtonConfig>(() => this.data().config.buttons ?? {});
    /** See `DynamicWizardConfig.title`'s doc — read directly by the template
     * to decide whether to render the card shell + heading at all. */
    protected readonly title = computed(() => this.data().config.title ?? null);

    protected readonly previousLabel = computed(() => this.buttons().previous ?? 'Previous');
    protected readonly nextLabel = computed(() => this.buttons().next ?? 'Next');
    /** `'Create'`/`'Update'` when `submitConfig`'s `actionType` matches — the
     * finish button renames itself to match what it's actually about to do,
     * instead of a host hand-picking "Save" for both. Anything else
     * (`DELETE`, or no `submitConfig` at all) keeps the old literal default. */
    protected readonly finishLabel = computed(() => {
        const config = this.submitConfig();
        const btn = this.buttons();
        if (config?.actionType === ActionTypes.CREATE) {
            return btn.create ?? 'Create';
        }
        if (config?.actionType === ActionTypes.UPDATE) {
            return btn.update ?? 'Update';
        }
        return 'Save';
    });
    protected readonly showBackButton = computed(() => !!this.buttons().showBack);
    protected readonly backButtonLabel = computed(() => this.buttons().back ?? 'Back');
    protected readonly showResetButton = computed(() => !!this.buttons().showReset);
    protected readonly resetButtonLabel = computed(() => this.buttons().reset ?? 'Reset');

    /** The step currently shown by the inner `<app-wizard>` — tracked here
     * (not just re-emitted via `stepIndexChange`) so `onReset` knows which
     * step's form to revert. */
    private readonly currentStepIndex = signal(0);

    /** Emitted when the Back button (see `DynamicWizardButtonConfig.showBack`)
     * is clicked — the wizard never navigates itself; the host decides what
     * "back" means (e.g. routing to a list page). */
    readonly back = output<void>();
    /** `data().entity`, cast to the flat-record shape `resolvedSteps` needs —
     * see `DynamicWizardData.entity`'s doc for why this stays a cast here
     * rather than a generic component type parameter. */
    private readonly initialRecord = computed(() => (this.data().entity ?? null) as Record<string, unknown> | null);

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

    /** One signal per `attachment`-typed field's key, holding its current
     * preview URL (staged-or-uploaded) — see `attachmentUrlSignal`'s doc. */
    private readonly attachmentUrlMap = new Map<string, WritableSignal<string | null>>();

    /** `steps()` with, in order: every `attachment`-typed field wired to the
     * wizard's own preview-URL tracking (see `wireAttachmentField`); each
     * field step's `initialValue` defaulted from `initialRecord` when the
     * step doesn't declare its own (see `initialRecord`'s doc); and each
     * review step's `reviewSections` auto-generated from the preceding field
     * steps when the step doesn't declare its own (see
     * `DynamicWizardReviewStepConfig.reviewSections` and
     * `buildAutoReviewSections`). */
    protected readonly resolvedSteps = computed<DynamicWizardStepConfig[]>(() => {
        const withAttachmentsWired = this.steps().map((step) =>
            'fields' in step ? { ...step, fields: step.fields.map((field) => this.wireAttachmentField(field)) } : step
        );
        const record = this.initialRecord();
        const withInitialValue = record
            ? withAttachmentsWired.map((step) => ('fields' in step && step.initialValue === undefined ? { ...step, initialValue: record } : step))
            : withAttachmentsWired;
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

    /** Returns (creating on first access) the signal tracking `key`'s current
     * attachment preview URL. The wizard-owned equivalent of a host
     * hand-rolling one `signal<string | null>` per attachment field
     * (previously done once per host, e.g. `person-form.component.ts`'s old
     * `currentPhotoPreviewUrl`) — supports any number of attachment fields
     * per wizard, each independently keyed by its own field `key`. */
    private attachmentUrlSignal(key: string): WritableSignal<string | null> {
        let urlSignal = this.attachmentUrlMap.get(key);
        if (!urlSignal) {
            urlSignal = signal<string | null>(null);
            this.attachmentUrlMap.set(key, urlSignal);
        }
        return urlSignal;
    }

    /** For an `attachment`-typed field: chains its `previewUrl` (if any) so
     * the wizard's own tracked signal (see `attachmentUrlSignal`) always
     * updates too, and resolves its `reviewField`'s `image.src` — or builds
     * a bare default `image` reviewField when the field doesn't declare one
     * at all — from that same signal. A host never wires either itself; it
     * only supplies the image's styling (`shape`/`size`/`fallbackIcon`/etc.)
     * if it wants something other than the bare default. Fields of any
     * other type pass through unchanged. */
    private wireAttachmentField(field: FieldConfig): FieldConfig {
        if (field.type !== 'attachment') {
            return field;
        }
        const urlSignal = this.attachmentUrlSignal(field.key);
        const hostPreviewUrl = field.previewUrl;
        const reviewField = field.reviewField;
        let resolvedReviewField: PreviewFieldConfig<Record<string, unknown>>;
        if (!reviewField) {
            resolvedReviewField = { key: field.key, type: 'image', label: field.label ?? field.key, src: () => urlSignal() ?? undefined };
        } else if (reviewField.type === 'image') {
            resolvedReviewField = { ...reviewField, src: () => urlSignal() ?? undefined };
        } else {
            resolvedReviewField = reviewField;
        }
        return {
            ...field,
            previewUrl: (url: string | null) => {
                urlSignal.set(url);
                hostPreviewUrl?.(url);
            },
            reviewField: resolvedReviewField
        };
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

    protected onStepIndexChange(index: number): void {
        this.currentStepIndex.set(index);
        this.stepIndexChange.emit(index);
    }

    /** Reverts the active step's form to its `initialValue` (empty object for
     * a step that doesn't declare one) — a review step has no form of its
     * own, so this is a no-op there. */
    protected onReset(): void {
        const index = this.currentStepIndex();
        const group = this.stepForms()[index];
        const step = this.resolvedSteps()[index];
        if (!group || !step || !('fields' in step)) {
            return;
        }
        group.reset(step.initialValue ?? {});
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
            let apiEndpoint: ApiEndpoint;
            if (config.actionType === ActionTypes.CREATE) {
                apiEndpoint = config.createApiEndpoint;
            } else if (config.actionType === ActionTypes.UPDATE) {
                apiEndpoint = config.updateApiEndpoint;
                formData.append('id', String(config.id));
            } else {
                apiEndpoint = config.deleteApiEndpoint;
            }
            this.api.post<T>(apiEndpoint, formData)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((response) => this.submitSuccess.emit(response));
        }
    }
}
