import { HttpInterceptorFn } from '@angular/common/http';

const LOCALE_STORAGE_KEY = 'nexacore.locale';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
    const locale = localStorage.getItem(LOCALE_STORAGE_KEY) || navigator.language || 'en';

    return next(req.clone({
        setHeaders: {
            'Accept-Language': locale
        }
    }));
};
