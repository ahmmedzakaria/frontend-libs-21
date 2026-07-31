import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { TextareaComponent } from '../textarea/textarea.component';

export type ApprovalAction = 'approve' | 'reject' | 'escalate';

export interface ApprovalDecision {
    action: ApprovalAction;
    /** Present for reject/escalate (required), absent for approve. */
    reason?: string;
}

/**
 * Approve emits immediately; Reject/Escalate route through a reason-prompt
 * ConfirmDialog first — `decided` only ever fires with a non-empty `reason`
 * for those two, enforced here via an inline required-field error (our
 * TextareaComponent self-validates internally and doesn't accept an external
 * error message, so the reason-required message is rendered directly here).
 */
@Component({
    selector: 'app-approval-actions',
    standalone: true,
    imports: [ButtonComponent, ConfirmDialogComponent, TextareaComponent, ReactiveFormsModule],
    templateUrl: './approval-actions.component.html',
    styleUrl: './approval-actions.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalActionsComponent {
    readonly loading = input(false);
    readonly approveLabel = input('Approve');
    readonly rejectLabel = input('Reject');
    readonly escalateLabel = input('Escalate');
    readonly showEscalate = input(true);

    readonly decided = output<ApprovalDecision>();

    protected readonly pendingAction = signal<ApprovalAction | null>(null);
    protected readonly reason = new FormControl('', { nonNullable: true });
    protected readonly reasonError = signal(false);

    protected readonly dialogTitle = computed(() => (this.pendingAction() === 'reject' ? 'Reject' : 'Escalate'));

    approve(): void {
        this.decided.emit({ action: 'approve' });
    }

    requestReject(): void {
        this.openReasonPrompt('reject');
    }

    requestEscalate(): void {
        this.openReasonPrompt('escalate');
    }

    cancelReason(): void {
        this.pendingAction.set(null);
    }

    confirmReason(): void {
        const action = this.pendingAction();
        const reason = this.reason.value.trim();
        if (!action) {
            return;
        }
        if (!reason) {
            this.reasonError.set(true);
            return;
        }
        this.decided.emit({ action, reason });
        this.pendingAction.set(null);
    }

    private openReasonPrompt(action: ApprovalAction): void {
        this.reason.reset('');
        this.reasonError.set(false);
        this.pendingAction.set(action);
    }
}
