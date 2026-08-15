import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, TouchedChangeEvent, ValidationErrors, Validator } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseValueAccessor } from '../base/base-value-accessor';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { ProfilePhotoUploadComponent } from '../profile-photo-upload/profile-photo-upload.component';
import { AttachmentMode, AttachmentPreviewConfig } from './dynamic-attachment.model';

/**
 * Facade over the two attachment-type controls (`app-file-upload` /
 * `app-profile-photo-upload`) — same abstraction-layer role
 * `SmartDropdownComponent` plays for its three dropdown modes. This is the
 * only piece that implements `ControlValueAccessor`/`Validator`; it owns
 * forms integration and simply renders whichever concrete component matches
 * `mode()`, forwarding value changes and touched state back through itself.
 *
 * Unlike the dropdown family, `FileUploadComponent`/`ProfilePhotoUploadComponent`
 * are themselves full `ControlValueAccessor`s already, with real direct
 * consumers elsewhere (e.g. `component-demo`'s own `formControlName="photo"`
 * usage of `<app-file-upload>`) — left untouched so that contract keeps
 * working. This facade bridges to them via an internal `FormControl` bound
 * with `[formControl]`, syncing its own `value`/`disabled` state onto it and
 * relaying `TouchedChangeEvent`s back up through `markTouched()`.
 */
@Component({
    selector: 'app-dynamic-attachment',
    standalone: true,
    imports: [ReactiveFormsModule, FileUploadComponent, ProfilePhotoUploadComponent],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: DynamicAttachmentComponent, multi: true },
        { provide: NG_VALIDATORS, useExisting: DynamicAttachmentComponent, multi: true }
    ],
    templateUrl: './dynamic-attachment.component.html',
    styleUrl: './dynamic-attachment.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicAttachmentComponent extends BaseValueAccessor<File[]> implements Validator {
    readonly mode = input<AttachmentMode>('file-upload');
    /** `null` defers to a mode-specific default — see `resolvedLabel`. */
    readonly label = input<string | null>(null);
    /** 'file-upload' mode only. */
    readonly hint = input('Drag & drop files or click to browse');
    /** `null` defers to a mode-specific default — see `resolvedAccept`. */
    readonly accept = input<string | null>(null);
    /** 'file-upload' mode only — multi-select drag/drop. */
    readonly multiple = input(false);
    /** `null` defers to a mode-specific default — see `resolvedMaxSizeMB`. */
    readonly maxSizeMB = input<number | null>(null);
    /** 'file-upload' mode only — API endpoint enabling an "Upload All" button with per-file progress. */
    readonly uploadUrl = input<string | null>(null);
    /** 'file-upload' mode only. */
    readonly showPreview = input(true);
    readonly attachmentConfig = input<AttachmentPreviewConfig | null>(null);
    readonly required = input(false);

    /** 'file-upload' mode only — pass-through from the underlying FileUploadComponent. */
    readonly filesSelected = output<File[]>();
    readonly uploadComplete = output<{ file: File; index: number }>();

    protected readonly resolvedLabel = computed(() => this.label() ?? (this.mode() === 'profile-photo' ? 'Profile Photo' : 'Upload Files'));
    protected readonly resolvedAccept = computed(() => this.accept() ?? (this.mode() === 'profile-photo' ? 'image/*' : '*/*'));
    protected readonly resolvedMaxSizeMB = computed(() => this.maxSizeMB() ?? (this.mode() === 'profile-photo' ? 5 : 10));

    /** Bridges this facade's CVA value/disabled state onto the concrete
     * control via `[formControl]`, since the concrete components are
     * themselves CVAs (unlike the dropdown family's mode components) —
     * nesting an outer CVA directly onto an inner one needs a real
     * `AbstractControl` in between. */
    protected readonly innerControl = new FormControl<File[]>([], { nonNullable: true });

    constructor() {
        super();

        effect(() => {
            const value = this.value() ?? [];
            if (this.innerControl.value !== value) {
                this.innerControl.setValue(value, { emitEvent: false });
            }
        });
        effect(() => {
            if (this.disabled()) {
                this.innerControl.disable({ emitEvent: false });
            } else {
                this.innerControl.enable({ emitEvent: false });
            }
        });

        this.innerControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.emitValue(value));
        this.innerControl.events.pipe(takeUntilDestroyed()).subscribe((event) => {
            if (event instanceof TouchedChangeEvent && event.touched) {
                this.markTouched();
            }
        });
    }

    validate(): ValidationErrors | null {
        return this.required() && !this.value()?.length ? { required: true } : null;
    }
}
