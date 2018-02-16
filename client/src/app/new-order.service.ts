import * as R from 'ramda';
import { Side } from "bitcoin-common";

export enum NewOrderActions {
  SIDE = "SetSide",
  PRICE = "SetPrice",
  QTY = "SetQty"
}

export class NewOrderService {
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
}
