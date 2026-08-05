import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ActivityEntry {
    label: string;
    timestamp: Date | string;
    actor: string;
}

@Component({
    selector: 'app-activity-feed',
    standalone: true,
    templateUrl: './activity-feed.component.html',
    styleUrl: './activity-feed.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityFeedComponent {
    readonly entries = input.required<ActivityEntry[]>();

    formatTimestamp(value: Date | string): string {
        const date = typeof value === 'string' ? new Date(value) : value;
        return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    }

    initials(actor: string): string {
        return actor
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? '')
            .join('');
    }
}
