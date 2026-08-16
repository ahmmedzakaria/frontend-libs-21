import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DynamicWizardComponent, submitFieldKeysFrom } from './dynamic-wizard.component';
import { DynamicWizardStepConfig } from './dynamic-wizard.model';

const steps: DynamicWizardStepConfig[] = [
    { key: 'basic', label: 'Basic', fields: [{ type: 'text', key: 'firstName', required: true }] },
    { key: 'more', label: 'More', fields: [{ type: 'text', key: 'lastName', required: true }] }
];

function createComponent(config: DynamicWizardStepConfig[]): ComponentFixture<DynamicWizardComponent> {
    TestBed.configureTestingModule({ imports: [DynamicWizardComponent] });
    const fixture = TestBed.createComponent(DynamicWizardComponent);
    fixture.componentRef.setInput('steps', config);
    fixture.detectChanges();
    return fixture;
}

function clickButtonByLabel(fixture: ComponentFixture<DynamicWizardComponent>, label: string): void {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const target = buttons.find((button) => button.textContent?.trim() === label);
    target?.click();
    fixture.detectChanges();
}

describe('DynamicWizardComponent', () => {
    it('builds one FormGroup per step and reports it to the matching wizard step', () => {
        const fixture = createComponent(steps);
        expect(fixture.componentInstance.stepForms()).toHaveLength(2);
        expect(fixture.componentInstance.stepForms().every((group) => group !== null)).toBe(true);
    });

    it('does not submit when an earlier step is left invalid, even once the current step is valid', () => {
        const fixture = createComponent(steps);
        const emitted: Record<string, unknown>[] = [];
        fixture.componentInstance.submitted.subscribe((value) => emitted.push(value));

        fixture.componentInstance.stepForms()[0]!.get('firstName')!.setValue('Amina');
        fixture.detectChanges();
        clickButtonByLabel(fixture, 'Next');

        // Last step becomes valid, but the earlier step is re-invalidated —
        // WizardComponent's own gating only inspects the current step, so its
        // Finish/Save button will be enabled here regardless.
        fixture.componentInstance.stepForms()[1]!.get('lastName')!.setValue('Doe');
        fixture.componentInstance.stepForms()[0]!.get('firstName')!.setValue('');
        fixture.detectChanges();
        clickButtonByLabel(fixture, 'Save');

        expect(emitted).toHaveLength(0);
        expect(fixture.componentInstance.stepForms()[0]!.get('firstName')!.touched).toBe(true);
    });

    it('submits the flat-merged value once every step is valid', () => {
        const fixture = createComponent(steps);
        const emitted: Record<string, unknown>[] = [];
        fixture.componentInstance.submitted.subscribe((value) => emitted.push(value));

        fixture.componentInstance.stepForms()[0]!.get('firstName')!.setValue('Amina');
        fixture.detectChanges();
        clickButtonByLabel(fixture, 'Next');

        fixture.componentInstance.stepForms()[1]!.get('lastName')!.setValue('Doe');
        fixture.detectChanges();
        clickButtonByLabel(fixture, 'Save');

        expect(emitted).toEqual([{ firstName: 'Amina', lastName: 'Doe' }]);
    });

    it('submitFieldKeysFrom collects every field-step key except ones marked excludeFromSubmit', () => {
        const withExclusion: DynamicWizardStepConfig[] = [
            {
                key: 'basic', label: 'Basic',
                fields: [
                    { type: 'text', key: 'firstName' },
                    { type: 'attachment', key: 'photo', excludeFromSubmit: true }
                ]
            },
            { key: 'review', label: 'Review' }
        ];
        expect(submitFieldKeysFrom(withExclusion)).toEqual(['firstName']);
    });

    it('exposes the same computation reactively as submitFieldKeys()', () => {
        const fixture = createComponent(steps);
        expect(fixture.componentInstance.submitFieldKeys()).toEqual(['firstName', 'lastName']);
    });
});
