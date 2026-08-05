import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    TemplateRef,
    ViewContainerRef,
    effect,
    inject,
    input,
    output,
    viewChild
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { IconComponent } from '@nexacore/platform';

/**
 * Generic centered modal shell, built directly on CDK Overlay's
 * GlobalPositionStrategy (not `cdkConnectedOverlay`, which anchors to a
 * trigger element and isn't the right tool for a dialog that should sit in
 * the middle of the viewport). Content is projected.
 */
@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [IconComponent],
    templateUrl: './modal.component.html',
    styleUrl: './modal.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
    private readonly overlay = inject(Overlay);
    private readonly viewContainerRef = inject(ViewContainerRef);
    private readonly destroyRef = inject(DestroyRef);
    private overlayRef: OverlayRef | null = null;

    private readonly templateRef = viewChild.required<TemplateRef<unknown>>('tpl');

    readonly open = input.required<boolean>();
    readonly title = input<string>('');
    readonly width = input<number>(480);
    readonly closed = output<void>();

    constructor() {
        effect(() => (this.open() ? this.show() : this.hide()));
        this.destroyRef.onDestroy(() => this.overlayRef?.dispose());
    }

    requestClose(): void {
        this.closed.emit();
    }

    private show(): void {
        if (this.overlayRef) {
            return;
        }
        this.overlayRef = this.overlay.create({
            positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
            hasBackdrop: true,
            backdropClass: 'cdk-overlay-dark-backdrop',
            scrollStrategy: this.overlay.scrollStrategies.block()
        });
        this.overlayRef.backdropClick().subscribe(() => this.requestClose());
        this.overlayRef.keydownEvents().subscribe((e) => {
            if (e.key === 'Escape') {
                this.requestClose();
            }
        });
        this.overlayRef.attach(new TemplatePortal(this.templateRef(), this.viewContainerRef));
    }

    private hide(): void {
        this.overlayRef?.dispose();
        this.overlayRef = null;
    }
}
