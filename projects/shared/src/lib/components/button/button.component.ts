import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '@nexacore/layout';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'app-button',
    standalone: true,
    imports: [IconComponent],
    templateUrl: './button.component.html',
    styleUrl: './button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
    readonly label = input('');
    /** Icon registry key, e.g. 'plus', 'save' — see @nexacore/layout's ICONS map. */
    readonly icon = input<string | null>(null);
    readonly variant = input<ButtonVariant>('primary');
    readonly size = input<ButtonSize>('md');
    readonly disabled = input(false);
    readonly loading = input(false);

    readonly clicked = output<void>();

    protected readonly classes = computed(
        () => `btn btn-${this.variant()} btn-${this.size()}`
    );

    protected onClick(): void {
        if (!this.disabled() && !this.loading()) {
            this.clicked.emit();
        }
    }
}
