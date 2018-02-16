import {Component, OnInit} from '@angular/core';
import { Side, OrderRequest} from 'bitcoin-common';
import {TraderService} from '../trader.service';
import {NgRedux, select} from '@angular-redux/store';
import {Observable} from 'rxjs/Observable';
import {NewOrderActions} from '../new-order.service';

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss'],
  host: {'(window:keydown)': 'keypress($event)'},
})
export class NewOrderComponent implements OnInit {
  sides = [Side[Side.Bid], Side[Side.Offer]];

  @select(['newOrder', 'side']) side$: Observable<Object>;
  @select(['newOrder', 'price']) price$: Observable<Object>;
  @select(['newOrder', 'qty']) qty$: Observable<Object>;

  constructor(private ngRedux: NgRedux<Object>, private traderService: TraderService) {}

  ngOnInit() {
  }

  keypress(event){
    let mult = event.shiftKey ? 100 : 1;

    switch(event.key) {
      case "Space":
        this.setSide((this.ngRedux.getState()['newOrder'].side === Side[Side.Bid]) ? Side[Side.Offer]: Side[Side.Bid]);
        break;
      case "ArrowUp":
        this.setPrice(this.ngRedux.getState()['newOrder'].price + (0.01 * mult));
        break;
      case "ArrowDown":
        this.setPrice(this.ngRedux.getState()['newOrder'].price - (0.01 * mult));
        break;
      case "ArrowLeft":
        this.setQty(this.ngRedux.getState()['newOrder'].qty + (1 * mult));
        break;
      case "ArrowRight":
        this.setQty(this.ngRedux.getState()['newOrder'].qty - (1 * mult));
        break;
      case "Enter":
        this.onSubmit();
        break;
      default:
        break;
    }
  }

  setQty(qty: number){
    this.ngRedux.dispatch({
      type: NewOrderActions.QTY,
      qty: qty});
  }

  setPrice(price: number){
    this.ngRedux.dispatch({
      type: NewOrderActions.PRICE,
      price: price});
  }

  setSide(side: string){
    this.ngRedux.dispatch({
      type: NewOrderActions.SIDE,
      side: side});
  }

  onSubmit(){
    let trader = this.ngRedux.getState()['trader'];
    let newOrder = this.ngRedux.getState()['newOrder'];
    this.traderService.submitOrder(new OrderRequest(
      trader.trader,
      Side[newOrder.side as string],
      newOrder.price,
      newOrder.qty));
  }
}
