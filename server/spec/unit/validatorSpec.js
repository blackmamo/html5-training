const validate = require("../../app/validator");
const common = require("bitcoin-common");
const Sides = common.Side;
const OrderRequest = common.OrderRequest;

describe("OrderRequestValidator", () => {
  it("accepts valid new OrderRequests", () => {
    expect(
      validate(new OrderRequest("Gilbert", Sides.Bid, 12.5, 21)).length
    ).toEqual(0);
    expect(
      validate(new OrderRequest("Angie", Sides.Offer, -12.5, 9)).length
    ).toEqual(0);
    expect(validate(new OrderRequest("Gil", Sides.Offer, 0, 9)).length).toEqual(
      0
    );
  });

  it("only accepts string names", () => {
    expect(
      validate(new OrderRequest(undefined, Sides.Bid, 12.5, 1)).length
    ).toEqual(1);
    expect(validate(new OrderRequest(null, Sides.Bid, 12.5, 1)).length).toEqual(
      1
    );
    expect(validate(new OrderRequest(3, Sides.Bid, 12.5, 1)).length).toEqual(1);
  });

  it("only accepts positive qtys", () => {
    expect(
      validate(new OrderRequest("Gil", Sides.Bid, 12.5, -1)).length
    ).toEqual(1);
    expect(
      validate(new OrderRequest("Gil", Sides.Bid, 12.5, 0)).length
    ).toEqual(1);
  });

  it("only accepts integer qtys", () => {
    expect(
      validate(new OrderRequest("Gil", Sides.Bid, 12.5, -1.01)).length
    ).toEqual(1);
    expect(
      validate(new OrderRequest("Gil", Sides.Bid, 12.5, 0.1)).length
    ).toEqual(1);
  });

  it("only accepts bids and offers", () => {
    expect(
      validate(new OrderRequest("Gil", undefined, 12.5, 1)).length
    ).toEqual(1);
    expect(validate(new OrderRequest("Gil", null, 12.5, 1)).length).toEqual(1);
    expect(validate(new OrderRequest("Gil", "bid", 12.5, 1)).length).toEqual(1);
    expect(validate(new OrderRequest("Gil", 3, 12.5, 1)).length).toEqual(1);
    expect(
      validate(new OrderRequest("Gil", Sides.Bid, 12.5, 1)).length
    ).toEqual(0);
    expect(
      validate(new OrderRequest("Gil", Sides.Offer, 12.5, 1)).length
    ).toEqual(0);
  });

  it("only accepts numeric non NaN prices", () => {
    expect(
      validate(new OrderRequest("Gil", Sides.Offer, undefined, 1)).length
    ).toEqual(1);
    expect(
      validate(new OrderRequest("Gil", Sides.Offer, null, 1)).length
    ).toEqual(1);
    expect(
      validate(new OrderRequest("Gil", Sides.Offer, [], 1)).length
    ).toEqual(1);
    expect(
      validate(new OrderRequest("Gil", Sides.Offer, NaN, 1)).length
    ).toEqual(1);
  });

  it("returns multiple validation errors", () => {
    expect(
      validate(new OrderRequest(null, null, undefined, null)).length
    ).toEqual(4);
  });
});
