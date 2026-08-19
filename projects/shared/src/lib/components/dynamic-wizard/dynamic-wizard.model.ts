import { ActionTypes, ApiEndpoint } from '@nexacore/platform';
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

/** Declarative submission — supply to have `DynamicWizardComponent` build the
 * `FormData` (via `buildSubmitFormData`) and perform the request itself once
 * every field step is valid, instead of a host subscribing to `submitted`
 * and doing both by hand. A discriminated union on `actionType` so the
 * matching `*ApiEndpoint` is required and the other two don't need to be
 * supplied — e.g. a create-only wizard only ever builds the `CREATE` variant.
 *
 * `UPDATE`'s `id` is appended to the submitted `FormData` under the key
 * `'id'` — the record being updated is identified by the host (e.g. from a
 * route param), not by anything the user can edit in the form, so it can't
 * be declared as a regular field the way every other submitted value is. */
export type DynamicWizardSubmitConfig =
    | { actionType: ActionTypes.CREATE; createApiEndpoint: ApiEndpoint }
    | { actionType: ActionTypes.UPDATE; updateApiEndpoint: ApiEndpoint; id: string | number }
    | { actionType: ActionTypes.DELETE; deleteApiEndpoint: ApiEndpoint };

/** Labels/visibility for the wizard's action-row buttons — all optional,
 * each falling back to the default noted below. Replaces the old top-level
 * `nextLabel`/`backLabel`/`finishLabel` inputs. */
export interface DynamicWizardButtonConfig {
    /** Finish-button label when `submitConfig.actionType` is `CREATE`. Default `'Create'`. */
    create?: string;
    /** Finish-button label when `submitConfig.actionType` is `UPDATE`. Default `'Update'`. */
    update?: string;
    /** Step-back label. Default `'Previous'`. */
    previous?: string;
    /** Step-forward label. Default `'Next'`. */
    next?: string;
    /** Shows a Back button in the action row (left of Reset) when true — the
     * wizard itself never navigates; the host handles `DynamicWizardComponent.back`
     * (e.g. routing to a list page). Default `false`. */
    showBack?: boolean;
    /** Back-button label. Default `'Back'`. */
    back?: string;
    /** Shows a Reset button that reverts the active step's form to its
     * `initialValue` when true. Default `false`. */
    showReset?: boolean;
    /** Reset-button label. Default `'Reset'`. */
    reset?: string;
}

/** The wizard's own shape, independent of any particular entity — everything
 * a host would otherwise pass as separate `steps`/`submitConfig` inputs. */
export interface DynamicWizardConfig {
    /** Optional heading rendered above the wizard, inside a card shell — e.g.
     * "Edit Person" vs. "Create Person" depending on which mode the host is
     * in. Omit to render the wizard bare, exactly as before (no card, no
     * heading) — a host that already provides its own page heading/card
     * (e.g. `component-demo`, `client-application-editor`) is unaffected. */
    title?: string;
    steps: DynamicWizardStepConfig[];
    /** Supply to have `DynamicWizardComponent` build the `FormData` and
     * perform the request itself once every field step is valid — see
     * `DynamicWizardSubmitConfig`'s doc. Omit to keep doing both yourself
     * from `submitted`. */
    submitConfig?: DynamicWizardSubmitConfig | null;
    /** See `DynamicWizardButtonConfig`. Omit for defaults across the board. */
    buttons?: DynamicWizardButtonConfig;
}

/** Single bundled input for `DynamicWizardComponent` — the entity being
 * created/edited alongside the wizard's own configuration. `entity` is
 * `unknown` (not a generic host DTO type) so a host passes its record
 * directly with no cast at the call site; `DynamicWizardComponent` reads it
 * internally as `Record<string, unknown> | null` — the same shape
 * `resolvedSteps` always needed, just sourced from here instead of a
 * separate `initialRecord` input. */
export interface DynamicWizardData {
    entity?: unknown;
    config: DynamicWizardConfig;
}
