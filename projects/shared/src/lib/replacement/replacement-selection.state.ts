import { computed, signal } from '@angular/core';

export type ReplacementStatus = 'idle' | 'loading' | 'loaded' | 'saving' | 'failed';
export type ReplacementComparison = 'set' | 'ordered';

export interface ReplacementSummary<T> {
    additions: T[];
    removals: T[];
    unchanged: T[];
}

export interface ReplacementSelectionOptions<T, K> {
    keyOf: (item: T) => K;
    comparison?: ReplacementComparison;
}

/**
 * State machine for destructive full-replacement operations. Selection cannot
 * be saved until an authoritative server read succeeds; a failed read never
 * degrades into an empty replacement.
 */
export class ReplacementSelectionState<T, K = T> {
    readonly status = signal<ReplacementStatus>('idle');
    readonly error = signal<string | null>(null);
    readonly original = signal<readonly T[]>([]);
    readonly selected = signal<readonly T[]>([]);

    readonly summary = computed(() => this.compare(this.original(), this.selected()));
    readonly dirty = computed(() => {
        if (this.status() !== 'loaded' && this.status() !== 'saving') return false;
        const summary = this.summary();
        if (summary.additions.length || summary.removals.length) return true;
        return this.options.comparison === 'ordered'
            && this.original().some((item, index) => this.options.keyOf(item) !== this.options.keyOf(this.selected()[index]));
    });
    readonly canSave = computed(() => this.status() === 'loaded' && this.dirty());

    constructor(private readonly options: ReplacementSelectionOptions<T, K>) {}

    beginLoad(): void {
        this.status.set('loading');
        this.error.set(null);
        this.original.set([]);
        this.selected.set([]);
    }

    loadSucceeded(items: readonly T[]): void {
        this.original.set([...items]);
        this.selected.set([...items]);
        this.error.set(null);
        this.status.set('loaded');
    }

    loadFailed(message: string): void {
        this.original.set([]);
        this.selected.set([]);
        this.error.set(message);
        this.status.set('failed');
    }

    setSelection(items: readonly T[]): void {
        if (this.status() !== 'loaded') return;
        this.selected.set([...items]);
    }

    toggle(item: T, selected: boolean): void {
        if (this.status() !== 'loaded') return;
        const key = this.options.keyOf(item);
        const next = this.selected().filter(candidate => this.options.keyOf(candidate) !== key);
        this.selected.set(selected ? [...next, item] : next);
    }

    beginSave(): boolean {
        if (!this.canSave()) return false;
        this.status.set('saving');
        this.error.set(null);
        return true;
    }

    saveSucceeded(): void {
        if (this.status() !== 'saving') return;
        this.original.set([...this.selected()]);
        this.status.set('loaded');
    }

    saveFailed(message: string): void {
        if (this.status() !== 'saving') return;
        this.error.set(message);
        this.status.set('loaded');
    }

    reset(): void {
        this.status.set('idle');
        this.error.set(null);
        this.original.set([]);
        this.selected.set([]);
    }

    private compare(original: readonly T[], selected: readonly T[]): ReplacementSummary<T> {
        const originalKeys = new Set(original.map(item => this.options.keyOf(item)));
        const selectedKeys = new Set(selected.map(item => this.options.keyOf(item)));
        return {
            additions: selected.filter(item => !originalKeys.has(this.options.keyOf(item))),
            removals: original.filter(item => !selectedKeys.has(this.options.keyOf(item))),
            unchanged: selected.filter(item => originalKeys.has(this.options.keyOf(item))),
        };
    }
}
