module.exports = {
  // Sent by the client to send an order to the matcher
  OrderRequest: class OrderRequest {
    constructor(trader, side, price, qty) {
      this.trader = trader;
      this.side = side;
      this.price = price;
      this.qty = qty;
    }
  },

  // Sent to the client to update the latest state of the order,
  // simple protocol here since there are no user initiated cancels or amends,
  // rejects will show as not live, and the status will indicate the error
  OrderStatus: class OrderStatus {
    constructor(
      orderId,
      trader,
      side,
      price,
      reqQty,
      remainingQty,
      live,
      status
    ) {
      this.orderId = orderId;
      this.trader = trader;
      this.side = side;
      this.price = price;
      this.reqQty = reqQty;
      this.remainingQty = remainingQty;
      this.live = live;
      this.status = status;
    }
  },

  // For now I will only send fills to the counter parties involved,
  // I can add an anonymised global trade stream when I enhance the UI
  Fill: class Fill {
    constructor(tradeId, giver, giverOrderId, taker, takerOrderId, price, qty) {
      this.tradeId = tradeId;
      this.giver = giver;
      this.giverOrderId = giverOrderId;
      this.taker = taker;
      this.takerOrderId = takerOrderId;
      this.price = price;
      this.qty = qty;
    }
  },
  // When a client connects, it will obtain a snapshot of its order book
  OrderStatusSnapshot: class OrderStatusSnapshot {
    constructor(orders) {
      this.orders = orders;
    }
  }
};
