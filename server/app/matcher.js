var Sides = require("../app/side");
var OrderEvents = require("../app/orderEvents");
var OrderStatus = OrderEvents.OrderStatus

// Separation of concerns means that the matcher has a single update handler to send out events
// Ensuring that the correct messages
function Matcher(updateHandler) {
    this.updateHandler = updateHandler
}

// assumes that is is only ever passed valid orders, see the OrderRequestValidator
Matcher.prototype.submit = function(order) {
    var status = new OrderStatus(
            0, order.trader, order.side, order.price, order.qty, order.qty, true, "Order acknowledged")
    this.updateHandler(status)
}

Matcher.prototype.depthSnapshot = function() {
    // will return the snapshot
}

Matcher.prototype.depthSnapshot = function() {
    // will return the snapshot
}

Matcher.prototype.orderStatusSnapshot = function(trader) {
    // will return the snapshot
}

module.exports = Matcher
