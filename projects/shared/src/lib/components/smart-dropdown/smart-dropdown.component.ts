import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { BaseValueAccessor } from '../base/base-value-accessor';
import { DropdownOption } from '../dropdown/dropdown.component';
import { StaticDropdownComponent } from '../static-dropdown/static-dropdown.component';
import { ApiSimpleDropdownComponent } from '../api-simple-dropdown/api-simple-dropdown.component';
import { ApiScrollDropdownComponent } from '../api-scroll-dropdown/api-scroll-dropdown.component';
import { SmartDropdownLoader, SmartDropdownMode } from './smart-dropdown.model';

/**
 * Facade over the three `SmartDropdownMode`-specific dropdown components
 * (`app-static-dropdown` / `app-api-simple-dropdown` / `app-api-scroll-dropdown`)
 * — this is the only piece of the four that implements `ControlValueAccessor`
 * and `Validator`; it owns forms integration for all three modes and simply
 * renders whichever concrete component matches `mode()`, forwarding value
 * changes and touched state back through itself. Kept as the single stable
 * public API (`app-smart-dropdown`, `[formControlName]`) so existing callers
 * (`DynamicFormComponent`, direct template usage) don't need to know which
 * mode they're getting.
 */
@Component({
    selector: 'app-smart-dropdown',
    standalone: true,
    imports: [StaticDropdownComponent, ApiSimpleDropdownComponent, ApiScrollDropdownComponent],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: SmartDropdownComponent, multi: true },
        { provide: NG_VALIDATORS, useExisting: SmartDropdownComponent, multi: true }
    ],
    templateUrl: './smart-dropdown.component.html',
    styleUrl: './smart-dropdown.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmartDropdownComponent<T = string> extends BaseValueAccessor<T> implements Validator {
    readonly mode = input<SmartDropdownMode>('static');
    /** Options for 'static' mode. */
    readonly options = input<DropdownOption<T>[]>([]);
    /** Fetch function for 'api-simple'/'api-scroll' modes. */
    readonly loadOptions = input<SmartDropdownLoader<T> | null>(null);
    readonly label = input('');
    readonly placeholder = input('Select...');
    readonly searchable = input(true);
    readonly searchPlaceholder = input('Search...');
    readonly debounceMs = input(400);
    readonly required = input(false);
    readonly errorMessage = input<string | null>(null);
    readonly compareWith = input<(a: T, b: T) => boolean>((a, b) => a === b);
    /** Known label for the current value at load time (async modes; e.g. editing a record) — avoids a fetch just to display it. */
    readonly initialOption = input<DropdownOption<T> | null>(null);
    /** Last-resort label fallback for a value written onto the control from
     * outside `selectOption()`/`initialOption` — e.g. a value copied in from
     * another control programmatically. */
    readonly displayWith = input<((value: T) => string) | null>(null);

    validate(): ValidationErrors | null {
        return this.required() && this.value() === null ? { required: true } : null;
    }
}
