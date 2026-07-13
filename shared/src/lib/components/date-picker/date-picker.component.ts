import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export interface DateRange {
    start: string | null;
    end: string | null;
}

@Component({
    selector: 'app-date-picker',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './date-picker.component.html',
    styleUrls: ['./date-picker.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: DatePickerComponent,
            multi: true
        }
    ]
})
export class DatePickerComponent implements ControlValueAccessor, OnInit {
    @Input() label = 'Select Date';
    @Input() rangeMode = false;
    @Input() monthsToShow = 2;
    @Input() disablePast = false;
    @Input() disableFuture = false;
    @Input() showIcon = true;

    @Output() dateChange = new EventEmitter<string | DateRange | null>();

    control = new FormControl<string | null>(null);
    range: DateRange = { start: null, end: null };
    hoverDate: string | null = null;

    baseMonth = new Date();
    monthMatrix: { label: string; days: Date[] }[] = [];
    isOpen = false;

    onChange = (_: any) => {};
    onTouched = () => {};

    constructor(private eRef: ElementRef) {}

    ngOnInit(): void {
        this.generateMonths();
    }

    private generateMonths() {
        this.monthMatrix = [];
        for (let i = 0; i < this.monthsToShow; i++) {
            const monthDate = new Date(this.baseMonth.getFullYear(), this.baseMonth.getMonth() + i);
            const days = this.generateDays(monthDate);
            this.monthMatrix.push({
                label: monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                days
            });
        }
    }

    private generateDays(base: Date): Date[] {
        const start = new Date(base.getFullYear(), base.getMonth(), 1);
        const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
        const days: Date[] = [];
        for (let i = 1; i <= end.getDate(); i++) {
            days.push(new Date(base.getFullYear(), base.getMonth(), i));
        }
        return days;
    }

    toggleCalendar() {
        this.isOpen = !this.isOpen;
    }

    nextMonth() {
        this.baseMonth = new Date(this.baseMonth.getFullYear(), this.baseMonth.getMonth() + 1);
        this.generateMonths();
    }

    prevMonth() {
        this.baseMonth = new Date(this.baseMonth.getFullYear(), this.baseMonth.getMonth() - 1);
        this.generateMonths();
    }

    selectDate(date: Date) {
        const iso = date.toISOString().split('T')[0];

        if (!this.rangeMode) {
            this.control.setValue(iso);
            this.onChange(iso);
            this.dateChange.emit(iso);
            this.isOpen = false;
        } else {
            if (!this.range.start || (this.range.start && this.range.end)) {
                this.range = { start: iso, end: null };
            } else if (!this.range.end) {
                if (new Date(iso) < new Date(this.range.start)) {
                    this.range = { start: iso, end: this.range.start };
                } else {
                    this.range.end = iso;
                }
                this.onChange(this.range);
                this.dateChange.emit(this.range);
                this.isOpen = false;
            }
        }
    }

    onHover(date: Date | null) {
        this.hoverDate = date ? date.toISOString().split('T')[0] : null;
    }

    isSelected(date: Date): boolean {
        return !this.rangeMode && this.control.value === date.toISOString().split('T')[0];
    }

    isInRange(date: Date): boolean {
        if (!this.range.start || (!this.range.end && !this.hoverDate)) return false;

        const d = date.toISOString().split('T')[0];
        const start = this.range.start;
        const end = this.range.end ?? this.hoverDate;
        return d >= start! && d <= end!;
    }

    isStart(date: Date): boolean {
        return this.range.start === date.toISOString().split('T')[0];
    }

    isEnd(date: Date): boolean {
        return this.range.end === date.toISOString().split('T')[0];
    }

    @HostListener('document:click', ['$event'])
    handleOutsideClick(e: Event) {
        if (!this.eRef.nativeElement.contains(e.target)) this.isOpen = false;
    }

    writeValue(value: any): void {
        if (this.rangeMode && value && typeof value === 'object') this.range = value;
        else this.control.setValue(value);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
}
