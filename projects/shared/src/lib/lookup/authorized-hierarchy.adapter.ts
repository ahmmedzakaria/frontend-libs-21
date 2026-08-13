import { Observable } from 'rxjs';

export interface AuthorizedLookupItem<K = number> {
    key: K;
    label: string;
    disabled?: boolean;
}

export interface AuthorizedHierarchyLevel<K = number> {
    kind: string;
    parentKey?: K;
}

/** UI-only adapter: applications supply authorized loaders and retain endpoint ownership. */
export interface AuthorizedHierarchyAdapter<K = number> {
    load(level: AuthorizedHierarchyLevel<K>): Observable<readonly AuthorizedLookupItem<K>[]>;
    canLoad(level: AuthorizedHierarchyLevel<K>): boolean;
}
