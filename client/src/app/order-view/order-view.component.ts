import { Component, OnInit } from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {Observable} from 'rxjs/Observable';
import  'rxjs/add/operator/combineLatest';
import {OrderStatus} from 'bitcoin-common';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import * as R from "ramda";

@Component({
  selector: 'app-order-view',
  templateUrl: './order-view.component.html',
  styleUrls: ['./order-view.component.scss']
})
export class OrderViewComponent implements OnInit {

  constructor(private ngRedux: NgRedux<Object>,
              private route: ActivatedRoute,
              private router: Router) {}

  ngOnInit() {
  }

  filter$ = this.route.queryParamMap.map((map: ParamMap) => {
    let f = map.get('filter');
    return f === "true" ? true : false;
  });

  @select(['orderBook', 'orders', 'orders']) private orders$raw: Observable<Array<OrderStatus>>;
  private orders$sorted = this.orders$raw.map(R.compose(
    R.sort((a,b) => {
      return new Date(a.updated).getTime() - new Date(b.updated).getTime();
    }),
    Object.values));
  orders$ = this.orders$sorted.combineLatest(this.filter$,
    (orders, filter) => {
      return R.filter(
        order => { return order.live || !filter;},
        orders)}
  );
  objectValues = Object.values;
}
