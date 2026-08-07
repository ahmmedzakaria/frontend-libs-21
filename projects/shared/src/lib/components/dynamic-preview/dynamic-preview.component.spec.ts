import { Component, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DynamicPreviewComponent } from './dynamic-preview.component';
import { PreviewSectionConfig } from './dynamic-preview.model';

interface Row {
    id: number;
    name: string;
    nickname: string | null;
    status: 'draft' | 'pending' | 'verified' | 'rejected';
    photoUrl?: string;
}

const ROW: Row = { id: 1, name: 'Amina Osei', nickname: null, status: 'verified' };

function createComponent(sections: PreviewSectionConfig<Row>[], data: Row = ROW): ComponentFixture<DynamicPreviewComponent<Row>> {
    TestBed.configureTestingModule({ imports: [DynamicPreviewComponent] });
    const fixture = TestBed.createComponent(DynamicPreviewComponent<Row>);
    fixture.componentRef.setInput('sections', sections);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    return fixture;
}

describe('DynamicPreviewComponent', () => {
    it('renders a plain text field, falling back to "-" for a null value', () => {
        const fixture = createComponent([
            { key: 'basic', title: 'Basic', fields: [{ key: 'name', label: 'Name' }, { key: 'nickname', label: 'Nickname' }] }
        ]);
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Amina Osei');
        expect(text).toContain('-');
    });

    it('applies a format function when provided', () => {
        const fixture = createComponent([
            { key: 'basic', fields: [{ key: 'name', label: 'Name', format: (row) => row.name.toUpperCase() }] }
        ]);
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('AMINA OSEI');
    });

    it('renders a status field as app-status-badge', () => {
        const fixture = createComponent([
            { key: 'basic', fields: [{ key: 'status', label: 'Status', type: 'status', status: (row) => row.status }] }
        ]);
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('app-status-badge').length).toBe(1);
        expect(el.textContent).toContain('Verified');
    });

    it('renders an image field, falling back to an icon badge when the row has no photo', () => {
        const fixture = createComponent([
            { key: 'basic', fields: [{ key: 'photoUrl', label: 'Photo', type: 'image', src: (row) => row.photoUrl }] }
        ]);
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('app-image-preview').length).toBe(0);
        expect(el.querySelectorAll('.dynamic-preview__avatar-fallback--sm').length).toBe(1);
    });

    it('omits the section heading when title is not set', () => {
        const fixture = createComponent([{ key: 'basic', fields: [{ key: 'name', label: 'Name' }] }]);
        expect((fixture.nativeElement as HTMLElement).querySelector('.dynamic-preview__section-title')).toBeNull();
    });

    it('renders a custom field via its projected template', () => {
        @Component({
            standalone: true,
            imports: [DynamicPreviewComponent],
            template: `
                <ng-template #tpl let-row>
                    <strong>Custom: {{ row.name }}</strong>
                </ng-template>
                <app-dynamic-preview [sections]="sections" [data]="data" />
            `
        })
        class HostComponent {
            protected readonly tplRef = viewChild.required<TemplateRef<{ $implicit: Row }>>('tpl');
            protected readonly data = ROW;
            protected get sections(): PreviewSectionConfig<Row>[] {
                return [{ key: 'basic', fields: [{ key: 'name', label: 'Name', type: 'custom', cellTemplate: this.tplRef() }] }];
            }
        }

        TestBed.configureTestingModule({ imports: [HostComponent] });
        const fixture = TestBed.createComponent(HostComponent);
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Custom: Amina Osei');
    });
});
