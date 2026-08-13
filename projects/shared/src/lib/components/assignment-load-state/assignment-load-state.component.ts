import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReplacementStatus } from '../../replacement/replacement-selection.state';
import { ButtonComponent } from '../button/button.component';

@Component({
    selector: 'app-assignment-load-state',
    standalone: true,
    imports: [ButtonComponent],
    template: `
        @switch (status()) {
            @case ('idle') { <p>Assignments have not been loaded.</p> }
            @case ('loading') { <p role="status">Loading current assignments…</p> }
            @case ('saving') { <p role="status">Saving assignments…</p> }
            @case ('failed') {
                <div role="alert">
                    <p>{{ error() || 'Current assignments could not be loaded. Saving is disabled.' }}</p>
                    <app-button label="Retry" icon="refresh" variant="ghost" (clicked)="retry.emit()" />
                </div>
            }
        }
    `,
    styles: [`
        :host { display: block; color: var(--text-muted); }
        div { padding: var(--layout-space-3); border-inline-start: var(--layout-border-width-accent) solid var(--red); background: var(--red-soft); }
        p { margin-block: 0 var(--layout-space-2); }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentLoadStateComponent {
    readonly status = input.required<ReplacementStatus>();
    readonly error = input<string | null>(null);
    readonly retry = output<void>();
}
