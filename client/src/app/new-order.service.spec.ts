import { TestBed, inject } from '@angular/core/testing';

import { NewOrderService } from './new-order.service';

describe('NewOrderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NewOrderService]
    });
  });

  it('should be created', inject([NewOrderService], (service: NewOrderService) => {
    expect(service).toBeTruthy();
  }));
});
