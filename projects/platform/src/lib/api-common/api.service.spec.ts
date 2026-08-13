import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it } from 'vitest';
import { ApiService } from './api.service';
import { API_ENVIRONMENT, Environment } from './environment';

describe('ApiService', () => {
  it('falls back to the default Environment when nothing overrides API_ENVIRONMENT', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    const service = TestBed.inject(ApiService);
    const environment = TestBed.inject(API_ENVIRONMENT);

    expect(service).toBeTruthy();
    expect(environment).toBe(Environment);
  });

  it('uses an overridden API_ENVIRONMENT when a consumer provides one', () => {
    const override = { ...Environment, backendOrigin: '', apiBaseUrl: '/custom-api' };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_ENVIRONMENT, useValue: override }
      ]
    });

    const environment = TestBed.inject(API_ENVIRONMENT);
    expect(environment).toBe(override);
    expect(environment.apiBaseUrl).toBe('/custom-api');
  });

  it('enriches JSON requests without mutating caller-owned state', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const service = TestBed.inject(ApiService);
    const http = TestBed.inject(HttpTestingController);
    const body = { name: 'Alice' };

    service.post({ apiPath: 'people', actionType: 1 }, body).subscribe();
    const request = http.expectOne('http://localhost:9100/api/v1/people');
    expect(body).toEqual({ name: 'Alice' });
    expect(request.request.body).toEqual({ name: 'Alice', source: 'NEXACORE_APP' });
    request.flush({});
  });
});
