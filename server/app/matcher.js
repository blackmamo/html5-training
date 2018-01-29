var Sides = require("../app/side");
var OrderEvents = require("../app/orderEvents");
var DepthEvents = require("../app/depthEvents");
var OrderStatus = OrderEvents.OrderStatus, Fill = OrderEvents.Fill,
    OrderStatusSnapshot = OrderEvents.OrderStatusSnapshot
var DepthSnapshot = DepthEvents.DepthSnapshot, DepthChanged = DepthEvents.DepthChanged,
    DepthRemoved = DepthEvents.DepthRemoved

// Separation of concerns means that the matcher has a single update handler to send out events
// Ensuring that the correct messages
// I was sorely tempted to pull out the order book as a separate object with add and remove methods
// the matcher would do the matching, but there match logic is so simple, and tied so closely to the
// order book that I won't. If I was adding more complex order types, I may well separate them
// The idGeneration is a policy thing we don't want to bake into the matcher implementation,
// hence it is injected
function Matcher(updateHandler, idGenerator, removeDeadOrders) {
    this.idGenerator = idGenerator
    this.updateHandler = updateHandler
    this.removeDeadOrders = removeDeadOrders
    // Would ideally like to use a sorted map, could use the ones in collections.js
    // but keeping it simple for now
    this.bids = []
    this.offers = []
    // keyed by trader and orderid, this could get huge since we never remove an order even
    // when it is filled, the ui wants to request it, this screams to be moved out from the matcher
    // and into a separate client order service which can be backed by a backend store, later...
    this.orders = {}
    // These are basically strategies for implementing the two order types
    var sideStrategies = {}
    sideStrategies[Sides.Bid.side] = {
        toMatch: this.offers,
        toJoin: this.bids,
        opposite: Sides.Offer,
        matchingPrice: function(orderPrice, otherOrderPrice) {return orderPrice >= otherOrderPrice}}
    sideStrategies[Sides.Offer.side] = {
        toMatch: this.bids,
        toJoin: this.offers,
        opposite: Sides.Bid,
        matchingPrice: function(orderPrice, otherOrderPrice) {return orderPrice <= otherOrderPrice}}
    this.side = function(order){
        return sideStrategies[order.side.side]}
}

// private - used by submit
Matcher.prototype.sendStatusUpdate = function (status){
    // need to copy since we mutate these things internally
    // flat object so no need for deep copy - currently
    var copy = new OrderStatus(
        status.orderId, status.trader, status.side,
        status.price, status.reqQty, status.remainingQty, status.live, status.status
    )
    this.storeOrder(status)
    this.updateHandler(copy)
}

// private - used by submit
Matcher.prototype.ackOrder = function(order) {
    var status = new OrderStatus(
        this.idGenerator.getOrderId(order.trader), order.trader,
        order.side, order.price, order.qty, order.qty,
        true, "Order acknowledged")
    this.sendStatusUpdate(status)
    return status
}

// private - used by submit
Matcher.prototype.sendFill = function(submittedOrder, otherOrder, qty){
    var giver, giverOrderId, taker, takerOrderId
    if (submittedOrder.side === Sides.Bid) {
        giver = otherOrder.trader
        giverOrderId = otherOrder.orderId
        taker = submittedOrder.trader
        takerOrderId = submittedOrder.orderId
    } else {
        giver = submittedOrder.trader
        giverOrderId = submittedOrder.orderId
        taker = otherOrder.trader
        takerOrderId = otherOrder.orderId
    }
    this.updateHandler(new Fill(
        this.idGenerator.getTradeId(), giver, giverOrderId, taker, takerOrderId,
        // always fill at the price that was in the book before our order was submitted
        otherOrder.price, qty))

}

// private - used by submit
Matcher.prototype.orderFinished = function(order){
    order.live = false
    if (this.removeDeadOrders) {
        delete this.orders[order.trader][order.orderId]
    }
}

