import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AuthorizationDenialService, ApplicationContextService, AuthService, UiPrivilegePolicy } from '@nexacore/platform';
import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { DynamicListComponent } from './dynamic-list.component';
import { DynamicListLoadParams, DynamicListLoadResult, ListColumnConfig } from './dynamic-list.model';

interface Row {
    id: number;
    name: string;
    status: 'draft' | 'pending' | 'verified' | 'rejected';
    photoUrl?: string;
}

const ROWS: Row[] = [
    { id: 1, name: 'Amina Osei', status: 'verified', photoUrl: 'https://example.com/a.png' },
    { id: 2, name: 'John Doe', status: 'pending' }
];

function makeLoader(rows: Row[] = ROWS) {
    const calls: DynamicListLoadParams[] = [];
    const loader = (params: DynamicListLoadParams): Observable<DynamicListLoadResult<Row>> => {
        calls.push(params);
        return of({ items: rows, total: rows.length });
    };
    return { loader, calls };
}

function createComponent(
    columns: ListColumnConfig<Row>[],
    loader: (params: DynamicListLoadParams) => Observable<DynamicListLoadResult<Row>>,
    policies: UiPrivilegePolicy[] = [],
    granted = new Set<string>()
): ComponentFixture<DynamicListComponent<Row>> {
    TestBed.configureTestingModule({
        imports: [DynamicListComponent],
        providers: [
            { provide: ApplicationContextService, useValue: {
                uiPolicies: signal(policies),
                privilegeCodes: signal([...granted]),
                hasPrivilege: (code: string) => granted.has(code)
            } },
            { provide: AuthService, useValue: { hasPrivilege: (code: string) => granted.has(code) } }
            ,{ provide: AuthorizationDenialService, useValue: { classify: (error: HttpErrorResponse) => error.status === 403
                ? { code:'DATA_SCOPE_NOT_ALLOWED', message:'Outside scope', traceId:error.headers.get('X-Trace-Id') ?? undefined } : null } }
        ]
    });
    const fixture = TestBed.createComponent(DynamicListComponent<Row>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('loadItems', loader);
    fixture.detectChanges();
    fixture.detectChanges();
    return fixture;
}

const textColumns: ListColumnConfig<Row>[] = [{ key: 'name', header: 'Name' }];

describe('DynamicListComponent', () => {
    it('fetches page 1 once on init', () => {
        const { loader, calls } = makeLoader();
        const fixture = createComponent(textColumns, loader);
        expect(calls).toEqual([{ query: '', searchType: null, page: 1, pageSize: 10 }]);
        expect(fixture.componentInstance.rows()).toEqual(ROWS);
        expect(fixture.componentInstance.total()).toBe(2);
    });

    it('renders a stable denial with its trace instead of an empty table', () => {
        const error=new HttpErrorResponse({ status:403, headers:new HttpHeaders({'X-Trace-Id':'trace-42'}) });
        const fixture=createComponent(textColumns,() => throwError(() => error));
        expect(fixture.componentInstance.loadState.status()).toBe('denied');
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('DATA_SCOPE_NOT_ALLOWED');
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('trace-42');
    });

    it('re-fetches with search params on search and with the requested page on pageChange', () => {
        const { loader, calls } = makeLoader();
        const fixture = createComponent(textColumns, loader);

        fixture.componentInstance.onSearch({ type: 'name', query: 'Amina' });
        expect(calls[1]).toEqual({ query: 'Amina', searchType: 'name', page: 1, pageSize: 10 });

        fixture.componentInstance.onPageChange(3);
        expect(calls[2]).toEqual({ query: 'Amina', searchType: 'name', page: 3, pageSize: 10 });
    });

    it('reloads page 1 when an external reload key changes', () => {
        const { loader, calls } = makeLoader();
        const fixture = createComponent(textColumns, loader);

        fixture.componentInstance.onPageChange(3);
        fixture.componentRef.setInput('reloadKey', 'client-b');
        fixture.detectChanges();

        expect(calls.at(-1)).toEqual({ query: '', searchType: null, page: 1, pageSize: 10 });
        expect(fixture.componentInstance.page()).toBe(1);
    });

    it('renders a badge column via a generated cell template', () => {
        const { loader } = makeLoader();
        const columns: ListColumnConfig<Row>[] = [
            { key: 'name', header: 'Name' },
            { key: 'status', header: 'Status', type: 'badge', status: (row) => row.status }
        ];
        const fixture = createComponent(columns, loader);
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('Verified');
        expect(text).toContain('Pending');
    });

    it('renders an image column, falling back to an icon badge when a row has no photo', () => {
        const { loader } = makeLoader();
        const columns: ListColumnConfig<Row>[] = [
            { key: 'photo', header: '', type: 'image', src: (row) => row.photoUrl }
        ];
        const fixture = createComponent(columns, loader);
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelectorAll('app-image-preview').length).toBe(1);
        expect(el.querySelectorAll('.dynamic-list__avatar-fallback').length).toBe(1);
    });

    it('invokes a row action without also emitting rowClick, and gates permissioned actions', () => {
        const { loader } = makeLoader();
        const onPreview = vi.fn();
        const onDelete = vi.fn();
        const columns: ListColumnConfig<Row>[] = [
            {
                key: 'actions',
                header: '',
                type: 'actions',
                actions: [
                    { icon: 'eye', label: 'Preview', onClick: onPreview },
                    { icon: 'trash', label: 'Delete', onClick: onDelete, permissionKey: 'row.delete' }
                ]
            }
        ];
        const fixture = createComponent(columns, loader, [], new Set());
        const rowClicks: Row[] = [];
        fixture.componentInstance.rowClick.subscribe((row) => rowClicks.push(row));

        // One "Preview" button per row (2 rows), no "Delete" button — its permissionKey isn't granted.
        const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('.dynamic-list__action-btn');
        expect(buttons.length).toBe(2);
        (buttons[0] as HTMLButtonElement).click();
        expect(onPreview).toHaveBeenCalledTimes(1);
        expect(onDelete).not.toHaveBeenCalled();
        expect(rowClicks).toHaveLength(0);
    });
});
