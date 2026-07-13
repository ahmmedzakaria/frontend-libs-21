import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-button',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
    /** Button text */
    @Input() label: string = '';

    /** Icon class e.g. 'fa-solid fa-plus' */
    @Input() icon?: string;

    /** Bootstrap variant */
    @Input() variant:
        | 'primary'
        | 'secondary'
        | 'success'
        | 'danger'
        | 'warning'
        | 'info'
        | 'light'
        | 'dark' = 'primary';

    /** Size sm | md | lg */
    @Input() size: 'sm' | 'md' | 'lg' = 'md';

    /** Disabled state */
    @Input() disabled = false;

    /** Loading spinner */
    @Input() loading = false;

    /** Outline style */
    @Input() outline = false;

    /** Full width button */
    @Input() block = false;

    /** Rounded corners */
    @Input() rounded = true;

    /** Emits click event */
    @Output() clicked = new EventEmitter<void>();

    onClick(): void {
        if (!this.disabled && !this.loading) this.clicked.emit();
    }

    get classes(): string {
        const btnType = this.outline ? `btn-outline-${this.variant}` : `btn-${this.variant}`;
        const sizeClass = this.size !== 'md' ? `btn-${this.size}` : '';
        const blockClass = this.block ? 'w-100' : '';
        const roundClass = this.rounded ? 'rounded-pill' : '';
        return ['btn', btnType, sizeClass, blockClass, roundClass].join(' ').trim();
    }
}
