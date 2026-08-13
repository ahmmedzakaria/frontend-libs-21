import { Injectable, computed, inject, signal } from '@angular/core';
import { QuickNavItem, QuickNavService } from './quick-nav.service';

const STORAGE_KEY = 'nexacore.layout.favorite-nav';

/**
 * Favorited navigation shortcuts — a set of QuickNavItem path keys persisted
 * to localStorage, ported from sentinel-kyc-angular-cld's FavoriteNavService.
 */
@Injectable({ providedIn: 'root' })
export class FavoriteNavService {
    private readonly quickNav = inject(QuickNavService);

    private readonly pathKeys = signal<Set<string>>(this.readInitial());

    readonly favorites = computed<QuickNavItem[]>(() =>
        Array.from(this.pathKeys())
            .map((key) => this.quickNav.getByPathKey(key))
            .filter((item): item is QuickNavItem => !!item)
    );

    readonly count = computed(() => this.pathKeys().size);

    isFavorite(pathKey: string): boolean {
        return this.pathKeys().has(pathKey);
    }

    toggle(pathKey: string): void {
        if (!this.quickNav.hasPathKey(pathKey)) {
            return;
        }
        this.pathKeys.update((set) => {
            const next = new Set(set);
            if (next.has(pathKey)) {
                next.delete(pathKey);
            } else {
                next.add(pathKey);
            }
            return next;
        });
        this.persist();
    }

    private persist(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.pathKeys())));
    }

    /**
     * Unlike sentinel's version, this does NOT drop keys that don't resolve
     * against `quickNav` yet — this service is `providedIn: 'root'` and can
     * construct before the backend nav tree has loaded, so filtering here
     * would permanently wipe valid saved favorites on every page refresh.
     * `favorites` above already filters reactively once the tree loads.
     */
    private readInitial(): Set<string> {
        try {
            const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return new Set(Array.isArray(saved) ? saved.filter((key): key is string => typeof key === 'string') : []);
        } catch {
            return new Set();
        }
    }
}
