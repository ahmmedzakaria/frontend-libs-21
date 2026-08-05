import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../layout/index';

export interface SearchTypeOption {
    value: string;
    label: string;
}

export interface SearchToolbarEvent {
    type: string | null;
    query: string;
}

/**
 * An uncontrolled search form (owns its own type/query state) that emits
 * once on submit (Enter or the search button), not on every keystroke.
 */
@Component({
    selector: 'app-search-toolbar',
    standalone: true,
    imports: [FormsModule, IconComponent],
    templateUrl: './search-toolbar.component.html',
    styleUrl: './search-toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchToolbarComponent {
    readonly searchTypes = input<SearchTypeOption[]>([]);
    readonly placeholder = input('Search…');
    /** Named `searched`, not `search` — an output literally named `search` collides with the native DOM `search` event. */
    readonly searched = output<SearchToolbarEvent>();

    protected readonly selectedType = signal<string | null>(null);
    protected readonly query = signal('');

    /** Falls back to the first configured type until the consumer picks one. */
    protected readonly effectiveType = computed(() => this.selectedType() ?? this.searchTypes()[0]?.value ?? null);

    setType(value: string): void {
        this.selectedType.set(value);
    }

    setQuery(value: string): void {
        this.query.set(value);
    }

    runSearch(): void {
        this.searched.emit({ type: this.effectiveType(), query: this.query().trim() });
    }
}
