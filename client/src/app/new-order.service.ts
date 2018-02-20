import * as R from 'ramda';
import { Side } from "bitcoin-common";
import {Injectable} from '@angular/core';
import {NgRedux} from '@angular-redux/store';

export enum NewOrderActions {
  SIDE = "SetSide",
  PRICE = "SetPrice",
  QTY = "SetQty"
}

@Injectable()
export class NewOrderService {
  constructor(private ngRedux: NgRedux<Object>) {}

  static reducer(state = {side: Side[Side.Bid], price: 100.00, qty: 100}, action){
    switch (action.type) {
      case NewOrderActions.SIDE:
        return R.assoc('side', action.side, state);
      case NewOrderActions.PRICE:
        return R.assoc('price', action.price, state);
      case NewOrderActions.QTY:
        return R.assoc('qty', action.qty, state);
      default:
        return state;
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

  getQty(): number{
    return this.ngRedux.getState()['newOrder'].qty
  }

  getPrice(): number{
    return this.ngRedux.getState()['newOrder'].price
  }

  getSide(): string {
    return this.ngRedux.getState()['newOrder'].side
  }

  getState() {
    return this.ngRedux.getState()['newOrder']
  }
}
