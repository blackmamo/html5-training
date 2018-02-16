import { TestBed, inject } from '@angular/core/testing';

import { Order.BookService } from './order.book.service';

describe('Order.BookService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Order.BookService]
    });
  });

  it('should be created', inject([Order.BookService], (service: Order.BookService) => {
    expect(service).toBeTruthy();
  }));
});
