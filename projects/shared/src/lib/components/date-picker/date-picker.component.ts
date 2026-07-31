import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { IconComponent } from '@nexacore/layout';
import { BaseValueAccessor } from '../base/base-value-accessor';
import {
    addDays,
    addMonths,
    buildMonthGrid,
    formatDate,
    isAfter,
    isBefore,
    isSameDay,
    isWithinRange,
    parseIsoDate,
    toIsoDate,
    WEEKDAY_LABELS
} from '../../date-utils';

export interface DateRangeValue {
    start: string | null;
    end: string | null;
}

/** Single-date mode emits a plain 'YYYY-MM-DD' string; range mode emits { start, end } of the same. */
export type DatePickerValue = string | DateRangeValue;

const EMPTY_RANGE: DateRangeValue = { start: null, end: null };

let nextUid = 0;

@Component({
    selector: 'app-date-picker',
    standalone: true,
    imports: [OverlayModule, IconComponent],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: DatePickerComponent, multi: true }],
    templateUrl: './date-picker.component.html',
    styleUrl: './date-picker.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerComponent extends BaseValueAccessor<DatePickerValue> {
    readonly label = input('');
    readonly placeholder = input('Select date...');
    readonly rangeMode = input(false);
    readonly monthsToShow = input(1);
    readonly disablePast = input(false);
    readonly disableFuture = input(false);
    readonly errorMessage = input<string | null>(null);

    protected readonly uid = `dp-${nextUid++}`;
    protected readonly weekdayLabels = WEEKDAY_LABELS;
    protected readonly open = signal(false);
    protected readonly viewMonth = signal(startOfCurrentMonth());
    protected readonly focusedDate = signal<Date>(new Date());
    protected readonly hoverDate = signal<Date | null>(null);

    protected readonly months = computed(() => {
        const base = this.viewMonth();
        return Array.from({ length: this.monthsToShow() }, (_, i) => {
            const monthRef = addMonths(base, i);
            return {
                label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(monthRef),
                weeks: buildMonthGrid(monthRef)
            };
        });
    });

    protected readonly range = computed<DateRangeValue>(() => {
        const v = this.value();
        return this.rangeMode() && v && typeof v === 'object' ? (v as DateRangeValue) : EMPTY_RANGE;
    });

    protected readonly singleDate = computed<Date | null>(() => {
        const v = this.value();
        return !this.rangeMode() && typeof v === 'string' ? parseIsoDate(v) : null;
    });

    protected readonly displayValue = computed(() => {
        if (!this.rangeMode()) {
            return formatDate(this.singleDate());
        }
        const r = this.range();
        if (!r.start) {
            return '';
        }
        return r.end
            ? `${formatDate(parseIsoDate(r.start))} - ${formatDate(parseIsoDate(r.end))}`
            : `${formatDate(parseIsoDate(r.start))} - ...`;
    });

    toggle(): void {
        if (this.disabled()) {
            return;
        }
        this.open.update((v) => !v);
        if (this.open()) {
            const ref = this.rangeMode() ? (parseIsoDate(this.range().start) ?? new Date()) : (this.singleDate() ?? new Date());
            this.viewMonth.set(startOfCurrentMonth(ref));
            this.focusedDate.set(ref);
        } else {
            this.markTouched();
        }
    }

    close(): void {
        if (!this.open()) {
            return;
        }
        this.open.set(false);
        this.markTouched();
    }

    prevMonth(): void {
        this.viewMonth.update((m) => addMonths(m, -1));
    }

    nextMonth(): void {
        this.viewMonth.update((m) => addMonths(m, 1));
    }

    isDisabled(date: Date): boolean {
        const today = stripTime(new Date());
        if (this.disablePast() && date < today) {
            return true;
        }
        if (this.disableFuture() && date > today) {
            return true;
        }
        return false;
    }

    isSelected(date: Date): boolean {
        return !this.rangeMode() && isSameDay(date, this.singleDate());
    }

    isFocused(date: Date): boolean {
        return isSameDay(date, this.focusedDate());
    }

    isToday(date: Date): boolean {
        return isSameDay(date, new Date());
    }

    isStart(date: Date): boolean {
        return this.rangeMode() && isSameDay(date, parseIsoDate(this.range().start));
    }

    isEnd(date: Date): boolean {
        return this.rangeMode() && isSameDay(date, parseIsoDate(this.range().end));
    }

    isInRange(date: Date): boolean {
        if (!this.rangeMode()) {
            return false;
        }
        const r = this.range();
        const start = parseIsoDate(r.start);
        const end = parseIsoDate(r.end);
        if (start && end) {
            return isWithinRange(date, start, end);
        }
        // Preview the range while the user is choosing the end date.
        if (start && !end && this.hoverDate()) {
            const hover = this.hoverDate()!;
            return isAfter(hover, start) ? isWithinRange(date, start, hover) : isWithinRange(date, hover, start);
        }
        return false;
    }

    onDayHover(date: Date | null): void {
        this.hoverDate.set(date);
    }

    selectDate(date: Date): void {
        if (this.isDisabled(date)) {
            return;
        }
        const iso = toIsoDate(date);

        if (!this.rangeMode()) {
            this.emitValue(iso);
            this.close();
            return;
        }

        const current = this.range();
        const currentStart = parseIsoDate(current.start);

        if (!current.start || (current.start && current.end)) {
            this.emitValue({ start: iso, end: null });
            return;
        }

        if (isBefore(date, currentStart!)) {
            this.emitValue({ start: iso, end: current.start });
        } else {
            this.emitValue({ start: current.start, end: iso });
        }
        this.close();
    }

    onGridKeydown(event: KeyboardEvent): void {
        const deltas: Record<string, number> = {
            ArrowRight: 1,
            ArrowLeft: -1,
            ArrowDown: 7,
            ArrowUp: -7
        };
        if (event.key in deltas) {
            event.preventDefault();
            const next = addDays(this.focusedDate(), deltas[event.key]);
            this.focusedDate.set(next);
            if (next.getMonth() !== this.viewMonth().getMonth() || next.getFullYear() !== this.viewMonth().getFullYear()) {
                this.viewMonth.set(startOfCurrentMonth(next));
            }
            return;
        }
        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.selectDate(this.focusedDate());
                break;
            case 'Escape':
                event.preventDefault();
                this.close();
                break;
            case 'PageUp':
                event.preventDefault();
                this.prevMonth();
                break;
            case 'PageDown':
                event.preventDefault();
                this.nextMonth();
                break;
        }
    }
}

function startOfCurrentMonth(ref: Date = new Date()): Date {
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
}

function stripTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
