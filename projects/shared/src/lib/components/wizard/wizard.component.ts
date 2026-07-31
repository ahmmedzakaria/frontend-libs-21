import { ChangeDetectionStrategy, Component, computed, contentChildren, effect, input, output, signal } from '@angular/core';
import { StepDef, StepperComponent } from '../stepper/stepper.component';
import { ButtonComponent } from '../button/button.component';
import { WizardStepComponent } from './wizard-step.component';

/**
 * Composes Stepper for the step indicator, plus its own Back/Next/Finish
 * actions that additionally gate on the active `<app-wizard-step>`'s form
 * validity — Stepper's own `linear` gating only knows about `completed`
 * flags, not forms, so Wizard layers the validity check on top rather than
 * teaching Stepper about forms.
 */
@Component({
    selector: 'app-wizard',
    standalone: true,
    imports: [StepperComponent, ButtonComponent],
    templateUrl: './wizard.component.html',
    styleUrl: './wizard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WizardComponent {
    readonly nextLabel = input('Next');
    readonly backLabel = input('Back');
    readonly finishLabel = input('Finish');

    readonly stepIndexChange = output<number>();
    readonly finished = output<void>();

    protected readonly stepComponents = contentChildren(WizardStepComponent);
    protected readonly currentIndex = signal(0);
    private readonly completedIndices = signal(new Set<number>());

    protected readonly stepDefs = computed<StepDef[]>(() =>
        this.stepComponents().map((s, i) => ({
            label: s.label(),
            disabled: s.disabled(),
            completed: this.completedIndices().has(i)
        }))
    );

    protected readonly isLastStep = computed(() => this.currentIndex() === this.stepComponents().length - 1);
    protected readonly currentInvalid = computed(() => this.stepComponents()[this.currentIndex()]?.invalid() ?? false);

    constructor() {
        effect(() => {
            const steps = this.stepComponents();
            const idx = this.currentIndex();
            steps.forEach((step, i) => step.setActive(i === idx));
        });
    }

    /** Stepper's own linear/disabled gating already ran by the time this fires — only additionally block a forward jump while the current step is still invalid. */
    onStepperRequest(index: number): void {
        if (index > this.currentIndex() && this.currentInvalid()) {
            return;
        }
        this.goTo(index);
    }

    next(): void {
        if (this.currentInvalid()) {
            return;
        }
        this.completedIndices.update((set) => new Set(set).add(this.currentIndex()));
        if (this.isLastStep()) {
            this.finished.emit();
            return;
        }
        this.goTo(this.currentIndex() + 1);
    }

    back(): void {
        this.goTo(Math.max(0, this.currentIndex() - 1));
    }

    private goTo(index: number): void {
        if (index === this.currentIndex()) {
            return;
        }
        this.currentIndex.set(index);
        this.stepIndexChange.emit(index);
    }
}
