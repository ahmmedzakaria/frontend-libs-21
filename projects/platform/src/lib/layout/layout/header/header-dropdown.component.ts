import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { HeaderMenuId, HeaderMenuService } from '../../core/services/header-menu.service';

/**
 * Wraps a trigger + panel pair and handles open/close, positioning, and
 * click-outside dismissal via the CDK Overlay — this is the direct
 * replacement for the hand-rolled `toggleDD()` / `document.addEventListener('click', ...)`
 * logic in the original HTML POC.
 */
@Component({
  selector: 'app-header-dropdown',
  standalone: true,
  imports: [OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hdr-item" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <ng-content select="[trigger]"></ng-content>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="origin"
        [cdkConnectedOverlayOpen]="menu.isOpen(id())"
        [cdkConnectedOverlayHasBackdrop]="true"
        cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
        [cdkConnectedOverlayPositions]="[
          { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 }
        ]"
        (backdropClick)="menu.close()"
        (detach)="menu.close()"
      >
        <div class="hdr-dropdown open">
          <ng-content select="[panel]"></ng-content>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      :host {
        position: relative;
      }
    `
  ]
})
export class HeaderDropdownComponent {
  protected readonly menu = inject(HeaderMenuService);
  readonly id = input.required<HeaderMenuId>();
}
