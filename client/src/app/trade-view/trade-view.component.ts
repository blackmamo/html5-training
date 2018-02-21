import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {NgRedux, select} from '@angular-redux/store';
import {OrderStatus, Fill} from 'bitcoin-common';
import {TraderService} from '../trader.service';
import * as R from "ramda";
import {ActivatedRoute, ParamMap} from '@angular/router';

@Component({
  selector: 'app-trade-view',
  templateUrl: './trade-view.component.html',
  styleUrls: ['./trade-view.component.scss']
})
export class TradeViewComponent implements OnInit {

  constructor(private ngRedux: NgRedux<Object>,
              private traderService: TraderService,
              private route: ActivatedRoute) {}

  ngOnInit() {
  }

  @select(['orderBook', 'trades']) trades$raw: Observable<Array<OrderStatus>>;
  trader$ = this.route.paramMap.map((map: ParamMap) => {
    return map.get('trader');
  });

  trades$ = this.trades$raw.map((trades)=>{
    return R.uniqBy((t: Fill) => {
      return t.tradeId;
    })(trades);
  });
  objectValues = Object.values;
}
