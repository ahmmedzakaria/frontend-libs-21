import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, viewChildren } from '@angular/core';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { DynamicListComponent } from '../dynamic-list/dynamic-list.component';
import { DynamicPreviewComponent } from '../dynamic-preview/dynamic-preview.component';
import { TabBarComponent } from '../tab-bar/tab-bar.component';
import { TabDef } from '../tab-bar/tab-bar.model';
import { DynamicTabConfig, DynamicTabFieldConfig, DynamicTabListConfig, DynamicTabPreviewConfig } from './dynamic-tab.model';

let nextUid = 0;

/**
 * Config-driven tabs: composes TabBarComponent for the header and dispatches
 * each tab's content to DynamicFormComponent/DynamicPreviewComponent/
 * DynamicListComponent — see dynamic-tab.model.ts.
 *
 * Lazy-mount, keep-alive panels: unlike DynamicWizardComponent (which mounts
 * every step upfront so every step's FormGroup stays alive for the final
 * merge), a tab panel mounts only the first time it's visited, then stays
 * mounted (hidden via `display: none`) — tabs are independent views, not
 * steps building toward one submit, and several real tabs wrap
 * DynamicListComponent, where mounting all of them eagerly would fire every
 * tab's data load at once.
 */
@Component({
    selector: 'app-dynamic-tab',
    standalone: true,
    imports: [TabBarComponent, DynamicFormComponent, DynamicPreviewComponent, DynamicListComponent],
    templateUrl: './dynamic-tab.component.html',
    styleUrl: './dynamic-tab.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicTabComponent {
    readonly tabs = input.required<DynamicTabConfig[]>();
    /** Initial tab only — after mount, tab clicks are the source of truth,
     * same "controlled by events after mount" shape as DynamicWizard's own
     * currentIndex. */
    readonly activeIndex = input(0);
    readonly tabChange = output<number>();

    protected readonly uid = `dynamic-tab-${nextUid++}`;
    protected readonly currentIndex = signal(0);
    protected readonly visited = signal<ReadonlySet<number>>(new Set());
    private initialized = false;

    protected readonly tabDefs = computed<TabDef[]>(() =>
        this.tabs().map((tab) => ({ key: tab.key, label: tab.label, disabled: tab.disabled }))
    );

    constructor() {
        effect(() => {
            if (!this.initialized) {
                this.initialized = true;
                this.currentIndex.set(this.activeIndex());
            }
            const idx = this.currentIndex();
            this.visited.update((set) => (set.has(idx) ? set : new Set([...set, idx])));
        });
    }

    protected select(index: number): void {
        const tab = this.tabs()[index];
        if (!tab || tab.disabled) {
            return;
        }
        this.currentIndex.set(index);
        this.tabChange.emit(index);
    }

    /** Type guards mirroring DynamicFormComponent.isTextField / DynamicWizardComponent.isReviewStep. */
    protected isFieldTab(tab: DynamicTabConfig): tab is DynamicTabFieldConfig {
        return 'fields' in tab;
    }

    protected isPreviewTab(tab: DynamicTabConfig): tab is DynamicTabPreviewConfig {
        return 'sections' in tab;
    }

    protected isListTab(tab: DynamicTabConfig): tab is DynamicTabListConfig {
        return 'loadItems' in tab;
    }

    private readonly dynamicLists = viewChildren(DynamicListComponent);

    /** List-tab keys currently mounted, in the same order `<app-dynamic-list>`
     * instances appear in the DOM — lets `reloadTab()` correlate a key to its
     * position in `dynamicLists()` without needing a directive/id lookup. */
    private readonly mountedListTabKeys = computed(() =>
        this.tabs()
            .map((tab, i) => ({ tab, i }))
            .filter(({ tab, i }) => this.isListTab(tab) && this.visited().has(i))
            .map(({ tab }) => tab.key)
    );

    /** Reloads a list-type tab's DynamicListComponent by key — e.g. after an
     * external action (a save, a sync) changes what that tab should show.
     * A no-op if that tab hasn't been visited yet (nothing mounted) or isn't
     * a list tab. Public so consumers can drive it directly, same rationale
     * as DynamicListComponent.reload() itself being public. */
    reloadTab(key: string): void {
        const position = this.mountedListTabKeys().indexOf(key);
        this.dynamicLists()[position]?.reload();
    }
}
