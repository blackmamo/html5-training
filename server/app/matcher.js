const Sides = require("../app/side");
const OrderEvents = require("../app/orderEvents");
const DepthEvents = require("../app/depthEvents");
const OrderStatus = OrderEvents.OrderStatus,
  Fill = OrderEvents.Fill,
  OrderStatusSnapshot = OrderEvents.OrderStatusSnapshot;
const DepthSnapshot = DepthEvents.DepthSnapshot,
  DepthChanged = DepthEvents.DepthChanged,
  DepthRemoved = DepthEvents.DepthRemoved;

// Separation of concerns means that the matcher has a single update handler to send out events
// Ensuring that the correct messages
// I was sorely tempted to pull out the order book as a separate object with add and remove methods
// the matcher would do the matching, but there match logic is so simple, and tied so closely to the
// order book that I won't. If I was adding more complex order types, I may well separate them
// The idGeneration is a policy thing we don't want to bake into the matcher implementation,
// hence it is injected
class Matcher {
  constructor(updateHandler, idGenerator, removeDeadOrders, canClearBook) {
    this.idGenerator = idGenerator;
    this.updateHandler = updateHandler;
    this.removeDeadOrders = removeDeadOrders;
    this.canClearBook = canClearBook;

    // Would ideally like to use a sorted map, could use the ones in collections.js
    // but keeping it simple for now
    this.bids = [];
    this.offers = [];
    // keyed by trader and orderid, this could get huge since we never remove an order even
    // when it is filled, the ui wants to request it, this screams to be moved out from the matcher
    // and into a separate client order service which can be backed by a backend store, later...
    this.orders = {};
    // These are basically strategies for implementing the two order types
    let sideStrategies = {};
    sideStrategies[Sides.Bid.side] = {
      toMatch: this.offers,
      toJoin: this.bids,
      opposite: Sides.Offer,
      matchingPrice: (orderPrice, otherOrderPrice) => {
        return orderPrice >= otherOrderPrice;
      }
    };
    sideStrategies[Sides.Offer.side] = {
      toMatch: this.bids,
      toJoin: this.offers,
      opposite: Sides.Bid,
      matchingPrice: (orderPrice, otherOrderPrice) => {
        return orderPrice <= otherOrderPrice;
      }
    };
    this.side = order => {
      return sideStrategies[order.side.side];
    };
  }

  // private - used by submit
  sendStatusUpdate(status) {
    // need to copy since we mutate these things internally
    // flat object so no need for deep copy - currently
    let copy = new OrderStatus(
      status.orderId,
      status.trader,
      status.side,
      status.price,
      status.reqQty,
      status.remainingQty,
      status.live,
      status.status
    );
    this.storeOrder(status);
    this.updateHandler(copy);
  }

  // private - used by submit
  ackOrder(order) {
    let status = new OrderStatus(
      this.idGenerator.getOrderId(order.trader),
      order.trader,
      order.side,
      order.price,
      order.qty,
      order.qty,
      true,
      "Order acknowledged"
    );
    this.sendStatusUpdate(status);
    return status;
  }

  // private - used by submit
  sendFill(submittedOrder, otherOrder, qty) {
    let giver, giverOrderId, taker, takerOrderId;
    if (submittedOrder.side === Sides.Bid) {
      giver = otherOrder.trader;
      giverOrderId = otherOrder.orderId;
      taker = submittedOrder.trader;
      takerOrderId = submittedOrder.orderId;
    } else {
      giver = submittedOrder.trader;
      giverOrderId = submittedOrder.orderId;
      taker = otherOrder.trader;
      takerOrderId = otherOrder.orderId;
    }
    this.updateHandler(
      new Fill(
        this.idGenerator.getTradeId(),
        giver,
        giverOrderId,
        taker,
        takerOrderId,
        // always fill at the price that was in the book before our order was submitted
        otherOrder.price,
        qty
      )
    );
  }

  // private - used by submit
  orderFinished(order) {
    order.live = false;
    if (this.removeDeadOrders) {
      delete this.orders[order.trader][order.orderId];
    }
  }

