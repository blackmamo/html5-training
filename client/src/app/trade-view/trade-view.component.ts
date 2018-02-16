import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {NgRedux, select} from '@angular-redux/store';
import {OrderStatus} from 'bitcoin-common';

@Component({
  selector: 'app-trade-view',
  templateUrl: './trade-view.component.html',
  styleUrls: ['./trade-view.component.scss']
})
export class TradeViewComponent implements OnInit {

  constructor(private ngRedux: NgRedux<Object>) {}

  ngOnInit() {
  }

  @select(['orderBook', 'trades']) trades$: Observable<Array<OrderStatus>>;

  values(foo) {
    return Object.values(foo);
  }
}
