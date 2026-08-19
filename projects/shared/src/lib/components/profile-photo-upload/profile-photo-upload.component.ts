import { ChangeDetectionStrategy, Component, OnDestroy, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '@nexacore/platform';
import { BaseValueAccessor } from '../base/base-value-accessor';
import { ImagePreviewComponent } from '../image-preview/image-preview.component';

/**
 * Circular single-photo upload for a person's profile picture, distinct from
 * `FileUploadComponent` (rectangular drag/drop, multi-file, upload-progress). Value
 * stays `File[]` — same CVA contract as `FileUploadComponent` — so it plugs into the
 * same multipart-FormData submit flow; only the presentation is different.
 */
@Component({
    selector: 'app-profile-photo-upload',
    standalone: true,
    imports: [IconComponent, ImagePreviewComponent],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: ProfilePhotoUploadComponent, multi: true }],
    templateUrl: './profile-photo-upload.component.html',
    styleUrl: './profile-photo-upload.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePhotoUploadComponent extends BaseValueAccessor<File[]> implements OnDestroy {
    /** Section heading above the picker — every other field type uses `label` this way too. */
    readonly label = input('Profile Photo');
    readonly accept = input('image/*');
    readonly maxSizeMB = input(5);
    readonly existingPreviewUrl = input('');
    readonly existingPreviewTitle = input('Current Photo');

    protected readonly errorMessage = signal('');
    protected readonly stagedPreview = signal<string | null>(null);

    protected readonly hasStagedFile = () => !!this.value()?.length;
    protected readonly previewSrc = () => this.stagedPreview() ?? this.existingPreviewUrl();

    override writeValue(value: File[] | null): void {
        super.writeValue(value);
        this.revokeStagedPreview();
        const file = value?.[0];
        this.stagedPreview.set(file ? URL.createObjectURL(file) : null);
    }

    onFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0] ?? null;
        target.value = '';
        this.errorMessage.set('');

        if (!file) {
            return;
        }
        if (file.size > this.maxSizeMB() * 1024 * 1024) {
            this.errorMessage.set(`${file.name} exceeds ${this.maxSizeMB()}MB`);
            return;
        }

        this.revokeStagedPreview();
        this.stagedPreview.set(URL.createObjectURL(file));
        this.emitValue([file]);
        this.markTouched();
    }

    remove(): void {
        this.revokeStagedPreview();
        this.stagedPreview.set(null);
        this.emitValue([]);
        this.markTouched();
    }

    ngOnDestroy(): void {
        this.revokeStagedPreview();
    }

    private revokeStagedPreview(): void {
        const url = this.stagedPreview();
        if (url) {
            URL.revokeObjectURL(url);
        }
    }
}
