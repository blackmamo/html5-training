var Matcher = require('../../app/matcher')
var Sides = require("../../app/side");
var OrderEvents = require("../../app/orderEvents");
var OrderRequest = OrderEvents.OrderRequest
const uuid = require('uuid/v1');

// These perf tests measure just the matcher in isolation

// I find it quite hard to do simple tests for the matcher, since the state that is built up
// will be giant, e.g. all the orders, and the depth in the book.
// I have modified things so that the store of orders can be turned off to stop that state build up
// being a concern. I have also had to design the tests so that each invocation leaves the depth empty
// This means that the test I concocted is:
//  1. Build depth on both sides of the market, 10 levels, with 10 orders each, all size 1
//  2. Submit orders that cross the spread and fill all of both sides, size 100, i.e. all depth consumed


function testWithoutSockets(){
    var matcher = new Matcher(
        function(){},
        {
            getTradeId: function() {return uuid()},
            getOrderId: function(trader) {return uuid()}
        },
        true)

    for (i = 0; i < 10; i++) {
        for (j = 0; j < 10; j++) {
            matcher.submit(new OrderRequest("Julia", Sides.Bid, 99 - i, 1))
            matcher.submit(new OrderRequest("Melissa", Sides.Offer, 101 + i, 1))
        }
    }

    // These should fill all
    matcher.submit(new OrderRequest("Julia", Sides.Bid, 101 + i, 100))
    matcher.submit(new OrderRequest("Melissa", Sides.Offer, 99 - i, 100))
}

module.exports = {
    name: 'Matcher Direct',
    defer: false,
    fn: testWithoutSockets
}