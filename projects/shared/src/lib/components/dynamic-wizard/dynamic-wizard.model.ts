import { FieldConfig } from '../dynamic-form/dynamic-form.model';
import { PreviewSectionConfig } from '../dynamic-preview/dynamic-preview.model';

interface BaseDynamicWizardStepConfig {
    /** Also used as the `track` key and to identify the step in `stepForms`. */
    key: string;
    label: string;
    disabled?: boolean;
}

export interface DynamicWizardFieldStepConfig extends BaseDynamicWizardStepConfig {
    fields: FieldConfig[];
    initialValue?: Record<string, unknown>;
    /** Forwarded to DynamicFormComponent's `columns` input; defaults to 1 there.
     * Fields using `colSpan` > this value force the grid to add implicit tracks
     * sized by content instead of splitting evenly — set this to match. */
    columns?: number;
}

/**
 * A read-only summary step — no FormGroup of its own (always valid, the same rule
 * WizardStepComponent documents for a step with no `form`). Rendered via the
 * existing DynamicPreviewComponent against the values merged from every prior step.
 */
export interface DynamicWizardReviewStepConfig extends BaseDynamicWizardStepConfig {
    /** Supply for full manual control. Omit to auto-generate one section per
     * preceding field step — see `DynamicWizardComponent.resolvedSteps` — with
     * one `text` preview field per field, in declaration order; a field opts
     * out via `FieldConfig.hideInReview` or supplies its own rendering via
     * `FieldConfig.reviewField`. */
    reviewSections?: PreviewSectionConfig<Record<string, unknown>>[];
    reviewHeading?: string;
    reviewSubheading?: string;
}

export type DynamicWizardStepConfig = DynamicWizardFieldStepConfig | DynamicWizardReviewStepConfig;
