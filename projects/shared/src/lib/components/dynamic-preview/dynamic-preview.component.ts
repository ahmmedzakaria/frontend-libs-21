import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '@nexacore/platform';
import { ImagePreviewComponent } from '../image-preview/image-preview.component';
import { PillComponent } from '../pill/pill.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { PreviewAvatarConfig, PreviewSectionConfig, TextPreviewFieldConfig } from './dynamic-preview.model';

/**
 * Renders a `PreviewSectionConfig<T>[]` into a read-only record view, composing
 * the existing `ImagePreview`/`StatusBadge`/`Pill` components instead of any
 * hand-rolled markup — see `dynamic-preview.model.ts` for the field vocabulary.
 * Purely presentational (no outputs): `ApprovalActions`/`ActivityFeed` stay
 * separate components a consuming page places around this one, since they
 * carry their own actions/outputs that don't belong in a read-only preview.
 */
@Component({
    selector: 'app-dynamic-preview',
    standalone: true,
    imports: [NgTemplateOutlet, ImagePreviewComponent, PillComponent, StatusBadgeComponent, IconComponent],
    templateUrl: './dynamic-preview.component.html',
    styleUrl: './dynamic-preview.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicPreviewComponent<T> {
    readonly sections = input.required<PreviewSectionConfig<T>[]>();
    readonly data = input.required<T>();
    readonly heading = input('');
    readonly subheading = input('');
    readonly avatar = input<PreviewAvatarConfig<T> | null>(null);

    protected textValue(field: TextPreviewFieldConfig<T>, row: T): string {
        if (field.format) {
            return field.format(row);
        }
        const raw = (row as Record<string, unknown>)[field.key];
        return raw === null || raw === undefined || raw === '' ? '-' : String(raw);
    }
}
