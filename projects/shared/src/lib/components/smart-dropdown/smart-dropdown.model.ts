import { Observable } from 'rxjs';
import { DropdownOption } from '../dropdown/dropdown.component';

export type SmartDropdownMode = 'static' | 'api-simple' | 'api-scroll';

export interface SmartDropdownPage<T> {
    items: DropdownOption<T>[];
    hasMore: boolean;
}

/**
 * Fetches one page of options for a query. The caller owns the actual HTTP
 * call (via ApiService, not a raw HttpClient here) and maps its own response
 * shape into DropdownOption<T> — the dropdown components have no domain
 * knowledge of what they're listing. `page` is always 0 for 'api-simple'
 * mode; 'api-scroll' calls again with an incrementing page as the user
 * scrolls near the bottom.
 */
export type SmartDropdownLoader<T> = (query: string, page: number) => Observable<SmartDropdownPage<T>>;