  // private - used by submit
  match(order, side) {
    // always consume depth from the best price, and oldest order, so index is always 0, hence not
    // a for loop
    let level = side.toMatch[0];
    let priceMatches = level && side.matchingPrice(order.price, level.price);
    while (priceMatches) {
      let otherOrder = level.orders[0];
      if (otherOrder) {
        let exactMatch = false; // updated if we do an exact match
        let matchingQty = Math.min(order.remainingQty, otherOrder.remainingQty);

        // reduce the qty of both orders and the level
        otherOrder.remainingQty -= matchingQty;
        level.qty -= matchingQty;
        order.remainingQty -= matchingQty;

        this.sendFill(order, otherOrder, matchingQty);

        // consume order and possibly the level
        if (otherOrder.remainingQty === 0) {
          this.orderFinished(otherOrder);
          level.orders.splice(0, 1);

          if (level.qty === 0) {
            exactMatch = true;
            this.depthRemoved(side.opposite, level);
            side.toMatch.splice(0, 1);
            level = side.toMatch[0];

            // when we hit the next level, do we still have a matching price
            priceMatches =
              level && side.matchingPrice(order.price, level.price);
          }
        }

        // update matched order, copying since we update these
        this.sendStatusUpdate(otherOrder);

        // if filled leave the loop and mark the order finished
        if (order.remainingQty === 0) {
          this.orderFinished(order);

          // If we partially consumed a level, we need to update the depth
          if (!exactMatch) {
            this.depthChanged(side.opposite, level);
          }
          break;
        }
      }
    }

    // only send an update for the submitted order if it matched, i.e. changed
    if (order.remainingQty !== order.reqQty) {
      // copy to make safe externally
      this.sendStatusUpdate(order);
    }
    return order;
  }

  // private - used by submit
  depthChanged(side, level) {
    this.updateHandler(new DepthChanged(side, level.price, level.qty));
  }

  // private - used by submit
  depthRemoved(side, level) {
    this.updateHandler(new DepthRemoved(side, level.price));
  }

  // private - used by submit
  addToBook(order, side) {
    let insertOrUpdateIndex = side.toJoin.findIndex(function(level) {
      return side.matchingPrice(order.price, level.price);
    });

    // this will only happen if the order has a worse price than all other orders in the book
    // or there are no orders in the book
    if (insertOrUpdateIndex === -1) {
      let level = {
        price: order.price,
        qty: order.remainingQty,
        orders: [order]
      };
      side.toJoin.push(level);
      this.depthChanged(order.side, level);
    } else {
      let existingLevel = side.toJoin[insertOrUpdateIndex];
      // update case
      if (existingLevel.price === order.price) {
        existingLevel.orders.push(order);
        existingLevel.qty += order.remainingQty;
        this.depthChanged(order.side, existingLevel);
        // insert case
      } else {
        let level = {
          price: order.price,
          qty: order.remainingQty,
          orders: [order]
        };
        side.toJoin.splice(insertOrUpdateIndex, 0, level);
        this.depthChanged(order.side, level);
      }
    }
  }

  // private - used by submit
  storeOrder(order) {
    let traderOrders = this.orders[order.trader];
    if (!traderOrders) {
      this.orders[order.trader] = traderOrders = {};
    }
    traderOrders[order.orderId] = order;
  }

  // assumes that is is only ever passed valid orders, see the OrderRequestValidator
  submit(order) {
    let ackedOrder = this.ackOrder(order);
    let side = this.side(order);
    let matchedOrder = this.match(ackedOrder, side);
    if (matchedOrder.remainingQty > 0) {
      this.addToBook(matchedOrder, side);
    }
  }

  clear() {
    if (this.canClearBook) {
      let traders = Object.keys(this.orders);
      for (let i = 0; i < traders.length; i++) {
        delete this.orders[traders[i]];
      }
      this.bids.length = 0;
      this.offers.length = 0;
    }
  }

  static aggregateDepth(side) {
    return side.map(level => {
      return { price: level.price, qty: level.qty };
    });
  }

  depthSnapshot() {
    return new DepthSnapshot(
      Matcher.aggregateDepth(this.bids),
      Matcher.aggregateDepth(this.offers)
    );
  }

  orderStatusSnapshot(trader) {
    let traderOrders = this.orders[trader];
    return new OrderStatusSnapshot(
      traderOrders
        ? Object.keys(traderOrders).map(k => {
            return traderOrders[k];
          })
        : []
    );
  }
}

module.exports = Matcher;
