import { ExportColumn } from './export-button.component';

/** Pure CSV-building functions — no Angular/DOM dependency, so they're unit-testable without TestBed. */

export function formatCell<T>(row: T, column: ExportColumn<T>): string {
    const value = row[column.key];
    return column.format ? column.format(value, row) : (value ?? '') === '' ? '' : String(value);
}

/** RFC 4180 quoting: wrap in quotes (doubling any embedded quotes) only when the value actually needs it. */
export function csvEscape(value: string): string {
    return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
    const header = columns.map((c) => csvEscape(c.header)).join(',');
    const lines = rows.map((row) => columns.map((c) => csvEscape(formatCell(row, c))).join(','));
    return [header, ...lines].join('\r\n');
}
