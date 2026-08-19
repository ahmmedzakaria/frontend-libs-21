import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { Observable, of } from 'rxjs';
import { ActionTypes, ApiEndpoint, ApiService } from '@nexacore/platform';
import { DynamicWizardComponent, buildSubmitFormData, submitFieldKeysFrom } from './dynamic-wizard.component';
import { DynamicWizardData, DynamicWizardStepConfig } from './dynamic-wizard.model';

const steps: DynamicWizardStepConfig[] = [
    { key: 'basic', label: 'Basic', fields: [{ type: 'text', key: 'firstName', required: true }] },
    { key: 'more', label: 'More', fields: [{ type: 'text', key: 'lastName', required: true }] }
];

const createEndpoint: ApiEndpoint = { apiPath: 'test/create', actionType: ActionTypes.CREATE };

/** A loosely-typed stand-in for `ApiService.post` — a concrete mock can't
 * satisfy that method's actual generic `<T>(...) => Observable<T>` signature
 * (TS rejects substituting a fixed-return mock for an all-T generic), and
 * this is test scaffolding, not code under test, so the inferred `Mock` type
 * (not `ApiService['post']`) is fine here. */
function fakePost(response: unknown) {
    return vi.fn((_apiInfo: ApiEndpoint, _body?: unknown) => of(response) as Observable<unknown>);
}

function createComponent(data: DynamicWizardData, post?: ReturnType<typeof fakePost>): ComponentFixture<DynamicWizardComponent<unknown>> {
    TestBed.configureTestingModule({
        imports: [DynamicWizardComponent],
        providers: post ? [{ provide: ApiService, useValue: { post } }] : []
    });
    const fixture = TestBed.createComponent(DynamicWizardComponent<unknown>);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    return fixture;
}

function clickButtonByLabel(fixture: ComponentFixture<DynamicWizardComponent<unknown>>, label: string): void {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const target = buttons.find((button) => button.textContent?.trim() === label);
    target?.click();
    fixture.detectChanges();
}

describe('DynamicWizardComponent', () => {
    it('builds one FormGroup per step and reports it to the matching wizard step', () => {
        const fixture = createComponent({ config: { steps } });
        expect(fixture.componentInstance.stepForms()).toHaveLength(2);
        expect(fixture.componentInstance.stepForms().every((group) => group !== null)).toBe(true);
    });

    it('does not submit when an earlier step is left invalid, even once the current step is valid', () => {
        const fixture = createComponent({ config: { steps } });
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
        const fixture = createComponent({ config: { steps } });
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

    it('seeds every field step\'s initialValue from data().entity', () => {
        const fixture = createComponent({ entity: { firstName: 'Amina' }, config: { steps } });
        expect(fixture.componentInstance.stepForms()[0]!.get('firstName')!.value).toBe('Amina');
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
        const fixture = createComponent({ config: { steps } });
        expect(fixture.componentInstance.submitFieldKeys()).toEqual(['firstName', 'lastName']);
    });

    it('buildSubmitFormData expands a submitFields field into its own entries and skips excludeFromSubmit fields', () => {
        const withOverrides: DynamicWizardStepConfig[] = [
            {
                key: 'basic', label: 'Basic',
                fields: [
                    { type: 'text', key: 'firstName' },
                    { type: 'checkbox', key: 'sameAddress', excludeFromSubmit: true },
                    {
                        type: 'text', key: 'location',
                        submitFields: (value) => {
                            const loc = value as { id: string; type: string } | null;
                            return { locationId: loc?.id ?? '', locationType: loc?.type ?? '' };
                        }
                    }
                ]
            }
        ];
        const formData = buildSubmitFormData(withOverrides, {
            firstName: 'Amina',
            sameAddress: true,
            location: { id: 'loc-1', type: 'district' }
        });

        expect(formData.get('firstName')).toBe('Amina');
        expect(formData.get('sameAddress')).toBeNull();
        expect(formData.get('location')).toBeNull();
        expect(formData.get('locationId')).toBe('loc-1');
        expect(formData.get('locationType')).toBe('district');
    });

    it('buildSubmitFormData skips null/undefined values and appends a File directly via submitFields', () => {
        const file = new File(['content'], 'photo.png', { type: 'image/png' });
        const withFile: DynamicWizardStepConfig[] = [
            {
                key: 'basic', label: 'Basic',
                fields: [
                    { type: 'text', key: 'middleName' },
                    { type: 'attachment', key: 'photo', submitFields: (value) => ({ photo: (value as File[])[0] }) }
                ]
            }
        ];
        const formData = buildSubmitFormData(withFile, { middleName: null, photo: [file] });

        expect(formData.get('middleName')).toBeNull();
        expect(formData.get('photo')).toBe(file);
    });

    it('submitConfig: posts to the CREATE actionType\'s endpoint and emits submitSuccess with the response', () => {
        const post = fakePost({ id: 'new-record' });
        const fixture = createComponent(
            { config: { steps, submitConfig: { actionType: ActionTypes.CREATE, createApiEndpoint: createEndpoint } } },
            post
        );
        const succeeded: unknown[] = [];
        fixture.componentInstance.submitSuccess.subscribe((value) => succeeded.push(value));

        fixture.componentInstance.stepForms()[0]!.get('firstName')!.setValue('Amina');
        fixture.detectChanges();
        clickButtonByLabel(fixture, 'Next');
        fixture.componentInstance.stepForms()[1]!.get('lastName')!.setValue('Doe');
        fixture.detectChanges();
        clickButtonByLabel(fixture, 'Save');

        expect(post).toHaveBeenCalledTimes(1);
        const [calledEndpoint, calledBody] = post.mock.calls[0];
        expect(calledEndpoint).toBe(createEndpoint);
        const postedFormData = calledBody as FormData;
        expect(postedFormData.get('firstName')).toBe('Amina');
        expect(postedFormData.get('lastName')).toBe('Doe');
        expect(succeeded).toEqual([{ id: 'new-record' }]);
    });

    it('does not call the API when an earlier step is invalid', () => {
        const post = fakePost(null);
        const fixture = createComponent(
            { config: { steps, submitConfig: { actionType: ActionTypes.CREATE, createApiEndpoint: createEndpoint } } },
            post
        );

        fixture.componentInstance.stepForms()[1]!.get('lastName')!.setValue('Doe');
        fixture.componentInstance.stepForms()[0]!.get('firstName')!.setValue('');
        fixture.detectChanges();
        clickButtonByLabel(fixture, 'Save');

        expect(post).not.toHaveBeenCalled();
    });
});
