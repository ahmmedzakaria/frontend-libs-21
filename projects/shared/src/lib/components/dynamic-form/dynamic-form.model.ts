import { CardOption } from '../card-selector/card-selector.component';
import { DropdownOption } from '../dropdown/dropdown.component';
import { RadioOption } from '../radio-group/radio-group.component';
import { SmartDropdownLoader, SmartDropdownMode } from '../smart-dropdown/smart-dropdown.component';

// `CardOption`/`DropdownOption`/`RadioOption`/`SmartDropdownMode`/`SmartDropdownLoader`
// are not re-exported here — they're already public via their own component files
// (also exported from this package's public-api.ts), and re-exporting them again
// from this module would create an ambiguous duplicate export in the barrel.

export type TextFieldType = 'text' | 'email' | 'tel' | 'number';

interface BaseFieldConfig {
    /** FormControl name — also the key `initialValue`/`submitted` read/write under. */
    key: string;
    label?: string;
    required?: boolean;
    /** Grid columns this field spans, relative to `DynamicFormComponent`'s `columns` input. */
    colSpan?: number;
}

export interface TextFieldConfig extends BaseFieldConfig {
    type: TextFieldType;
    placeholder?: string;
    /** Icon registry key, e.g. 'user', 'phone'. */
    icon?: string | null;
    minLength?: number;
    maxLength?: number;
    onlyNumber?: boolean;
    noSpecialChars?: boolean;
    readonly?: boolean;
}

export interface TextareaFieldConfig extends BaseFieldConfig {
    type: 'textarea';
    placeholder?: string;
    rows?: number;
    maxLength?: number;
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
    type: 'checkbox';
    indeterminate?: boolean;
}

export interface RadioFieldConfig extends BaseFieldConfig {
    type: 'radio';
    options: RadioOption<unknown>[];
    layout?: 'row' | 'column';
}

export interface DropdownFieldConfig extends BaseFieldConfig {
    type: 'dropdown';
    options: DropdownOption<unknown>[];
    placeholder?: string;
}

export interface SmartDropdownFieldConfig extends BaseFieldConfig {
    type: 'smart-dropdown';
    mode?: SmartDropdownMode;
    /** Required for `mode: 'static'` (the default). */
    options?: DropdownOption<unknown>[];
    /** Required for `mode: 'api-simple' | 'api-scroll'`. */
    loadOptions?: SmartDropdownLoader<unknown>;
    placeholder?: string;
    searchable?: boolean;
}

export interface DateFieldConfig extends BaseFieldConfig {
    type: 'date';
    placeholder?: string;
    disablePast?: boolean;
    disableFuture?: boolean;
}

export interface DateRangeFieldConfig extends BaseFieldConfig {
    type: 'date-range';
    monthsToShow?: number;
    disablePast?: boolean;
    disableFuture?: boolean;
}

export interface CardSelectorFieldConfig extends BaseFieldConfig {
    type: 'card-selector';
    options: CardOption<unknown>[];
    columns?: number;
}

export interface FileUploadFieldConfig extends BaseFieldConfig {
    type: 'file-upload';
    accept?: string;
    multiple?: boolean;
    maxSizeMB?: number;
    hint?: string;
}

export interface PasswordFieldConfig extends BaseFieldConfig {
    type: 'password';
    confirmLabel?: string;
    showStrength?: boolean;
}

export type FieldConfig =
    | TextFieldConfig
    | TextareaFieldConfig
    | CheckboxFieldConfig
    | RadioFieldConfig
    | DropdownFieldConfig
    | SmartDropdownFieldConfig
    | DateFieldConfig
    | DateRangeFieldConfig
    | CardSelectorFieldConfig
    | FileUploadFieldConfig
    | PasswordFieldConfig;
