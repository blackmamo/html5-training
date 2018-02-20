import { Component, OnInit } from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {Observable} from 'rxjs/Observable';
import {OrderStatus} from 'bitcoin-common';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';

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

  @select(['orderBook', 'orders', 'orders']) orders$raw: Observable<Array<OrderStatus>>;
  orders$ = this.orders$raw.map(items => Object.values(items).sort((a,b) =>{
    return new Date(a.updated).getTime() - new Date(b.updated).getTime()}));

  filter$ = this.route.queryParamMap.map((map: ParamMap) => {
    let f = map.get('filter');
    return f === "true" ? true : false;
  });

  objectValues = Object.values;
}
