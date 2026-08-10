import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { FieldConfig } from '../dynamic-form/dynamic-form.model';
import { ModalComponent } from '../modal/modal.component';

/**
 * Composes the existing ModalComponent (CDK Overlay shell) with
 * DynamicFormComponent and the standard Cancel/Save button row — the
 * "modal wrapping one form" shape repeated across every admin page's
 * create/edit dialogs. Only genericizes what real instances actually vary
 * (columns, width, save label/icon); a modal with no form (e.g. a one-time
 * credential display) or a destructive-action confirm dialog isn't this
 * component's job — see ConfirmDialogComponent for that.
 */
@Component({
    selector: 'app-dynamic-modal',
    standalone: true,
    imports: [ModalComponent, DynamicFormComponent, ButtonComponent],
    templateUrl: './dynamic-modal.component.html',
    styleUrl: './dynamic-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicModalComponent {
    readonly open = input.required<boolean>();
    readonly title = input('');
    readonly width = input(480);
    readonly fields = input.required<FieldConfig[]>();
    readonly initialValue = input<Record<string, unknown>>({});
    readonly columns = input(2);
    readonly cancelLabel = input('Cancel');
    readonly saveLabel = input('Save');
    readonly saveIcon = input<string | null>('save');

    /** A request to close — same "not a confirmation" contract as ModalComponent.closed. */
    readonly closed = output<void>();
    readonly submitted = output<Record<string, unknown>>();
}
