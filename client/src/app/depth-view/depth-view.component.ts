import {Component, OnInit} from '@angular/core';
import { select, NgRedux } from '@angular-redux/store';
import {Observable} from 'rxjs/Observable';
import "rxjs/add/observable/combineLatest";
import "rxjs/add/operator/map";
import {Level} from 'bitcoin-common';
import * as R from 'ramda';
import {NewOrderService} from '../new-order.service';

@Component({
  selector: 'app-depth-view',
  templateUrl: './depth-view.component.html',
  styleUrls: ['./depth-view.component.scss']
})
export class DepthViewComponent implements OnInit {

  constructor(private ngRedux: NgRedux<Object>,
              private newOrderService: NewOrderService) {}

  ngOnInit() {
  }

  @select(['depth', 'bids']) bids$: Observable<Array<Level>>;
  @select(['depth', 'offers']) offers$: Observable<Array<Level>>;

  depth$: Observable<Array<Array<Level>>> = Observable.combineLatest(this.bids$, this.offers$).map(x =>{
    let bids = x[0], offers = x[1];
    if (bids.length < offers.length) {
      bids = R.concat(bids, R.repeat(null, offers.length - bids.length));
    } else if (bids.length > offers.length){
      offers = R.concat(offers, R.repeat(null, bids.length - offers.length));
    }
    return R.zip(bids, offers);
  });

  setPriceSideAndQty(side, level){
    this.newOrderService.setSide(side);
    this.newOrderService.setPrice(level.price);
    this.newOrderService.setQty(level.qty);
  }

  setPriceAndSide(side, price){
    this.newOrderService.setSide(side);
    this.newOrderService.setPrice(price);
  }
}
