import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-image-preview',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './image-preview.component.html',
})
export class ImagePreviewComponent {
    @Input() src = '';
    @Input() fallbackSrc = 'assets/default-avatar.svg';
    @Input() alt = 'Preview image';
    @Input() title = 'Image Preview';
    @Input() subtitle = '';
    @Input() hint = 'Click image to view full size';
    @Input() thumbnailClass = '';
    @Input() imageClass = '';
    @Input() width: number | null = null;
    @Input() height: number | null = null;
    @Input() previewOnClick = true;
    @Input() disabled = false;

    currentSrc = this.fallbackSrc;
    isViewerOpen = false;

    ngOnChanges(): void {
        this.currentSrc = this.src || this.fallbackSrc;
    }

    onImageError(event?: Event): void {
        this.currentSrc = this.fallbackSrc;
        if (event) {
            (event.target as HTMLImageElement).src = this.fallbackSrc;
        }
    }

    openViewer(): void {
        if (!this.previewOnClick || this.disabled || this.currentSrc === this.fallbackSrc) {
            return;
        }
        this.isViewerOpen = true;
    }

    closeViewer(): void {
        this.isViewerOpen = false;
    }
}
