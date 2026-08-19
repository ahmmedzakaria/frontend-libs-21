import { CardOption } from '../card-selector/card-selector.component';
import { DropdownOption } from '../dropdown/dropdown.component';
import { RadioOption } from '../radio-group/radio-group.component';
import { DynamicDropdownLoader, DynamicDropdownMode } from '../dynamic-dropdown/dynamic-dropdown.model';
import { AttachmentMode, AttachmentPreviewConfig } from '../dynamic-attachment/dynamic-attachment.model';
import { PreviewFieldConfig } from '../dynamic-preview/dynamic-preview.model';
import { DropdownApiConfig } from '../../dropdown-config/dropdown-api-config.model';
import { AttachmentApiConfig } from '../../attachment-config/attachment-api-config.model';

// `CardOption`/`DropdownOption`/`RadioOption`/`DynamicDropdownMode`/`DynamicDropdownLoader`/
// `AttachmentMode`/`AttachmentPreviewConfig` are not re-exported here — they're already
// public via their own component files (also exported from this package's public-api.ts),
// and re-exporting them again from this module would create an ambiguous duplicate export
// in the barrel.

export type TextFieldType = 'text' | 'email' | 'tel' | 'number';

interface BaseFieldConfig {
    /** FormControl name — also the key `initialValue`/`submitted` read/write under. */
    key: string;
    label?: string;
    required?: boolean;
    /** Grid columns this field spans, relative to `DynamicFormComponent`'s `columns` input. */
    colSpan?: number;
    /** Conditionally renders the field from the current form value. Hidden controls remain in the value. */
    visibleWhen?: (value: Record<string, unknown>) => boolean;
    /** Publishes this field's value changes under this event name — pair with
     * another field's `subscribeEvent` of the same name to react to it. The
     * declarative equivalent of a host page subscribing to one field's
     * `valueChanges` and patching another itself (e.g. a "same as current
     * address" checkbox copying one address field into another). */
    publishEvent?: string;
    /** Reacts to another field's `publishEvent` of the same name — see `FieldEventSubscribeConfig`. */
    subscribeEvent?: FieldEventSubscribeConfig;
    /** Excludes this field from an auto-generated Review section — see
     * `DynamicWizardReviewStepConfig.reviewSections`. For a field a review
     * step re-derives differently (e.g. combined with another field into one
     * summary row) or that has no sensible generic preview (e.g. a raw
     * `File[]` attachment value). */
    hideInReview?: boolean;
    /** Overrides how this field renders in an auto-generated Review section —
     * full control over the resulting preview field (e.g. render an
     * `attachment` field's key as an `image` type instead of the default
     * `text`). Ignored when `hideInReview` is set. */
    reviewField?: PreviewFieldConfig<Record<string, unknown>>;
    /** Excludes this field's key from `DynamicWizardComponent.submitFieldKeys`
     * / `submitFieldKeysFrom` and from `buildSubmitFormData` — for a field
     * that's UI-only and never sent to the backend at all (e.g. a "same as"
     * checkbox). Ignored when `submitFields` is set — that already replaces
     * the field's default submission, no need to also exclude it. */
    excludeFromSubmit?: boolean;
    /** Overrides how this field's value is written into a `FormData` request
     * built by `buildSubmitFormData` — return the one or more entries to
     * append instead of the default (this field's own key, its raw value via
     * `String(value)`, skipped when null/undefined). For a nested object
     * that expands into several request fields (e.g. a location object into
     * `*Id`/`*Type`), or a raw `File`/`File[]` value that needs appending
     * directly rather than stringified. Implies `excludeFromSubmit`. */
    submitFields?: (value: unknown, formValue: Record<string, unknown>) => Record<string, string | Blob>;
}

/** Pairs with `BaseFieldConfig.publishEvent` on another field in the same form. */
export interface FieldEventSubscribeConfig {
    /** Event name to react to — matches another field's `publishEvent`. */
    event: string;
    /** Computes this field's next value from the publishing field's new value
     * and the form's current raw value. Return `undefined` to leave this
     * field's own value untouched. */
    handler: (payload: unknown, formValue: Record<string, unknown>) => unknown;
}

export interface TextFieldConfig extends BaseFieldConfig {
    type: TextFieldType;
    placeholder?: string;
    /** Icon registry key, e.g. 'user', 'phone'. */
    icon?: string | null;
    minLength?: number;
    maxLength?: number;
    onlyNumber?: boolean;
    noSpecialChars?: boolean;
    readonly?: boolean;
}

export interface TextareaFieldConfig extends BaseFieldConfig {
    type: 'textarea';
    placeholder?: string;
    rows?: number;
    maxLength?: number;
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
    type: 'checkbox';
    indeterminate?: boolean;
}

export interface RadioFieldConfig extends BaseFieldConfig {
    type: 'radio';
    options: RadioOption<unknown>[];
    layout?: 'row' | 'column';
}

