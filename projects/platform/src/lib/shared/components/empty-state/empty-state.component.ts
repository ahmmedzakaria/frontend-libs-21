import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../../layout/index';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [IconComponent],
    templateUrl: './empty-state.component.html',
    styleUrl: './empty-state.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
    readonly icon = input<string>('folder');
    readonly title = input<string>('');
    readonly message = input<string>('');
}
