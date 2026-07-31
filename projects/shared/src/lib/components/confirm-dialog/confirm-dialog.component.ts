import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

/**
 * Thin wrapper over ModalComponent for a confirm/cancel prompt. Project
 * custom body content (e.g. a name in bold, or a reason textarea) via the
 * default slot; falls back to plain `message()` text when nothing is projected.
 */
@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [ModalComponent, ButtonComponent],
    templateUrl: './confirm-dialog.component.html',
    styleUrl: './confirm-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
    readonly open = input.required<boolean>();
    readonly title = input<string>('Confirm');
    readonly message = input<string>('');
    readonly confirmLabel = input<string>('Confirm');
    readonly cancelLabel = input<string>('Cancel');
    readonly danger = input(false);
    readonly loading = input(false);

    readonly confirmed = output<void>();
    readonly cancelled = output<void>();

    onCancel(): void {
        this.cancelled.emit();
    }

    onConfirm(): void {
        this.confirmed.emit();
    }
}
