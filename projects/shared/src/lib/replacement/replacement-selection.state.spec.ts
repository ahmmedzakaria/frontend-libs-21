import { describe, expect, it } from 'vitest';
import { ReplacementSelectionState } from './replacement-selection.state';

interface Item { id: number; name: string; }

describe('ReplacementSelectionState', () => {
    const items: Item[] = [{ id: 1, name: 'One' }, { id: 2, name: 'Two' }];

    it('never enables save after a failed authoritative read', () => {
        const state = new ReplacementSelectionState<Item, number>({ keyOf: item => item.id });
        state.beginLoad();
        state.loadFailed('Unavailable');
        state.setSelection([]);
        expect(state.status()).toBe('failed');
        expect(state.canSave()).toBe(false);
        expect(state.beginSave()).toBe(false);
    });

    it('reports additions and removals and commits a successful replacement', () => {
        const state = new ReplacementSelectionState<Item, number>({ keyOf: item => item.id });
        state.loadSucceeded(items);
        const third = { id: 3, name: 'Three' };
        state.setSelection([items[1], third]);
        expect(state.summary().additions).toEqual([third]);
        expect(state.summary().removals).toEqual([items[0]]);
        expect(state.canSave()).toBe(true);
        expect(state.beginSave()).toBe(true);
        expect(state.canSave()).toBe(false);
        state.saveSucceeded();
        expect(state.dirty()).toBe(false);
    });

    it('retains an authoritative version only while its read remains valid', () => {
        const state = new ReplacementSelectionState<Item, number>({ keyOf: item => item.id });
        state.loadSucceeded(items, 'version-7');
        expect(state.version()).toBe('version-7');
        state.beginLoad();
        expect(state.version()).toBeNull();
        state.loadFailed('Unavailable');
        expect(state.canSave()).toBe(false);
    });

    it('supports ordered and set comparison semantics', () => {
        const setState = new ReplacementSelectionState<Item, number>({ keyOf: item => item.id, comparison: 'set' });
        const orderedState = new ReplacementSelectionState<Item, number>({ keyOf: item => item.id, comparison: 'ordered' });
        setState.loadSucceeded(items);
        orderedState.loadSucceeded(items);
        setState.setSelection([...items].reverse());
        orderedState.setSelection([...items].reverse());
        expect(setState.dirty()).toBe(false);
        expect(orderedState.dirty()).toBe(true);
    });
});
