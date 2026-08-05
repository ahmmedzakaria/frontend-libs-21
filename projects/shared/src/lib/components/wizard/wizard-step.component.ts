import { ChangeDetectionStrategy, Component, HostBinding, computed, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { of, startWith, switchMap } from 'rxjs';

/**
 * A single step's projected content — step bodies stay real projected
 * content (arbitrary forms), not a `{label, content}[]` data array.
 * Visibility is driven by WizardComponent via `setActive()`, which holds a
 * `contentChildren()` query over every instance.
 */
@Component({
    selector: 'app-wizard-step',
    standalone: true,
    template: '<ng-content />',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WizardStepComponent {
    readonly label = input.required<string>();
    readonly disabled = input(false);
    /** The step's own form, if it has one — omit for a step with nothing to validate (e.g. a pure review/summary step), which Wizard then always treats as valid. */
    readonly form = input<AbstractControl | null>(null);

    private readonly status = toSignal(
        toObservable(this.form).pipe(switchMap((form) => (form ? form.statusChanges.pipe(startWith(form.status)) : of('VALID')))),
        { initialValue: 'VALID' as const }
    );

    /** Public: WizardComponent reads this to gate "Next". */
    readonly invalid = computed(() => this.status() === 'INVALID');

    protected readonly active = signal(false);

    @HostBinding('style.display') get display(): string {
        return this.active() ? '' : 'none';
    }

    setActive(active: boolean): void {
        this.active.set(active);
    }
}
