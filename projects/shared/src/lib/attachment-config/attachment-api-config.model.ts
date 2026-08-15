import { ApiEndpoint } from '@nexacore/platform';

/**
 * Declarative source for an attachment's existing-preview fetch — the
 * `DynamicAttachmentComponent` equivalent of `DropdownApiConfig`.
 * `DynamicAttachmentComponent` resolves the preview itself (via
 * `AttachmentConfigService`) from a raw id (e.g. a saved owner/record id),
 * instead of the host page hand-fetching an image URL and threading the
 * result through `attachmentConfig` itself.
 */
export interface AttachmentApiConfig {
    /** Endpoint returning the raw file/image bytes for the existing attachment. */
    apiConfig: ApiEndpoint;
    /** Builds the request body from the raw id passed to `resolvePreview()`/`attachmentId`. */
    requestBody: (id: unknown) => Record<string, unknown>;
    /** Shown above the preview — defaults to a generic title when omitted. */
    title?: string;
}
