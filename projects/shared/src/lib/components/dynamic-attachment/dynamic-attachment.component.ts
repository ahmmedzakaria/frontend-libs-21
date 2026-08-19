import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, TouchedChangeEvent, ValidationErrors, Validator } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '@nexacore/platform';
import { BaseValueAccessor } from '../base/base-value-accessor';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { ProfilePhotoUploadComponent } from '../profile-photo-upload/profile-photo-upload.component';
import { AttachmentApiConfig } from '../../attachment-config/attachment-api-config.model';
import { AttachmentMode, AttachmentPreviewConfig } from './dynamic-attachment.model';

/**
 * Facade over the two attachment-type controls (`app-file-upload` /
 * `app-profile-photo-upload`) — same abstraction-layer role
 * `DynamicDropdownComponent` plays for its three dropdown modes. This is the
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
 *
 * Configuration-specific abstraction, same as `DynamicDropdownComponent`'s
 * `dropdownConfig`: pass `attachmentApiConfig` + `initValue` (a raw saved id)
 * instead of hand-fetching the existing preview yourself — this component
 * resolves it itself (`resolvePreview()` below, calling `ApiService`
 * directly), the declarative equivalent of a host page hand-fetching the
 * preview before the form mounts. An explicit `attachmentConfig` input
 * always wins over the resolved preview.
 *
 * Owns both preview object URLs' full lifecycle (create + revoke) *and* the
 * precedence between them — a freshly-staged (not yet uploaded) pick always
 * wins over an already-uploaded one — and mirrors the single resulting value
 * out via `previewUrlChange`. A host page that needs the same image
 * elsewhere (e.g. a read-only review/summary section) should bind that
 * output instead of re-deriving the precedence or re-fetching the image
 * itself, and must never revoke a URL it received this way (this component
 * still owns it).
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
export class DynamicAttachmentComponent extends BaseValueAccessor<File[]> implements Validator, OnDestroy {
    private readonly api = inject(ApiService);

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
    /** Explicit preview — always wins over a resolved `attachmentApiConfig` fetch. */
    readonly attachmentConfig = input<AttachmentPreviewConfig | null>(null);
    /** Declarative source for the existing-preview fetch — see the class doc. */
    readonly attachmentApiConfig = input<AttachmentApiConfig | null>(null);
    /** Raw saved id to resolve into a preview via `attachmentApiConfig` — see
     * the class doc. Named to match `DynamicDropdownComponent.initValue`. */
    readonly initValue = input<unknown>(null);
    readonly required = input(false);

    /** 'file-upload' mode only — pass-through from the underlying FileUploadComponent. */
    readonly filesSelected = output<File[]>();
    readonly uploadComplete = output<{ file: File; index: number }>();
    /** The single "what should currently be shown as the preview" URL,
     * whenever it changes — a freshly-staged pick if there is one, else the
     * "already uploaded" preview (explicit `attachmentConfig` or a resolved
     * `attachmentApiConfig` fetch), else `null`. This component owns the
     * URL's lifecycle; see the class doc. */
    readonly previewUrlChange = output<string | null>();

    protected readonly resolvedLabel = computed(() => this.label() ?? (this.mode() === 'profile-photo' ? 'Profile Photo' : 'Upload Files'));
    protected readonly resolvedAccept = computed(() => this.accept() ?? (this.mode() === 'profile-photo' ? 'image/*' : '*/*'));
    protected readonly resolvedMaxSizeMB = computed(() => this.maxSizeMB() ?? (this.mode() === 'profile-photo' ? 5 : 10));

    private readonly fetchedPreview = signal<AttachmentPreviewConfig | null>(null);
    protected readonly resolvedAttachmentConfig = computed(() => this.attachmentConfig() ?? this.fetchedPreview());

    /** The freshly-picked file's local object URL — created/revoked here as
     * `value()` changes. */
    private readonly stagedPreviewUrl = signal<string | null>(null);
    /** A staged pick always wins over the "already uploaded" preview — the
     * combined value mirrored out via `previewUrlChange`. */
    protected readonly currentPreviewUrl = computed(() => this.stagedPreviewUrl() ?? this.resolvedAttachmentConfig()?.url ?? null);

    /** Guards `attachmentApiConfig` resolution to at most once per instance —
     * `attachmentApiConfig`/`attachmentId` are commonly fresh object
     * references on every parent recompute (see DynamicDropdownComponent's
     * `initialValueResolved` for the same rationale), so gating on "already
     * attempted" avoids re-fetching. */
    private readonly previewFetchAttempted = signal(false);

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

        effect(() => {
            const config = this.attachmentApiConfig();
            const id = this.initValue();
            if (!config || id === null || id === undefined || id === '' || this.previewFetchAttempted()) {
                return;
            }
            this.previewFetchAttempted.set(true);
            this.resolvePreview(config, id).subscribe((preview) => {
                if (preview) {
                    this.fetchedPreview.set(preview);
                }
            });
        });

        // Tracks a freshly-picked (not yet uploaded) file's local object URL —
        // created/revoked here as `value()` changes.
        effect(() => {
            const file = this.value()?.[0] ?? null;
            // `untracked` here is load-bearing, not a style choice: `URL.createObjectURL`
            // returns a distinct string on every call even for the same File, so if this
            // read of `stagedPreviewUrl` were tracked, the `.set()` below would re-trigger
            // this same effect on every run — an infinite loop that hangs the tab (this is
            // exactly the freeze the attachment/photo-upload field was hitting).
            const previous = untracked(this.stagedPreviewUrl);
            if (previous) {
                URL.revokeObjectURL(previous);
            }
            this.stagedPreviewUrl.set(file ? URL.createObjectURL(file) : null);
        });

        // Mirrors the combined preview URL out to the host (see the class doc)
        // whenever it changes — a staged pick, the resolved "already uploaded"
        // preview, or null.
        effect(() => {
            this.previewUrlChange.emit(this.currentPreviewUrl());
        });
    }

    validate(): ValidationErrors | null {
        return this.required() && !this.value()?.length ? { required: true } : null;
    }

    ngOnDestroy(): void {
        const staged = this.stagedPreviewUrl();
        if (staged) {
            URL.revokeObjectURL(staged);
        }
        const fetched = this.fetchedPreview()?.url;
        if (fetched) {
            URL.revokeObjectURL(fetched);
        }
    }

    /**
     * Edit-mode support: given a saved raw id (e.g. an owner/record id),
     * calls the config's endpoint and resolves the response into the preview
     * this component needs to render the "already uploaded" state. Lives
     * here (not a shared service) since this component is the sole consumer
     * — mirrors `DynamicDropdownComponent.buildLoader()`. Emits `null` when
     * `id` is empty or the fetch fails (nothing to preview — the field just
     * starts empty).
     */
    private resolvePreview(config: AttachmentApiConfig, id: unknown): Observable<AttachmentPreviewConfig | null> {
        if (id === null || id === undefined || id === '') {
            return of(null);
        }
        return this.api.fetchImageUrl(config.apiConfig, config.requestBody(id)).pipe(
            map((url): AttachmentPreviewConfig => ({ url, title: config.title })),
            catchError(() => of(null))
        );
    }
}
