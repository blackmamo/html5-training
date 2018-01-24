var Matcher = require("../app/matcher");
var Sides = require("../app/side");
var OrderEvents = require("../app/orderEvents");
var OrderRequest = OrderEvents.OrderRequest
var OrderStatus = OrderEvents.OrderStatus
var partially = jasmine.objectContaining
var _ = require("underscore")


describe("Matcher", function() {
    var matcher;
    var updates = []

    function lastEventOfType(type) {
        return updates[_.findLastIndex(updates, function(u) {return u instanceof type})]
    }
    
    beforeEach(function() {
        matcher = new Matcher(function(u){updates.push(u)});
    });

    it("acks orders", function() {
        matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 100))

        expect(lastEventOfType(OrderStatus)).toEqual(partially(
            {trader: "Garry", side: Sides.Bid, price: 13.0, reqQty: 100, remainingQty: 100, live: true}
        ))
    })
});