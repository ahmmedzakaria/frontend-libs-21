import { describe, expect, it } from 'vitest';
import { NavModeService } from './nav-mode.service';

describe('NavModeService', () => {
  it('defaults to grouped mode', () => {
    const service = new NavModeService();
    expect(service.mode()).toBe('grouped');
    expect(service.grouped()).toBe(true);
  });

  it('switches to flat mode on a recognized backend value', () => {
    const service = new NavModeService();
    service.applyNavigationMode('MODULE_LIST');
    expect(service.mode()).toBe('flat');
    expect(service.grouped()).toBe(false);
  });

  it('switches back to grouped mode on a recognized backend value', () => {
    const service = new NavModeService();
    service.applyNavigationMode('MODULE_LIST');
    service.applyNavigationMode('MODULE_GROUP_MEGA_PANEL');
    expect(service.mode()).toBe('grouped');
  });

  it('ignores unrecognized or absent values, keeping the current mode', () => {
    const service = new NavModeService();
    service.applyNavigationMode('MODULE_LIST');
    service.applyNavigationMode('SOMETHING_ELSE');
    expect(service.mode()).toBe('flat');
    service.applyNavigationMode(undefined);
    expect(service.mode()).toBe('flat');
  });
});
