import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { BaseValueAccessor } from '../base/base-value-accessor';
import { DropdownOption } from '../dropdown/dropdown.component';
import { StaticDropdownComponent } from '../static-dropdown/static-dropdown.component';
import { ApiSimpleDropdownComponent } from '../api-simple-dropdown/api-simple-dropdown.component';
import { ApiScrollDropdownComponent } from '../api-scroll-dropdown/api-scroll-dropdown.component';
import { DropdownApiConfig } from '../../dropdown-config/dropdown-api-config.model';
import { DropdownConfigService } from '../../dropdown-config/dropdown-config.service';
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
 *
 * Also the configuration-specific abstraction point: pass a declarative
 * `dropdownConfig` (a `DropdownApiConfig` registry entry) instead of hand
 * -wiring `mode`/`options`/`loadOptions`/`compareWith`/`displayWith`/
 * `placeholder` yourself — this component resolves all of that from the
 * config via `DropdownConfigService`, the same resolution `.field()` does
 * for `DynamicFormComponent`, just without needing a `FieldConfig` wrapper.
 * The raw inputs remain the source of truth whenever `dropdownConfig` isn't
 * supplied, so direct callers (e.g. `component-demo`) are unaffected.
 *
 * Edit-mode support lives here too: pass `initValue` (a raw saved id) and
 * this component resolves it into the control's starting value itself via
 * `DropdownConfigService.resolveInitialValue()`, then pushes it into the
 * form as if picked — the declarative equivalent of a host page calling
 * `resolveInitialValue()` and threading the result through `initialValue`
 * before the form mounts. Resolved at most once per component instance
 * (see `initialValueResolved`) so it survives `dropdownConfig`/`initValue`
 * being fresh object references on every parent recompute.
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
    private readonly dropdownConfigService = inject(DropdownConfigService);

    /** Declarative source of truth — when supplied, `mode`/`options`/
     * `loadOptions`/`compareWith`/`displayWith`/`placeholder` below are
     * resolved from it instead of read directly (see the `resolved*`
     * computeds). */
    readonly dropdownConfig = input<DropdownApiConfig | null>(null);

    /** Raw saved id to resolve into this control's starting value via
     * `dropdownConfig`'s `lookup` — see the class doc. Ignored without a
     * `dropdownConfig`. */
    readonly initValue = input<unknown>(null);

    readonly mode = input<SmartDropdownMode>('static');
    /** Options for 'static' mode. */
    readonly options = input<DropdownOption<T>[]>([]);
    /** Fetch function for 'api-simple'/'api-scroll' modes. */
    readonly loadOptions = input<SmartDropdownLoader<T> | null>(null);
    readonly label = input('');
    /** `null` (the default) defers to `dropdownConfig`'s own `placeholder`,
     * then a hardcoded fallback — see `resolvedPlaceholder`. An explicit
     * value here always wins, e.g. two fields sharing one `dropdownConfig`
     * but needing different placeholder text. */
    readonly placeholder = input<string | null>(null);
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

    protected readonly resolvedMode = computed<SmartDropdownMode>(() => this.dropdownConfig()?.dropdownMode ?? this.mode());

    protected readonly resolvedOptions = computed<DropdownOption<T>[]>(() => {
        const config = this.dropdownConfig();
        if (config?.dropdownMode === 'static') {
            return this.dropdownConfigService.resolveOptions(config) as DropdownOption<T>[];
        }
        return this.options();
    });

    protected readonly resolvedLoadOptions = computed<SmartDropdownLoader<T> | null>(() => {
        const config = this.dropdownConfig();
        if (config && config.dropdownMode !== 'static') {
            return this.dropdownConfigService.resolveLoader(config) as SmartDropdownLoader<T>;
        }
        return this.loadOptions();
    });

    protected readonly resolvedCompareWith = computed<(a: T, b: T) => boolean>(() => {
        const config = this.dropdownConfig();
        return config ? (this.dropdownConfigService.resolveCompareWith(config.option) as (a: T, b: T) => boolean) : this.compareWith();
    });

    protected readonly resolvedDisplayWith = computed<((value: T) => string) | null>(() => {
        const config = this.dropdownConfig();
        return config ? (this.dropdownConfigService.resolveDisplayWith(config.option) as (value: T) => string) : this.displayWith();
    });

    protected readonly resolvedPlaceholder = computed(() => this.placeholder() ?? this.dropdownConfig()?.placeholder ?? 'Select...');

    /** Guards `initValue` resolution to at most once per instance — `dropdownConfig`/
     * `initValue` are commonly fresh object references on every parent recompute
     * (e.g. a wizard step rebuilding its whole `fields` array), so gating on
     * "already attempted" (set synchronously, before the HTTP call even
     * resolves) rather than on `value()` avoids re-fetching or fighting a
     * value the user has since changed. */
    private readonly initialValueResolved = signal(false);

    constructor() {
        super();
        effect(() => {
            const config = this.dropdownConfig();
            const rawId = this.initValue();
            if (!config || rawId === null || rawId === undefined || rawId === '' || this.initialValueResolved()) {
                return;
            }
            this.initialValueResolved.set(true);
            this.dropdownConfigService.resolveInitialValue(config, rawId).subscribe((resolved) => {
                if (resolved !== null) {
                    this.emitValue(resolved as T);
                }
            });
        });
    }

    validate(): ValidationErrors | null {
        return this.required() && this.value() === null ? { required: true } : null;
    }
}
