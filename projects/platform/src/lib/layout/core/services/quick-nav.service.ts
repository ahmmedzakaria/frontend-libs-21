import { Injectable, computed, inject } from '@angular/core';
import { NavTreeItem } from '../models/layout-config.model';
import { LayoutConfigService } from './layout-config.service';

export interface QuickNavItem {
    code: string;
    path: number[];
    pathKey: string;
    label: string;
    /** Full label chain — [Module Group, Module, Category, Feature Group, Feature]. */
    labels: string[];
}

const TCODE_MIN_SEARCH_CHARS = 2;

function normalizeCode(code: string): string {
    return String(code || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

function codePart(label: string, maxLength: number): string {
    const words = String(label || '').match(/[A-Za-z0-9]+/g) || [];
    const value = words.length > 1 ? words.map((word) => word[0]).join('') : words[0] || 'NAV';
    return value.toUpperCase().slice(0, maxLength);
}

/** ModuleGroup-Module-Feature, with a numeric suffix appended on collision — only used
 * when a feature leaf has no backend-assigned `tCode` yet (e.g. stale seed data). */
function makeFallbackCode(labels: string[], usedCodes: Set<string>): string {
    const moduleGroup = codePart(labels[0], 3);
    const module = codePart(labels[1], 3);
    const feature = codePart(labels[4], 4);
    const base = `${moduleGroup}-${module}-${feature}`;
    let code = base;
    let index = 2;
    while (usedCodes.has(normalizeCode(code))) {
        code = base + index;
        index += 1;
    }
    return code;
}

function buildQuickNavItems(tree: readonly NavTreeItem[]): QuickNavItem[] {
    const usedCodes = new Set<string>();
    const items: QuickNavItem[] = [];
    tree.forEach((groupNode, groupIndex) => {
        (groupNode.children ?? []).forEach((moduleNode, moduleIndex) => {
            (moduleNode.children ?? []).forEach((categoryNode, categoryIndex) => {
                (categoryNode.children ?? []).forEach((featureGroupNode, featureGroupIndex) => {
                    (featureGroupNode.children ?? []).forEach((featureNode, featureIndex) => {
                        const path = [groupIndex, moduleIndex, categoryIndex, featureGroupIndex, featureIndex];
                        const labels = [groupNode.label, moduleNode.label, categoryNode.label, featureGroupNode.label, featureNode.label];
                        const code = featureNode.tCode?.trim() || makeFallbackCode(labels, usedCodes);
                        usedCodes.add(normalizeCode(code));
                        items.push({ code, path, pathKey: path.join('.'), label: featureNode.label, labels });
                    });
                });
            });
        });
    });
    return items;
}

/**
 * Flat, code-addressable index over every feature leaf in the nav tree —
 * ported from sentinel-kyc-angular-cld's QuickNavService. Unlike that app
 * (which derives every T-code client-side via makeTCode()), this codebase's
 * backend assigns `NavTreeItem.tCode` per feature on save (see V28
 * migration), so a real item's code is read from there — the generator here
 * only covers the fallback case of a feature leaf saved before that.
 */
@Injectable({ providedIn: 'root' })
export class QuickNavService {
    private readonly layoutConfig = inject(LayoutConfigService);

    readonly items = computed<readonly QuickNavItem[]>(() => buildQuickNavItems(this.layoutConfig.navTree()));

    private readonly byCode = computed(() => new Map(this.items().map((item) => [normalizeCode(item.code), item])));
    private readonly byPathKey = computed(() => new Map(this.items().map((item) => [item.pathKey, item])));

    /** Exact code match first, then falls back to a label/path text match — mirrors findTCodeItem(). */
    findByCode(value: string): QuickNavItem | undefined {
        const normalized = normalizeCode(value);
        const text = String(value || '').trim().toLowerCase();
        if (!text) {
            return undefined;
        }
        return (
            this.byCode().get(normalized) ??
            this.items().find(
                (item) =>
                    normalizeCode(item.code).includes(normalized) ||
                    item.label.toLowerCase().includes(text) ||
                    item.labels.join(' ').toLowerCase().includes(text)
            )
        );
    }

    getByPathKey(pathKey: string): QuickNavItem | undefined {
        return this.byPathKey().get(pathKey);
    }

    hasPathKey(pathKey: string): boolean {
        return this.byPathKey().has(pathKey);
    }

    /** Matches for the T-code datalist — mirrors renderTCodeList(). */
    search(query: string, limit = 20): QuickNavItem[] {
        const value = String(query || '').trim();
        const normalized = normalizeCode(value);
        if (normalized.length < TCODE_MIN_SEARCH_CHARS) {
            return [];
        }
        const text = value.toLowerCase();
        return this.items()
            .filter(
                (item) =>
                    normalizeCode(item.code).includes(normalized) ||
                    item.label.toLowerCase().includes(text) ||
                    item.labels.join(' ').toLowerCase().includes(text)
            )
            .slice(0, limit);
    }
}
