var Matcher = require("../app/matcher");
var Sides = require("../app/side");
var OrderEvents = require("../app/orderEvents");
var OrderRequest = OrderEvents.OrderRequest, OrderStatus = OrderEvents.OrderStatus,
    Fill = OrderEvents.Fill
var DepthEvents = require("../app/depthEvents");
var DepthChanged = DepthEvents.DepthChanged, DepthRemoved = DepthEvents.DepthRemoved,
    DepthSnapshot = DepthEvents.DepthSnapshot
var partially = jasmine.objectContaining


describe("Matcher", function() {
    var matcher;
    var updates = [], orderUpdates = [], depthUpdates = []
    
    beforeEach(function() {
        matcher = new Matcher(function(u){
            updates.push(u)
            if (u instanceof OrderStatus || u instanceof Fill){
                orderUpdates.push(u)
            }
            if (u instanceof DepthChanged || u instanceof DepthRemoved) {
                depthUpdates.push(u)
            }
        });
    });

    it("acks orders", function() {
        matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 100))

        expect(orderUpdates.length).toEqual(1)
        expect(orderUpdates[0]).toEqual(partially(
            {trader: "Garry", side: Sides.Bid, price: 13.0, reqQty: 100, remainingQty: 100, live: true}
        ))
    })

    it("upserts depth with new orders", function() {
        expect(true).toEqual(false)
    })

    it("provides depth snapshots", function() {
        expect(true).toEqual(false)
    })

    it("removes depth when consumed", function() {
        expect(true).toEqual(false)
    })

    it("retains unfilled orders", function() {
        expect(true).toEqual(false)
    })

    it("aggregates depth at the same price point", function() {
        expect(true).toEqual(false)
    })

    it("orders with matching prices fill", function() {
        expect(true).toEqual(false)
    })

    it("orders with non matching prices do not fill", function() {
        expect(true).toEqual(false)
    })

    it("updates order status only after sending fills", function() {
        expect(true).toEqual(false)
    })

    it("marks a totally filled order not live", function() {
        expect(true).toEqual(false)
    })

    it("retains partially filled orders", function() {
        expect(true).toEqual(false)
    })

    it("matches orders against the whole opposing side", function() {
        expect(true).toEqual(false)
    })

    it("matches against opposing orders in FIFO order", function() {
        expect(true).toEqual(false)
    })
});