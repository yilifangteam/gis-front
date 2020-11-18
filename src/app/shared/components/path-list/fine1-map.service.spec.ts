import { TestBed } from '@angular/core/testing';

import { Fine1MapService } from './fine1-map.service';

describe('Fine1MapService', () => {
  let service: Fine1MapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Fine1MapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