export interface DropdownFieldConfig extends BaseFieldConfig {
    type: 'dropdown';
    /** Either declare `options` directly, or supply `dropdownConfig` and let
     * DynamicFormComponent resolve options/placeholder from a shared
     * `DropdownApiConfig` registry entry via `DropdownConfigService` —
     * the declarative equivalent of calling `DropdownConfigService.field()`
     * yourself. */
    options?: DropdownOption<unknown>[];
    placeholder?: string;
    dropdownConfig?: DropdownApiConfig;
}

export interface DynamicDropdownFieldConfig extends BaseFieldConfig {
    type: 'dynamic-dropdown';
    mode?: DynamicDropdownMode;
    /** Required for `mode: 'static'` (the default). */
    options?: DropdownOption<unknown>[];
    /** Required for `mode: 'api-simple' | 'api-scroll'`. */
    loadOptions?: DynamicDropdownLoader<unknown>;
    placeholder?: string;
    searchable?: boolean;
    /** Defaults to reference equality (`a === b`) — see DynamicDropdownComponent. */
    compareWith?: (a: unknown, b: unknown) => boolean;
    /** Known label for the current value at load time (async modes) — avoids a fetch just to display it. */
    initialOption?: DropdownOption<unknown> | null;
    /** Last-resort label fallback for a value written onto the control from
     * outside the picker (e.g. copied in from another field programmatically). */
    displayWith?: (value: unknown) => string;
    /** See `DropdownFieldConfig.dropdownConfig` — same resolution, for the async modes. */
    dropdownConfig?: DropdownApiConfig;
    /** Raw id to resolve into this field's starting value via `dropdownConfig`'s
     * `lookup` (e.g. a saved foreign-key column on the record being edited) —
     * the declarative equivalent of the host page calling
     * `DropdownConfigService.resolveInitialValue()` itself before the form
     * mounts. Resolved once, internally, by DynamicDropdownComponent; ignored
     * without a `dropdownConfig`. */
    initValue?: unknown;
}

export interface DateFieldConfig extends BaseFieldConfig {
    type: 'date';
    placeholder?: string;
    disablePast?: boolean;
    disableFuture?: boolean;
}

export interface DateRangeFieldConfig extends BaseFieldConfig {
    type: 'date-range';
    monthsToShow?: number;
    disablePast?: boolean;
    disableFuture?: boolean;
}

export interface CardSelectorFieldConfig extends BaseFieldConfig {
    type: 'card-selector';
    options: CardOption<unknown>[];
    columns?: number;
}

/** Either 'file-upload' (rectangular drag/drop, multi-file, upload-progress)
 * or 'profile-photo' (circular single-photo picker) — see
 * `DynamicAttachmentComponent`, the abstraction layer over both, resolved
 * the same way `DynamicDropdownFieldConfig`/`DynamicDropdownComponent` resolve
 * their three dropdown modes. Value is always `File[]`. */
export interface AttachmentFieldConfig extends BaseFieldConfig {
    type: 'attachment';
    mode?: AttachmentMode;
    /** 'file-upload' mode only. */
    hint?: string;
    /** 'file-upload' mode only — multi-select drag/drop. */
    multiple?: boolean;
    accept?: string;
    maxSizeMB?: number;
    /** 'file-upload' mode only — API endpoint enabling an "Upload All" button with per-file progress. */
    uploadUrl?: string | null;
    /** 'file-upload' mode only. */
    showPreview?: boolean;
    /** Explicit preview — always wins over a resolved `attachmentApiConfig` fetch. */
    attachmentConfig?: AttachmentPreviewConfig;
    /** Declarative source for the existing-preview fetch — the attachment
     * equivalent of `DynamicDropdownFieldConfig.dropdownConfig`. */
    attachmentApiConfig?: AttachmentApiConfig;
    /** Raw saved id to resolve into a preview via `attachmentApiConfig` — same
     * role as `DynamicDropdownFieldConfig.initValue`. */
    initValue?: unknown;
    /** Called whenever the current preview URL changes — a freshly-staged
     * (not yet uploaded) pick always wins over an already-uploaded one,
     * `DynamicAttachmentComponent` resolves that precedence itself. Lets the
     * host mirror the result elsewhere (e.g. a read-only review/summary
     * section) without re-deriving the precedence or re-fetching anything.
     * `DynamicAttachmentComponent` still owns the URL's lifecycle — never
     * revoke it from here. */
    previewUrl?: (url: string | null) => void;
}

export interface PasswordFieldConfig extends BaseFieldConfig {
    type: 'password';
    confirmLabel?: string;
    showStrength?: boolean;
}

export type FieldConfig =
    | TextFieldConfig
    | TextareaFieldConfig
    | CheckboxFieldConfig
    | RadioFieldConfig
    | DropdownFieldConfig
    | DynamicDropdownFieldConfig
    | DateFieldConfig
    | DateRangeFieldConfig
    | CardSelectorFieldConfig
    | AttachmentFieldConfig
    | PasswordFieldConfig;
