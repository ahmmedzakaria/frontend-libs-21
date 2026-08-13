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
        @if (version()) { <p class="version">Assignment version: <code>{{ version() }}</code></p> }
        @if (summary().additions.length) {
            <section><h3>Will be added</h3><ul>@for (item of summary().additions; track $index) { <li>{{ labelOf()(item) }}</li> }</ul></section>
        }
        @if (summary().removals.length) {
            <section><h3>Will be removed</h3><ul>@for (item of summary().removals; track $index) { <li>{{ labelOf()(item) }}</li> }</ul></section>
        }
    `,
    styles: [`
        dl { display: flex; flex-wrap: wrap; gap: var(--layout-space-2); margin: 0; }
        div { min-width: var(--layout-dropdown-min-width); padding: var(--layout-space-2); border-radius: var(--layout-radius-sm); background: var(--surface-2); }
        dt { color: var(--text-muted); font-size: var(--layout-font-size-sm); }
        dd { margin: var(--layout-space-05) 0 0; font-weight: var(--layout-font-weight-semibold); }
        h3 { margin-block: var(--layout-space-2) var(--layout-space-1); font-size: var(--layout-font-size-sm); }
        ul, .version { margin-block: var(--layout-space-1); }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplacementSummaryComponent<T> {
    readonly summary = input.required<ReplacementSummary<T>>();
    readonly version = input<string | null>(null);
    readonly labelOf = input<(item: T) => string>(item => String(item));
}
