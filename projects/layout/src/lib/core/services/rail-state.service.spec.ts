import { describe, expect, it } from 'vitest';
import { RailStateService } from './rail-state.service';

describe('RailStateService', () => {
  it('starts expanded (detail mode) with no module open', () => {
    const service = new RailStateService();
    expect(service.expanded()).toBe(true);
    expect(service.openModuleId()).toBeNull();
  });

  it('toggle() flips rail width state', () => {
    const service = new RailStateService();
    service.toggle();
    expect(service.expanded()).toBe(false);
    service.toggle();
    expect(service.expanded()).toBe(true);
  });

  it('toggleModule() opens a module, and re-toggling the same id closes it', () => {
    const service = new RailStateService();
    service.toggleModule('customers');
    expect(service.openModuleId()).toBe('customers');
    service.toggleModule('customers');
    expect(service.openModuleId()).toBeNull();
  });

  it('toggleModule() with a different id switches the open module (accordion behavior)', () => {
    const service = new RailStateService();
    service.toggleModule('customers');
    service.toggleModule('kyc');
    expect(service.openModuleId()).toBe('kyc');
  });
});
