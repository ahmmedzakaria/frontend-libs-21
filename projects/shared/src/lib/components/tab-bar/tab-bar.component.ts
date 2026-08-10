import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChildren } from '@angular/core';
import { TabDef } from './tab-bar.model';

/**
 * Config-driven ARIA tabs bar — role="tablist"/"tab", arrow-key switching,
 * Home/End jump to the first/last enabled tab, roving tabindex so only the
 * active tab sits in the natural Tab order (disabled tabs skipped by all
 * navigation, not just visually greyed out).
 *
 * Fully controlled, same "value in, event out" shape as StepperComponent:
 * `activeIndex` always reflects the true current tab, `tabChange` is just a
 * request the parent may ignore. Renders only the tab strip, not panels —
 * `idPrefix` exists so a caller owning separate tabpanel elements (e.g.
 * DynamicTabComponent) can wire matching `id`/`aria-labelledby` pairs.
 */
@Component({
    selector: 'app-tab-bar',
    standalone: true,
    templateUrl: './tab-bar.component.html',
    styleUrl: './tab-bar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabBarComponent {
    readonly tabs = input.required<TabDef[]>();
    readonly activeIndex = input(0);
    /** Prefix for this bar's generated tab-button ids (`{idPrefix}-tab-{i}`) — pass
     * a shared prefix in from the caller so its own tabpanel ids can match. */
    readonly idPrefix = input('tab-bar');
    readonly tabChange = output<number>();

    private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');

    select(index: number): void {
        const tab = this.tabs()[index];
        if (!tab || tab.disabled) {
            return;
        }
        this.tabChange.emit(index);
    }

    onKeydown(event: KeyboardEvent, index: number): void {
        const tabs = this.tabs();
        if (!tabs.length) {
            return;
        }

        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                this.focusAndSelect(this.nextEnabledIndex(index, 1));
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.focusAndSelect(this.nextEnabledIndex(index, -1));
                break;
            case 'Home':
                event.preventDefault();
                this.focusAndSelect(this.nextEnabledIndex(-1, 1));
                break;
            case 'End':
                event.preventDefault();
                this.focusAndSelect(this.nextEnabledIndex(tabs.length, -1));
                break;
        }
    }

    private nextEnabledIndex(from: number, delta: number): number {
        const tabs = this.tabs();
        let next = from;
        for (let i = 0; i < tabs.length; i++) {
            next = (next + delta + tabs.length) % tabs.length;
            if (!tabs[next].disabled) {
                return next;
            }
        }
        return from;
    }

    private focusAndSelect(index: number): void {
        this.select(index);
        this.tabButtons()[index]?.nativeElement.focus();
    }
}
