import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { buildCsv } from './csv-export';

export interface ExportColumn<T> {
    key: keyof T & string;
    header: string;
    /** Formats a cell's raw value for export — defaults to `String(value)` (empty string for null/undefined). */
    format?: (value: T[keyof T], row: T) => string;
}

/**
 * CSV-only for now — takes plain `rows`/`columns`, not a DataTableComponent
 * reference, so it works with any tabular data source. A PDF format can be
 * added later behind its own strategy without touching this component's contract.
 */
@Component({
    selector: 'app-export-button',
    standalone: true,
    imports: [ButtonComponent],
    templateUrl: './export-button.component.html',
    styleUrl: './export-button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportButtonComponent<T> {
    readonly rows = input.required<T[]>();
    readonly columns = input.required<ExportColumn<T>[]>();
    readonly filename = input('export');
    readonly label = input('Export');

    runExport(): void {
        const rows = this.rows();
        if (!rows.length) {
            return;
        }
        const csv = buildCsv(rows, this.columns());
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.filename()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }
}
