import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';

export type SupportedLocale = 'en' | 'bn';

const STORAGE_KEY = 'nexacore.locale';

@Injectable({ providedIn: 'root' })
export class I18nService {
    readonly supportedLocales: SupportedLocale[] = ['en', 'bn'];
    readonly locale = signal<SupportedLocale>(this.resolveInitialLocale());

    private translations: Record<string, string> = {};

    constructor(
        private readonly http: HttpClient,
        @Inject(DOCUMENT) private readonly document: Document
    ) {}

    async initialize(): Promise<void> {
        await this.use(this.locale());
    }

    async use(locale: string): Promise<void> {
        const supportedLocale = this.toSupportedLocale(locale);
        const [commonTranslations, appTranslations] = await Promise.all([
            this.loadTranslations(`/assets/i18n/common/${supportedLocale}.json`),
            this.loadTranslations(`/assets/i18n/${supportedLocale}.json`)
        ]);

        this.translations = {
            ...commonTranslations,
            ...appTranslations
        };
        this.locale.set(supportedLocale);
        localStorage.setItem(STORAGE_KEY, supportedLocale);
        this.document.documentElement.lang = supportedLocale;
    }

    translate(key: string, fallback?: string): string {
        return this.translations[key] ?? fallback ?? key;
    }

    private resolveInitialLocale(): SupportedLocale {
        const storedLocale = localStorage.getItem(STORAGE_KEY);
        if (storedLocale) {
            return this.toSupportedLocale(storedLocale);
        }

        return this.toSupportedLocale(navigator.language);
    }

    private toSupportedLocale(locale: string): SupportedLocale {
        const language = locale.toLowerCase().split('-')[0] as SupportedLocale;
        return this.supportedLocales.includes(language) ? language : 'en';
    }

    private loadTranslations(path: string): Promise<Record<string, string>> {
        return firstValueFrom(
            this.http.get<Record<string, string>>(path).pipe(
                catchError(() => of({}))
            )
        );
    }
}
