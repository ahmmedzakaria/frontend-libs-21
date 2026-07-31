import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '@nexacore/layout';
import { SearchToolbarComponent, SearchToolbarEvent, SearchTypeOption } from '../search-toolbar/search-toolbar.component';

/** A single active-filter chip rendered below the search row — the consumer owns computing this list from its own filter controls' state. */
export interface FilterChip {
    key: string;
    label: string;
}

/**
 * A row of filters above a DataTable: composes SearchToolbar (search
 * type/query) with a content-projection slot for arbitrary extra filter
 * controls that the consumer supplies. Surfaces the combined filter state as
 * three events: `searched`, `chipRemoved` for an individual active-filter
 * chip's "x", and `cleared` for "Clear all".
 */
@Component({
    selector: 'app-filter-bar',
    standalone: true,
    imports: [IconComponent, SearchToolbarComponent],
    templateUrl: './filter-bar.component.html',
    styleUrl: './filter-bar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterBarComponent {
    readonly searchTypes = input<SearchTypeOption[]>([]);
    readonly placeholder = input('Search…');
    readonly chips = input<FilterChip[]>([]);

    /** Named `searched`, not `search` — an output literally named `search` collides with the native DOM `search` event. */
    readonly searched = output<SearchToolbarEvent>();
    readonly chipRemoved = output<string>();
    readonly cleared = output<void>();

    onSearch(event: SearchToolbarEvent): void {
        this.searched.emit(event);
    }

    removeChip(key: string): void {
        this.chipRemoved.emit(key);
    }

    clearAll(): void {
        this.cleared.emit();
    }
}
