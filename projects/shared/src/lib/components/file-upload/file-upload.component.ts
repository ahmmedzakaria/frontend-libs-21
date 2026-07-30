import {
    Component,
    EventEmitter,
    forwardRef,
    Input,
    Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ImagePreviewComponent } from '../image-preview/image-preview.component';

@Component({
    selector: 'app-file-upload',
    standalone: true,
    imports: [CommonModule, ImagePreviewComponent],
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileUploadComponent),
            multi: true,
        },
    ],
})
export class FileUploadComponent implements ControlValueAccessor {
    @Input() label = 'Upload Files';
    @Input() hint = 'Drag & drop files or click to browse';
    @Input() accept = '*/*';
    @Input() multiple = false;
    @Input() maxSizeMB = 10;
    @Input() uploadUrl?: string; // optional API endpoint
    @Input() showPreview = true;
    @Input() existingPreviewUrl = '';
    @Input() existingPreviewTitle = 'Current Photo';

    @Output() filesSelected = new EventEmitter<File[]>();
    @Output() uploadComplete = new EventEmitter<any>();

    files: File[] = [];
    previews: string[] = [];
    progress: number[] = [];
    errorMessage = '';
    isDragging = false;

    onChange: any = () => {};
    onTouched: any = () => {};

    constructor(private http: HttpClient) {}

    // === ControlValueAccessor ===
    writeValue(value: File[] | null): void {
        this.files = value || [];
        this.progress = this.files.map(() => 0);
        if (this.showPreview) {
            this.generatePreviews();
        }
    }
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    // === File Handling ===
    onFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const selected = target.files ? Array.from(target.files) : [];
        this.handleFiles(selected);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
        const dropped = event.dataTransfer ? Array.from(event.dataTransfer.files) : [];
        this.handleFiles(dropped);
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = true;
    }

    onDragLeave(): void {
        this.isDragging = false;
    }

    private handleFiles(selected: File[]): void {
        this.errorMessage = '';

        const newFiles: File[] = [];
        for (const file of selected) {
            if (file.size > this.maxSizeMB * 1024 * 1024) {
                this.errorMessage = `❌ ${file.name} exceeds ${this.maxSizeMB}MB`;
                continue;
            }
            if (this.accept !== '*/*' && !file.type.match(this.accept.replace(/\*/g, '.*'))) {
                this.errorMessage = `❌ Invalid file type: ${file.name}`;
                continue;
            }
            if (this.files.some((f) => f.name === file.name && f.size === file.size)) {
                this.errorMessage = `⚠️ Duplicate file skipped: ${file.name}`;
                continue;
            }
            newFiles.push(file);
        }

        this.files = this.multiple ? [...this.files, ...newFiles] : newFiles.slice(0, 1);
        this.progress = this.files.map(() => 0);
        this.onChange(this.files);
        this.filesSelected.emit(this.files);

        if (this.showPreview) this.generatePreviews();
    }

    private generatePreviews(): void {
        this.previews = [];
        for (const file of this.files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => this.previews.push(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                this.previews.push('');
            }
        }
    }

    // === Upload ===
    uploadAll(): void {
        if (!this.uploadUrl) {
            this.errorMessage = 'Upload URL is not configured';
            return;
        }

        this.files.forEach((file, index) => {
            const formData = new FormData();
            formData.append('file', file);

            this.http.post(this.uploadUrl??'', formData, {
                reportProgress: true,
                observe: 'events',
            })
                .pipe(
                    finalize(() => this.uploadComplete.emit({ file, index }))
                )
                .subscribe({
                    next: (event) => {
                        if (event.type === HttpEventType.UploadProgress && event.total) {
                            this.progress[index] = Math.round((100 * event.loaded) / event.total);
                        }
                    },
                    error: () => (this.errorMessage = `Failed to upload ${file.name}`),
                });
        });
    }

    removeFile(index: number): void {
        this.files.splice(index, 1);
        this.previews.splice(index, 1);
        this.progress.splice(index, 1);
        this.onChange(this.files);
    }

    get shouldShowExistingPreview(): boolean {
        return this.showPreview && this.files.length === 0 && !!this.existingPreviewUrl;
    }
}
