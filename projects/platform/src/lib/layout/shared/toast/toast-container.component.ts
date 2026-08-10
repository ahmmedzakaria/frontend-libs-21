import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationLevel, NotificationService } from '../../../api-common/notification.service';
import { IconComponent } from '../icon/icon.component';

const LEVEL_ICON: Record<NotificationLevel, string> = {
  success: 'check',
  error: 'times',
  info: 'circle-info'
};

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss'
})
export class ToastContainerComponent {
  protected readonly notifications = inject(NotificationService);

  protected icon(level: NotificationLevel): string {
    return LEVEL_ICON[level];
  }
}
