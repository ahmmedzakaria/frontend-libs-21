import {
    Component, ElementRef, EventEmitter, forwardRef, HostListener,
    Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
    ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, of, Subject, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

type DropdownMode = 'static' | 'api-simple' | 'api-scroll';

@Component({
    selector: 'app-smart-dropdown',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './smart-dropdown.component.html',
    styleUrls: ['./smart-dropdown.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SmartDropdownComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SmartDropdownComponent),
            multi: true
        }
    ]
})
export class SmartDropdownComponent implements OnInit, ControlValueAccessor, Validator {
    /** Inputs */
    @Input() label = '';
    @Input() placeholder = 'Select...';
    @Input() required = false;
    @Input() mode: DropdownMode = 'static'; // 'static' | 'api-simple' | 'api-scroll'
    @Input() options: { label: string; value: any }[] = [];
    @Input() apiUrl?: string; // for api modes
    @Input() pageSize = 10;
    @Input() reselectable = true;
    @Input() searchable = true;
    @Input() disabled = false;
    @Input() helpText?: string;
    @Input() requestBody: any = {};
    /** Outputs */
    @Output() changed = new EventEmitter<any>();

    /** View refs */
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
    @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

    /** State */
    showDropdown = false;
    filteredOptions: { label: string; value: any }[] = [];
    value: any = null;
    selectedLabel = '';
    searchTerm = '';
    errorMessage: string | null = null;
    focusedIndex = 0;
    /** Pagination (for api-scroll mode) */
    page = 0;
    totalPages = 1;
    loading = false;

    private searchSubject = new Subject<string>();
    private onChange = (val: any) => {};
    private onTouched = () => {};

    constructor(private http: HttpClient, private el: ElementRef) {}

    ngOnInit(): void {
        if (this.mode === 'static') {
            this.filteredOptions = [...this.options];
        } else {
            this.setupSearch();
            this.loadData();
        }
    }

    /** --- Reactive search handling --- */
    private setupSearch() {
        this.searchSubject.pipe(
            debounceTime(400),
            tap(() => {
                this.page = 0;
                this.filteredOptions = [];
            }),
            switchMap(term => this.fetchData(term))
        ).subscribe();
    }

    private fetchData(term = '') {
        if (!this.apiUrl) return of([]);
        this.loading = true;
        const body = { searchText: term, page: this.page, size: this.pageSize, source: 'NEXACORE_APP' };
        return this.http.post<any>(this.apiUrl, body).pipe(
            tap(res => {
                const content = res?.content ?? res ?? [];
                this.filteredOptions = [...this.filteredOptions, ...content.map((c: any) => ({
                    label: c.detailLocation ?? c.label ?? 'Unnamed',
                    value: c.id
                }))];
                this.totalPages = res?.totalPages ?? 1;
                this.loading = false;
            })
        );
    }

    loadData() {
        if (this.mode === 'api-simple') {
            this.fetchData().subscribe();
        } else if (this.mode === 'api-scroll') {
            this.fetchData().subscribe();
        }
    }

    /** --- User actions --- */
    toggleDropdown(): void {
        if (this.showDropdown) {
            this.showDropdown = false;
        } else {
            this.showDropdown = true;
            if (this.mode !== 'static') this.page = 0;
            setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
        }
    }

    filter(element: EventTarget | null): void {
        const input = element as HTMLInputElement;
        this.searchTerm = input?.value || '';

        if (this.mode === 'static') {
            this.filteredOptions = this.options.filter(o =>
                o.label.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        } else {
            this.searchSubject.next(this.searchTerm);
        }
    }

    selectOption(option: any): void {
        if (!this.reselectable && this.value === option.value) return;
        this.value = option.value;
        this.selectedLabel = option.label;
        this.onChange(this.value);
        this.changed.emit(this.value);
        this.showDropdown = false;
    }

    onScroll(): void {
        if (this.mode !== 'api-scroll' || this.loading || this.page >= this.totalPages - 1) return;
        const el = this.scrollContainer.nativeElement;
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
        if (nearBottom) {
            this.page++;
            this.fetchData(this.searchTerm).subscribe();
        }
    }

    /** --- Form control methods --- */
    writeValue(value: any): void {
        this.value = value;
        this.updateSelectedLabel();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    validate(): ValidationErrors | null {
        if (this.required && !this.value) {
            this.errorMessage = `${this.label || 'This field'} is required`;
            return { required: true };
        }
        this.errorMessage = null;
        return null;
    }

    private updateSelectedLabel(): void {
        const selected = this.options.find(o => o.value === this.value);
        this.selectedLabel = selected ? selected.label : '';
    }

    @HostListener('document:click', ['$event'])
    onOutsideClick(event: MouseEvent): void {
        if (!this.el.nativeElement.contains(event.target)) {
            this.showDropdown = false;
        }
    }
}
