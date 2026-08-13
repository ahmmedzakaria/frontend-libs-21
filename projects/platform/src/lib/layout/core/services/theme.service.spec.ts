import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
    document.body.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    TestBed.tick();
  });

  it('defaults to the Light theme', () => {
    expect(service.current().id).toBe('light');
    expect(document.body.classList.contains('dark')).toBe(false);
  });

  it('applies the dark structural class for dark-base themes', () => {
    service.select('navy');
    TestBed.tick();
    expect(service.current().id).toBe('navy');
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.body.dataset['theme']).toBe('navy');
  });

  it('does not apply the dark class for light-base accent themes', () => {
    service.select('purple');
    TestBed.tick();
    expect(document.body.classList.contains('dark')).toBe(false);
    expect(document.body.dataset['theme']).toBe('purple');
  });

  it('persists the selected theme to localStorage', () => {
    service.select('blue');
    TestBed.tick();
    expect(localStorage.getItem('sentinel-kyc.theme')).toBe('blue');
  });
});
