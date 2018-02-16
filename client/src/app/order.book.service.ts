import {OrderStatusSnapshot} from 'bitcoin-common';
import {combineReducers} from 'redux';
import * as R from 'ramda';

export enum OrderActions {
  SNAPSHOT = "OrderStatusSnapshot",
  UPDATE = "OrderStatus",
  FILL = "Fill"
}

export class OrderBookService {

  constructor() { }

  static reducer = combineReducers({orders: OrderBookService.orders, trades: OrderBookService.trades})

  private static orders(state = new OrderStatusSnapshot(new Map()), action){
    switch (action.type) {
      case OrderActions.SNAPSHOT:
        return action.snapshot;
      case OrderActions.UPDATE:
        return R.set(R.lensPath(['orders', action.update.orderId]), action.update, state);
      default:
        return state;
    }
  }

  private static trades(state = [], action){
    switch (action.type) {
      case OrderActions.FILL:
        return R.append(action.fill, state);
      default:
        return state;
    }
  }

}
