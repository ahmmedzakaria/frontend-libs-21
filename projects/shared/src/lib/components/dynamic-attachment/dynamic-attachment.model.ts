export type AttachmentMode = 'file-upload' | 'profile-photo';

/** Shown when an attachment control has no freshly-picked file yet — e.g. an
 * already-uploaded photo/document in an edit form. Separate from the field's
 * own File[] value; see FileUploadComponent/ProfilePhotoUploadComponent. */
export interface AttachmentPreviewConfig {
    url?: string;
    title?: string;
}