// private - used by submit
Matcher.prototype.match = function(order, side) {
    // always consume depth from the best price, and oldest order, so index is always 0, hence not
    // a for loop
    var level = side.toMatch[0]
    var priceMatches = level && side.matchingPrice(order.price, level.price)
    while(priceMatches) {
        otherOrder = level.orders[0]
        if(otherOrder){
            var exactMatch = false // updated if we do an exact match
            var matchingQty = Math.min(order.remainingQty, otherOrder.remainingQty)

            // reduce the qty of both orders and the level
            otherOrder.remainingQty -= matchingQty
            level.qty -= matchingQty
            order.remainingQty -= matchingQty

            this.sendFill(order, otherOrder, matchingQty)

            // consume order and possibly the level
            if (otherOrder.remainingQty === 0){
                this.orderFinished(otherOrder)
                level.orders.splice(0,1)

                if (level.qty === 0){
                    exactMatch = true
                    this.depthRemoved(side.opposite, level)
                    side.toMatch.splice(0,1)
                    level = side.toMatch[0]

                    // when we hit the next level, do we still have a matching price
                    priceMatches = level && side.matchingPrice(order.price, level.price)
                }
            }

            // update matched order, copying since we update these
            this.sendStatusUpdate(otherOrder)

            // if filled leave the loop and mark the order finished
            if (order.remainingQty === 0) {
                this.orderFinished(order)

                // If we partially consumed a level, we need to update the depth
                if (!exactMatch) {
                    this.depthChanged(side.opposite, level)
                }
                break
            }
        }
    }

    // only send an update for the submitted order if it matched, i.e. changed
    if (order.remainingQty !== order.reqQty){
        // copy to make safe externally
        this.sendStatusUpdate(order)
    }
    return order
}

// private - used by submit
Matcher.prototype.depthChanged = function(side, level) {
    this.updateHandler(new DepthChanged(side, level.price, level.qty))
}

// private - used by submit
Matcher.prototype.depthRemoved = function(side, level) {
    this.updateHandler(new DepthRemoved(side, level.price))
}

// private - used by submit
Matcher.prototype.addToBook = function(order, side) {
    var insertOrUpdateIndex = side.toJoin.findIndex(function(level){
        return side.matchingPrice(order.price, level.price)})

    // this will only happen if the order has a worse price than all other orders in the book
    // or there are no orders in the book
    if (insertOrUpdateIndex === -1) {
        var level = {price: order.price, qty: order.remainingQty, orders:[order]}
        side.toJoin.push(level)
        this.depthChanged(order.side, level)
    }
    else {
        var existingLevel = side.toJoin[insertOrUpdateIndex]
        // update case
        if (existingLevel.price === order.price){
            existingLevel.orders.push(order)
            existingLevel.qty += order.remainingQty
            this.depthChanged(order.side, existingLevel)
        }
        // insert case
        else {
            var level = {price: order.price, qty: order.remainingQty, orders:[order]}
            side.toJoin.splice(insertOrUpdateIndex, 0, level)
            this.depthChanged(order.side, level)
        }
    }
}

// private - used by submit
Matcher.prototype.storeOrder = function(order) {
    var traderOrders = this.orders[order.traderId]
    if (!traderOrders) {
        this.orders[order.trader] = traderOrders = []
    }
    traderOrders[order.orderId] = order
}

// assumes that is is only ever passed valid orders, see the OrderRequestValidator
Matcher.prototype.submit = function(order) {
    var ackedOrder = this.ackOrder(order)
    var side = this.side(order)
    var matchedOrder = this.match(ackedOrder, side)
    if (matchedOrder.remainingQty > 0) {
        this.addToBook(matchedOrder, side)
    }
}

function aggregateDepth(side) {
    return side.map(function(level){return {price: level.price, qty: level.qty}})
}

Matcher.prototype.depthSnapshot = function() {
    return new DepthSnapshot(aggregateDepth(this.bids), aggregateDepth(this.offers))
}

Matcher.prototype.orderStatusSnapshot = function(trader) {
    var traderOrders = this.orders[trader]
    return new OrderStatusSnapshot(
        traderOrders ? Object.keys(traderOrders).map(function(k){return traderOrders[k]}) : [])
}

module.exports = Matcher
