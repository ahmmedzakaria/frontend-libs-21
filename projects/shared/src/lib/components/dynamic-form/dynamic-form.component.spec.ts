import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DynamicFormComponent } from './dynamic-form.component';
import { FieldConfig } from './dynamic-form.model';

function createComponent(fields: FieldConfig[], initialValue: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [DynamicFormComponent] });
    const fixture = TestBed.createComponent(DynamicFormComponent);
    fixture.componentRef.setInput('fields', fields);
    fixture.componentRef.setInput('initialValue', initialValue);
    fixture.detectChanges();
    return fixture;
}

describe('DynamicFormComponent', () => {
    it('builds a FormGroup with one control per field key', () => {
        const fixture = createComponent([
            { type: 'text', key: 'firstName', label: 'First Name' },
            { type: 'checkbox', key: 'agree', label: 'Agree' }
        ]);
        expect(Object.keys(fixture.componentInstance.form()!.controls)).toEqual(['firstName', 'agree']);
    });

    it('marks a required text field invalid until filled', () => {
        const fixture = createComponent([{ type: 'text', key: 'firstName', required: true }]);
        const control = fixture.componentInstance.form()!.get('firstName')!;
        expect(control.valid).toBe(false);
        control.setValue('Amina');
        expect(control.valid).toBe(true);
    });

    it('uses requiredTrue semantics for a required checkbox', () => {
        const fixture = createComponent([{ type: 'checkbox', key: 'agree', required: true }]);
        const control = fixture.componentInstance.form()!.get('agree')!;
        expect(control.value).toBe(false);
        expect(control.valid).toBe(false);
        control.setValue(true);
        expect(control.valid).toBe(true);
    });

    it('requires a non-empty array for a required file-upload field', () => {
        const fixture = createComponent([{ type: 'file-upload', key: 'photo', required: true }]);
        const control = fixture.componentInstance.form()!.get('photo')!;
        expect(control.value).toEqual([]);
        expect(control.valid).toBe(false);
        control.setValue([new File([], 'a.png')]);
        expect(control.valid).toBe(true);
    });

    it('seeds control values from initialValue', () => {
        const fixture = createComponent([{ type: 'text', key: 'firstName' }], { firstName: 'Kyc Manager' });
        expect(fixture.componentInstance.form()!.get('firstName')!.value).toBe('Kyc Manager');
    });

    it('submits only once the form is valid, marking all controls touched otherwise', () => {
        const fixture = createComponent([{ type: 'text', key: 'firstName', required: true }]);
        const emitted: Record<string, unknown>[] = [];
        fixture.componentInstance.submitted.subscribe((value) => emitted.push(value));

        fixture.componentInstance.submit();
        expect(emitted).toHaveLength(0);
        expect(fixture.componentInstance.form()!.get('firstName')!.touched).toBe(true);

        fixture.componentInstance.form()!.get('firstName')!.setValue('Amina');
        fixture.componentInstance.submit();
        expect(emitted).toEqual([{ firstName: 'Amina' }]);
    });

    it('computes an error message only once a caller-driven field is touched and invalid', () => {
        const fixture = createComponent([
            { type: 'dropdown', key: 'country', label: 'Country', required: true, options: [{ label: 'USA', value: 'US' }] }
        ]);
        expect(fixture.componentInstance.errorFor('country')).toBeNull();
        fixture.componentInstance.form()!.get('country')!.markAsTouched();
        expect(fixture.componentInstance.errorFor('country')).toBe('This field is required.');
    });
});
