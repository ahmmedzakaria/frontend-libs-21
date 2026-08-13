import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReplacementSummary } from '../../replacement/replacement-selection.state';

@Component({
    selector: 'app-replacement-summary',
    standalone: true,
    template: `
        <dl>
            <div><dt>Additions</dt><dd>{{ summary().additions.length }}</dd></div>
            <div><dt>Removals</dt><dd>{{ summary().removals.length }}</dd></div>
            <div><dt>Unchanged</dt><dd>{{ summary().unchanged.length }}</dd></div>
        </dl>
    `,
    styles: [`
        dl { display: flex; flex-wrap: wrap; gap: var(--layout-space-2); margin: 0; }
        div { min-width: var(--layout-dropdown-min-width); padding: var(--layout-space-2); border-radius: var(--layout-radius-sm); background: var(--surface-2); }
        dt { color: var(--text-muted); font-size: var(--layout-font-size-sm); }
        dd { margin: var(--layout-space-05) 0 0; font-weight: var(--layout-font-weight-semibold); }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplacementSummaryComponent<T> {
    readonly summary = input.required<ReplacementSummary<T>>();
}
