import { Side } from "./side";
import 'reflect-metadata'
import {Type} from 'class-transformer';

// Sent by the client to send an order to the matcher
export class OrderRequest {
  trader: String;
  side: Side;
  price: Number;
  qty: Number;

  constructor(trader: String, side: Side, price: Number, qty: Number) {
    this.trader = trader;
    this.side = side;
    this.price = price;
    this.qty = qty;
  }
}

// Sent to the client to update the latest state of the order,
// simple protocol here since there are no user initiated cancels or amends,
// rejects will show as not live, and the status will indicate the error
export class OrderStatus {
  orderId: String;
  trader: String;
  side: Side;
  price: Number;
  reqQty: Number;
  remainingQty: Number;
  live: Boolean;
  status: String;
  updated: Date;

  constructor(
    orderId: String,
    trader: String,
    side: Side,
    price: Number,
    reqQty: Number,
    remainingQty: Number,
    live: Boolean,
    status: String
  ) {
    this.orderId = orderId;
    this.trader = trader;
    this.side = side;
    this.price = price;
    this.reqQty = reqQty;
    this.remainingQty = remainingQty;
    this.live = live;
    this.status = status;
    this.updated = new Date();
  }
}

// For now I will only send fills to the counter parties involved,
// I can add an anonymised global trade stream when I enhance the UI
export class Fill {
  tradeId: String;
  giver: String;
  giverOrderId: String;
  taker: String;
  takerOrderId: String;
  price: Number;
  qty: Number;

  constructor(
      tradeId: String,
      giver: String,
      giverOrderId: String,
      taker: String,
      takerOrderId: String,
      price: Number,
      qty: Number
  ) {
    this.tradeId = tradeId;
    this.giver = giver;
    this.giverOrderId = giverOrderId;
    this.taker = taker;
    this.takerOrderId = takerOrderId;
    this.price = price;
    this.qty = qty;
  }
}

// When a client connects, it will obtain a snapshot of its order book
export class OrderStatusSnapshot {
  @Type(() => OrderStatus)
  orders: Map<String,OrderStatus>;

  constructor(orders: Map<String,OrderStatus>) {
    this.orders = orders;
  }

  inUpdateOrder(): OrderStatus[] {
    let orders = Array.from(Object.values(this.orders));
    orders.sort((a, b) => {
      return a.updated.getTime() - b.updated.getTime();
    });
    return orders;
  }
}
