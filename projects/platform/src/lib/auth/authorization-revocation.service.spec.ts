import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { AuthorizationRevocationService } from './authorization-revocation.service';

describe('AuthorizationRevocationService', () => {
    it('closes page mutation state when a live decision is revoked', () => {
        TestBed.configureTestingModule({});
        const allowed = signal(true);
        const close = vi.fn();
        const registration = TestBed.inject(AuthorizationRevocationService).watch(allowed, close);
        TestBed.tick();
        allowed.set(false);
        TestBed.tick();
        expect(close).toHaveBeenCalledTimes(1);
        registration.destroy();
    });
});
