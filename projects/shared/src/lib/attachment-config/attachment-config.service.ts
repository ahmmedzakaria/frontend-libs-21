import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '@nexacore/platform';
import { AttachmentPreviewConfig } from '../components/dynamic-attachment/dynamic-attachment.model';
import { AttachmentApiConfig } from './attachment-api-config.model';

/**
 * Turns a declarative `AttachmentApiConfig` into a resolved
 * `AttachmentPreviewConfig` — centralizes the fetch-existing-preview
 * boilerplate every attachment field previously had to hand-write per page
 * (see `PersonFormComponent.loadPhotoPreview()` for the pattern this
 * replaces). Mirrors `DropdownConfigService`: HTTP lives here, not on the
 * component, since this service is the natural reuse point across every
 * `DynamicAttachmentComponent` instance.
 */
@Injectable({ providedIn: 'root' })
export class AttachmentConfigService {
    private readonly api = inject(ApiService);

    /**
     * Edit-mode support: given a saved raw id (e.g. a foreign-key/owner id on
     * the record being edited), calls the config's endpoint and resolves the
     * response into the preview a `DynamicAttachmentComponent` needs to
     * render the "already uploaded" state. Emits `null` when `id` is empty or
     * the fetch fails (nothing to preview — the field just starts empty,
     * same as before this existed).
     */
    resolvePreview(config: AttachmentApiConfig, id: unknown): Observable<AttachmentPreviewConfig | null> {
        if (id === null || id === undefined || id === '') {
            return of(null);
        }
        return this.api.fetchImageUrl(config.apiConfig, config.requestBody(id)).pipe(
            map((url): AttachmentPreviewConfig => ({ url, title: config.title })),
            catchError(() => of(null))
        );
    }
}
