import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

@Component({
    selector: 'app-assignment-checklist',
    standalone: true,
    templateUrl: './assignment-checklist.component.html',
    styleUrl: './assignment-checklist.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentChecklistComponent<T> {
    readonly items = input.required<readonly T[]>();
    readonly selectedKeys = input.required<ReadonlySet<string | number>>();
    readonly keyOf = input.required<(item: T) => string | number>();
    readonly labelOf = input.required<(item: T) => string>();
    readonly detailOf = input<(item: T) => string>(() => '');
    readonly groupOf = input<(item: T) => string>(() => '');
    readonly disabled = input(false);
    readonly searchPlaceholder = input('Search assignments');
    readonly selectionChanged = output<{ item: T; selected: boolean }>();

    readonly query = signal('');
    readonly visibleItems = computed(() => {
        const query = this.query().trim().toLowerCase();
        if (!query) return this.items();
        return this.items().filter(item =>
            `${this.labelOf()(item)} ${this.detailOf()(item)}`.toLowerCase().includes(query));
    });
    readonly visibleGroups = computed(() => {
        const groups = new Map<string, T[]>();
        this.visibleItems().forEach(item => {
            const group = this.groupOf()(item);
            groups.set(group, [...(groups.get(group) ?? []), item]);
        });
        return [...groups.entries()].map(([label, items]) => ({ label, items }));
    });

    protected updateQuery(event: Event): void {
        this.query.set((event.target as HTMLInputElement).value);
    }

    protected toggle(item: T, event: Event): void {
        this.selectionChanged.emit({ item, selected: (event.target as HTMLInputElement).checked });
    }
}
