import { describe, expect, it } from 'vitest';
import { NavModeService } from './nav-mode.service';

describe('NavModeService', () => {
  it('defaults to flat (ungrouped) mode', () => {
    const service = new NavModeService();
    expect(service.grouped()).toBe(false);
  });

  it('stays flat when enabledModules is empty', () => {
    const service = new NavModeService();
    service.setEnabledModules([]);
    expect(service.grouped()).toBe(false);
  });

  it('switches to grouped mode once enabledModules is populated', () => {
    const service = new NavModeService();
    service.setEnabledModules(['compliance']);
    expect(service.grouped()).toBe(true);
  });
});
