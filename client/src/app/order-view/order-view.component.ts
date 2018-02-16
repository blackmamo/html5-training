import { Component, OnInit } from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {Observable} from 'rxjs/Observable';
import {OrderStatus} from 'bitcoin-common';

@Component({
  selector: 'app-order-view',
  templateUrl: './order-view.component.html',
  styleUrls: ['./order-view.component.scss']
})
export class OrderViewComponent implements OnInit {

  constructor(private ngRedux: NgRedux<Object>) {}

  ngOnInit() {
  }

  @select(['orderBook', 'orders', 'orders']) orders$: Observable<Array<OrderStatus>>;

  values(foo) {
    return Object.values(foo);
  }
}
