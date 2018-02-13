import { Side } from "./side";
import 'reflect-metadata'
import { Type } from "class-transformer";

// When a client first connects to a Book it will recieve a book snapshot, and live orders
export class Level{
  price: Number;
  qty: Number;

  constructor(price: Number, qty: Number){
    this.price = price;
    this.qty = qty;
  }
}

export class DepthSnapshot {
  @Type(() => Level)
  bids: Level[];
  @Type(() => Level)
  offers: Level[];

  constructor(bids: Level[], offers: Level[]) {
    this.bids = bids;
    this.offers = offers;
  }
}

// When the order book changes the client will receive this
export class DepthChanged {
  side: Side;
  price: Number;
  qty: Number;

  constructor(side: Side, price: Number, qty: Number) {
    this.side = side;
    this.price = price;
    this.qty = qty;
  }
}

// When a price level is removed from the order book, the client receives this
export class DepthRemoved {
  side: Side;
  price: Number;

  constructor(side: Side, price: Number) {
    this.side = side;
    this.price = price;
  }
}
