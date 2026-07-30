import { Injectable } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class ValidationMessageService {
    /** Default validation messages */
    private defaultMessages: { [p: string]: Record<string, string>[string] | undefined } = {
        required: 'This field is required.',
        email: 'Please enter a valid email address.',
        minlength: 'The value is too short.',
        maxlength: 'The value is too long.',
        pattern: 'The value format is invalid.',
        passwordWeak: 'Password must include uppercase, lowercase, number & special character.'
    };

    /** Override or extend messages */
    setMessages(custom: Partial<Record<string, string>>) {
        this.defaultMessages = { ...this.defaultMessages, ...custom };
    }

    /** Resolve message for an error key */
    getMessage(errorKey: string, errorVal?: any): string {
        const msg = this.defaultMessages[errorKey];
        if (msg) return msg;

        if (errorKey === 'minlength')
            return `Minimum ${errorVal?.requiredLength} characters required.`;
        if (errorKey === 'maxlength')
            return `Maximum ${errorVal?.requiredLength} characters allowed.`;
        if (errorKey === 'pattern')
            return `Invalid format.`;
        return 'Invalid value.';
    }

    /** Build messages from error object */
    buildMessages(errors: ValidationErrors | null): string[] {
        if (!errors) return [];
        return Object.keys(errors).map(key => this.getMessage(key, errors[key]));
    }

    private messages: Record<string, string> = {
        required: '{label} is required',
    };

    get(key: string, label?: string): string {
        const msg = this.messages[key] || 'Invalid value';
        return msg.replace('{label}', label ?? '');
    }

    setCustomMessage(key: string, message: string) {
        this.messages[key] = message;
    }
}
