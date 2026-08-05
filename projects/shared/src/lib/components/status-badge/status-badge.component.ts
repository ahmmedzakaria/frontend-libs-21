import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PillComponent, PillTone } from '../pill/pill.component';

export type StatusTone = 'draft' | 'pending' | 'verified' | 'rejected';

interface StatusPreset {
    tone: PillTone;
    label: string;
}

// Record (not a switch) so adding a StatusTone member without a matching
// preset here is a TypeScript compile error, not a silent runtime fallback.
const STATUS_PRESETS: Record<StatusTone, StatusPreset> = {
    draft: { tone: 'neutral', label: 'Draft' },
    pending: { tone: 'amber', label: 'Pending' },
    verified: { tone: 'success', label: 'Verified' },
    rejected: { tone: 'red', label: 'Rejected' }
};

@Component({
    selector: 'app-status-badge',
    standalone: true,
    imports: [PillComponent],
    template: `<app-pill [label]="label() ?? preset().label" [tone]="preset().tone" />`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
    readonly status = input.required<StatusTone>();
    /** Overrides the default display text for `status`. */
    readonly label = input<string | null>(null);

    protected readonly preset = computed(() => STATUS_PRESETS[this.status()]);
}
