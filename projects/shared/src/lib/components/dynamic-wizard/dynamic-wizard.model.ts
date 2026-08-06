import { FieldConfig } from '../dynamic-form/dynamic-form.model';

export interface DynamicWizardStepConfig {
    /** Also used as the `track` key and to identify the step in `stepForms`. */
    key: string;
    label: string;
    fields: FieldConfig[];
    initialValue?: Record<string, unknown>;
    disabled?: boolean;
}
