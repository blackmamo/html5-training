module.exports = {
  // When a client first connects to a Book it will recieve a book snapshot, and live orders
  DepthSnapshot: class DepthSnapshot {
    constructor(bids, offers) {
      this.bids = bids;
      this.offers = offers;
    }
  },

  // When the order book changes the client will receive this
  DepthChanged: class DepthChanged {
    constructor(side, price, qty) {
      this.side = side;
      this.price = price;
      this.qty = qty;
    }
  },

  // When a price level is removed from the order book, the client receives this
  DepthRemoved: class DepthRemoved {
    constructor(side, price) {
      this.side = side;
      this.price = price;
    }
  }
};
