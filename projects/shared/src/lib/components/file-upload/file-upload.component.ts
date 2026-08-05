import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { IconComponent } from '@nexacore/platform';
import { BaseValueAccessor } from '../base/base-value-accessor';
import { ImagePreviewComponent } from '../image-preview/image-preview.component';

interface StagedFile {
    file: File;
    preview: string;
    progress: number;
}

let nextUid = 0;

@Component({
    selector: 'app-file-upload',
    standalone: true,
    imports: [IconComponent, ImagePreviewComponent],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: FileUploadComponent, multi: true }],
    templateUrl: './file-upload.component.html',
    styleUrl: './file-upload.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent extends BaseValueAccessor<File[]> {
    private readonly http = inject(HttpClient);

    readonly label = input('Upload Files');
    readonly hint = input('Drag & drop files or click to browse');
    readonly accept = input('*/*');
    readonly multiple = input(false);
    readonly maxSizeMB = input(10);
    /** Optional API endpoint — when set, an "Upload All" button appears with per-file progress. */
    readonly uploadUrl = input<string | null>(null);
    readonly showPreview = input(true);
    readonly existingPreviewUrl = input('');
    readonly existingPreviewTitle = input('Current Photo');

    readonly filesSelected = output<File[]>();
    readonly uploadComplete = output<{ file: File; index: number }>();

    protected readonly uid = `fu-${nextUid++}`;
    protected readonly staged = signal<StagedFile[]>([]);
    protected readonly errorMessage = signal('');
    protected readonly isDragging = signal(false);

    protected readonly shouldShowExistingPreview = (): boolean =>
        this.showPreview() && this.staged().length === 0 && !!this.existingPreviewUrl();

    override writeValue(value: File[] | null): void {
        super.writeValue(value);
        this.staged.set((value ?? []).map((file) => ({ file, preview: '', progress: 0 })));
        if (this.showPreview()) {
            this.generatePreviews();
        }
    }

    onFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.handleFiles(target.files ? Array.from(target.files) : []);
        target.value = '';
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging.set(false);
        this.handleFiles(event.dataTransfer ? Array.from(event.dataTransfer.files) : []);
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging.set(true);
    }

    onDragLeave(): void {
        this.isDragging.set(false);
    }

    removeFile(index: number): void {
        const next = this.staged().filter((_, i) => i !== index);
        this.staged.set(next);
        this.emitValue(next.map((s) => s.file));
    }

    uploadAll(): void {
        const url = this.uploadUrl();
        if (!url) {
            this.errorMessage.set('Upload URL is not configured');
            return;
        }

        this.staged().forEach((entry, index) => {
            const formData = new FormData();
            formData.append('file', entry.file);

            this.http
                .post(url, formData, { reportProgress: true, observe: 'events' })
                .pipe(finalize(() => this.uploadComplete.emit({ file: entry.file, index })))
                .subscribe({
                    next: (event) => {
                        if (event.type === HttpEventType.UploadProgress && event.total) {
                            this.updateProgress(index, Math.round((100 * event.loaded) / event.total));
                        }
                    },
                    error: () => this.errorMessage.set(`Failed to upload ${entry.file.name}`)
                });
        });
    }

    private updateProgress(index: number, progress: number): void {
        this.staged.update((entries) =>
            entries.map((e, i) => (i === index ? { ...e, progress } : e))
        );
    }

    private handleFiles(selected: File[]): void {
        this.errorMessage.set('');

        const current = this.staged();
        const accept = this.accept();
        const newFiles: File[] = [];
        for (const file of selected) {
            if (file.size > this.maxSizeMB() * 1024 * 1024) {
                this.errorMessage.set(`${file.name} exceeds ${this.maxSizeMB()}MB`);
                continue;
            }
            if (accept !== '*/*' && !file.type.match(accept.replace(/\*/g, '.*'))) {
                this.errorMessage.set(`Invalid file type: ${file.name}`);
                continue;
            }
            if (current.some((s) => s.file.name === file.name && s.file.size === file.size)) {
                this.errorMessage.set(`Duplicate file skipped: ${file.name}`);
                continue;
            }
            newFiles.push(file);
        }

        const files = this.multiple() ? [...current.map((s) => s.file), ...newFiles] : newFiles.slice(0, 1);
        this.staged.set(files.map((file) => ({ file, preview: '', progress: 0 })));
        this.emitValue(files);
        this.filesSelected.emit(files);

        if (this.showPreview()) {
            this.generatePreviews();
        }
    }

    private generatePreviews(): void {
        this.staged().forEach((entry, index) => {
            if (!entry.file.type.startsWith('image/')) {
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = e.target?.result as string;
                this.staged.update((entries) =>
                    entries.map((s, i) => (i === index ? { ...s, preview } : s))
                );
            };
            reader.readAsDataURL(entry.file);
        });
    }
}
