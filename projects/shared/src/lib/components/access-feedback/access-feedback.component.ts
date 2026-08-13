import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

export type AccessFeedbackKind = 'access-denied' | 'configuration-error' | 'retry-after';

@Component({
    selector: 'app-access-feedback',
    standalone: true,
    imports: [ButtonComponent],
    templateUrl: './access-feedback.component.html',
    styleUrl: './access-feedback.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessFeedbackComponent {
    readonly kind = input.required<AccessFeedbackKind>();
    readonly title = input('');
    readonly message = input('');
    readonly traceId = input<string>();
    readonly retryAfterSeconds = input<number>();
    readonly retryable = input(false);
    readonly retry = output<void>();

    readonly defaultTitle = computed(() => ({
        'access-denied': 'Access denied',
        'configuration-error': 'Configuration unavailable',
        'retry-after': 'Please try again later',
    })[this.kind()]);

    readonly defaultMessage = computed(() => ({
        'access-denied': 'Your current privileges or data scope do not allow this operation.',
        'configuration-error': 'The application authorization configuration could not be loaded.',
        'retry-after': 'The service is temporarily limiting requests.',
    })[this.kind()]);
}
