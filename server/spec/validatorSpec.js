var OrderRequestValidator = require("../app/validator");
var Sides = require("../app/side");
var OrderEvents = require("../app/orderEvents");
var OrderRequest = OrderEvents.OrderRequest

describe("new OrderRequestValidator", function() {
    var validator;

    beforeEach(function() {
        validator = new OrderRequestValidator();
    });

    it("accepts valid new OrderRequests", function() {
        var a = validator.validate(new OrderRequest("Gilbert", Sides.Bid, 12.5, 21))
        expect(validator.validate(new OrderRequest("Gilbert", Sides.Bid, 12.5, 21)).length).toEqual(0)
        expect(validator.validate(new OrderRequest("Angie", Sides.Offer, -12.5, 9)).length).toEqual(0)
        expect(validator.validate(new OrderRequest("Gil", Sides.Offer, 0, 9)).length).toEqual(0)
    });

    it("only accepts string names", function() {
        expect(validator.validate(new OrderRequest(undefined, Sides.Bid, 12.5, 1)).length).toEqual(1)
        expect(validator.validate(new OrderRequest(null, Sides.Bid, 12.5, 01)).length).toEqual(1)
        expect(validator.validate(new OrderRequest(3, Sides.Bid, 12.5, 1)).length).toEqual(1)
    });

    it("only accepts positive qtys", function() {
        expect(validator.validate(new OrderRequest("Gil", Sides.Bid, 12.5, -1)).length).toEqual(1)
        expect(validator.validate(new OrderRequest("Gil", Sides.Bid, 12.5, 0)).length).toEqual(1)
    });

    it("only accepts integer qtys", function() {
        expect(validator.validate(new OrderRequest("Gil", Sides.Bid, 12.5, -1.01)).length).toEqual(1)
        expect(validator.validate(new OrderRequest("Gil", Sides.Bid, 12.5, .1)).length).toEqual(1)
    });

    it("only accepts bids and offers", function() {
        expect(validator.validate(new OrderRequest("Gil", undefined, 12.5, 1)).length).toEqual(1)
        expect(validator.validate(new OrderRequest("Gil", null, 12.5, 1)).length).toEqual(1)
        expect(validator.validate(new OrderRequest("Gil", "bid", 12.5, 1)).length).toEqual(1)
        expect(validator.validate(new OrderRequest("Gil", 3, 12.5, 1)).length).toEqual(1)
    });

    it("only accepts numeric non NaN prices", function() {
        expect(validator.validate(new OrderRequest("Gil", Sides.Offer, undefined, 1)).length).toEqual(1)
        expect(validator.validate(new OrderRequest("Gil", Sides.Offer, null, 1)).length).toEqual(1)
        expect(validator.validate(new OrderRequest("Gil", Sides.Offer, [], 1)).length).toEqual(1)
        expect(validator.validate(new OrderRequest("Gil", Sides.Offer, NaN, 1)).length).toEqual(1)
    });

    it("returns multiple validation errors", function() {
        expect(validator.validate(new OrderRequest(null, null, undefined, null)).length).toEqual(4)
    });
});