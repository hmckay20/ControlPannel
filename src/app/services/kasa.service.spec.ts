import { TestBed } from '@angular/core/testing';

import { KasaService } from './kasa.service';

describe('KasaService', () => {
  let service: KasaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KasaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
