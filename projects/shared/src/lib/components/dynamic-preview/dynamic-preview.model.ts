import { TemplateRef } from '@angular/core';
import { PillTone } from '../pill/pill.component';
import { StatusTone } from '../status-badge/status-badge.component';

interface BasePreviewFieldConfig<T> {
    /** A real property of `T` — also what the default `text` type reads. */
    key: string;
    label: string;
    colSpan?: number;
}

export interface TextPreviewFieldConfig<T> extends BasePreviewFieldConfig<T> {
    type?: 'text';
    /** When omitted, renders `String(row[key])`, falling back to '-' for null/undefined/empty. */
    format?: (row: T) => string;
}

export interface StatusPreviewFieldConfig<T> extends BasePreviewFieldConfig<T> {
    type: 'status';
    status: (row: T) => StatusTone;
    /** Overrides the default display text for `status` — matches `StatusBadgeComponent.label`. */
    label2?: (row: T) => string | null;
}

export interface PillPreviewFieldConfig<T> extends BasePreviewFieldConfig<T> {
    type: 'pill';
    pillLabel: (row: T) => string;
    tone?: (row: T) => PillTone;
}

export interface ImagePreviewFieldConfig<T> extends BasePreviewFieldConfig<T> {
    type: 'image';
    /** Optional so a field can be declared with its styling
     * (`shape`/`size`/`fallbackIcon`/etc.) up front while something else
     * resolves the actual URL before render — e.g. `DynamicWizardComponent`
     * always injects this for an `attachment`-typed field's `reviewField`,
     * keyed by that field's own key, so the host never writes `src` itself.
     * Renders just the fallback icon (or nothing) while unset. */
    src?: (row: T) => string | undefined;
    alt?: (row: T) => string;
    fallbackIcon?: string;
    shape?: 'circle' | 'square';
    size?: number;
}

export interface CustomPreviewFieldConfig<T> extends BasePreviewFieldConfig<T> {
    type: 'custom';
    /** Full escape hatch — rendered as-is, same pattern as `DynamicListComponent`'s custom column. */
    cellTemplate: TemplateRef<{ $implicit: T }>;
}

export type PreviewFieldConfig<T> =
    | TextPreviewFieldConfig<T>
    | StatusPreviewFieldConfig<T>
    | PillPreviewFieldConfig<T>
    | ImagePreviewFieldConfig<T>
    | CustomPreviewFieldConfig<T>;

export interface PreviewSectionConfig<T> {
    key: string;
    /** Omit for an untitled "quick facts" block — e.g. a summary row directly under the header. */
    title?: string;
    /** Grid columns for this section's fields — default 2, same convention as `DynamicFormComponent.columns`. */
    columns?: number;
    fields: PreviewFieldConfig<T>[];
}

export interface PreviewAvatarConfig<T> {
    src: (row: T) => string | undefined;
    alt?: (row: T) => string;
    fallbackIcon?: string;
    shape?: 'circle' | 'square';
    /** Default 96 — a hero-sized avatar, bigger than `DynamicList`'s 36px row thumbnail. */
    size?: number;
}
