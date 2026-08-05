import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { IconComponent } from '../../../layout/index';

export type ImagePreviewShape = 'circle' | 'square';

@Component({
    selector: 'app-image-preview',
    standalone: true,
    imports: [IconComponent],
    templateUrl: './image-preview.component.html',
    styleUrl: './image-preview.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImagePreviewComponent {
    readonly src = input('');
    readonly fallbackIcon = input('user');
    readonly alt = input('Preview image');
    readonly title = input('Image Preview');
    readonly subtitle = input('');
    readonly hint = input('Click image to view full size');
    readonly shape = input<ImagePreviewShape>('square');
    readonly width = input<number | null>(null);
    readonly height = input<number | null>(null);
    readonly previewOnClick = input(true);
    readonly disabled = input(false);

    protected readonly imgErrored = signal(false);
    protected readonly viewerOpen = signal(false);

    protected readonly hasImage = computed(() => !!this.src() && !this.imgErrored());
    /** Scale the fallback icon with the thumbnail so it isn't a tiny mark inside a large avatar box. */
    protected readonly iconFallbackSize = computed(() => {
        const box = Math.min(this.width() ?? 48, this.height() ?? 48);
        return Math.round(box * 0.5);
    });

    constructor() {
        // A new `src` (e.g. navigating to a different record) deserves a fresh
        // attempt at loading, not the previous image's stale error state.
        effect(() => {
            this.src();
            this.imgErrored.set(false);
        });
    }

    onImageError(): void {
        this.imgErrored.set(true);
    }

    openViewer(): void {
        if (!this.previewOnClick() || this.disabled() || !this.hasImage()) {
            return;
        }
        this.viewerOpen.set(true);
    }

    closeViewer(): void {
        this.viewerOpen.set(false);
    }

    onViewerKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.closeViewer();
        }
    }
}
