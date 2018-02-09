const Matcher = require("../../app/matcher");
const Sides = require("../../app/side");
const OrderEvents = require("../../app/orderEvents");
const OrderRequest = OrderEvents.OrderRequest,
  OrderStatus = OrderEvents.OrderStatus,
  Fill = OrderEvents.Fill;
const DepthEvents = require("../../app/depthEvents");
const DepthChanged = DepthEvents.DepthChanged,
  DepthRemoved = DepthEvents.DepthRemoved,
  DepthSnapshot = DepthEvents.DepthSnapshot;
const partially = jasmine.objectContaining;

describe("Matcher", () => {
  let matcher;
  let updates = [],
    orderUpdates = [],
    depthUpdates = [];

  // record id generation requests
  let idGenerator = jasmine.createSpyObj(["getTradeId", "getOrderId"]);
  idGenerator.getTradeId.and.callFake(() => {
    return idGenerator.nextTradeId;
  });
  idGenerator.getOrderId.and.callFake(trader => {
    return trader + idGenerator.nextOrderId;
  });

  beforeEach(() => {
    // Do all the things I would normally use a mocking framework for
    updates = [];
    orderUpdates = [];
    depthUpdates = [];
    // update handler that records stuff
    let updateHandler = u => {
      updates.push(u);
      if (u instanceof OrderStatus || u instanceof Fill) {
        orderUpdates.push(u);
      }
      if (u instanceof DepthChanged || u instanceof DepthRemoved) {
        depthUpdates.push(u);
      }
    };
    idGenerator["nextTradeId"] = 0;
    idGenerator["nextOrderId"] = 0;

    matcher = new Matcher(updateHandler, idGenerator, false);
  });

  // Now I get to the point of packaging up a group of tests, I wonder if tests per
  // protocol are the best way?
  describe("when considering depth protocol", () => {
    it("upserts depth with new orders", () => {
      // first order creates an update
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 100));
      expect(depthUpdates[0]).toEqual(new DepthChanged(Sides.Bid, 13.0, 100));

      // second order creates an update
      matcher.submit(new OrderRequest("Damion", Sides.Offer, 15.0, 19));
      expect(depthUpdates[1]).toEqual(new DepthChanged(Sides.Offer, 15.0, 19));

      // third order creates an update
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 12.0, 3));
      expect(depthUpdates[2]).toEqual(new DepthChanged(Sides.Bid, 12.0, 3));

      // fourth order creates an update
      matcher.submit(new OrderRequest("Damion", Sides.Offer, 16.0, 9));
      expect(depthUpdates[3]).toEqual(new DepthChanged(Sides.Offer, 16.0, 9));

      expect(depthUpdates.length).toEqual(4);
    });

    it("aggregates depth at the same price point", () => {
      // first order creates an update
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 100));
      expect(depthUpdates[0]).toEqual(new DepthChanged(Sides.Bid, 13.0, 100));

      // second order creates an update
      matcher.submit(new OrderRequest("Damion", Sides.Offer, 15.0, 19));
      expect(depthUpdates[1]).toEqual(new DepthChanged(Sides.Offer, 15.0, 19));

      // third order creates an update, but the qty is an aggregation with 1st
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 3));
      expect(depthUpdates[2]).toEqual(new DepthChanged(Sides.Bid, 13.0, 103));

      // fourth order creates an update, but the qty is an aggregation with 2nd
      matcher.submit(new OrderRequest("Damion", Sides.Offer, 15.0, 9));
      expect(depthUpdates[3]).toEqual(new DepthChanged(Sides.Offer, 15.0, 28));

      expect(depthUpdates.length).toEqual(4);
    });

    it("removes depth when consumed, with no phantom updates", () => {
      // this produces one update, per order i.e. 2
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 50));
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 50));

      // we shouldn't see the matching order added to the depth and then removed,
      // or added with 0 qty, only the depth removed update for the first order
      // we should also only have one update per level hit, not per order filled
      matcher.submit(new OrderRequest("Jill", Sides.Offer, 13.0, 100));

      expect(depthUpdates[2]).toEqual(new DepthRemoved(Sides.Bid, 13.0, 100));
      expect(depthUpdates.length).toEqual(3);
    });

    function addStartingDepth() {
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 100));
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 11.0, 23));
      matcher.submit(new OrderRequest("Damion", Sides.Offer, 16.0, 100));
      matcher.submit(new OrderRequest("Damion", Sides.Offer, 15.0, 19));
    }

    it("provides depth snapshots", () => {
      addStartingDepth();

      expect(matcher.depthSnapshot()).toEqual(
        new DepthSnapshot(
          // bids
          [{ price: 13.0, qty: 100 }, { price: 11.0, qty: 23 }],
          // offers
          [{ price: 15.0, qty: 19 }, { price: 16.0, qty: 100 }]
        )
      );
    });

    it("provides depth snapshots ordered best to worst price", () => {
      addStartingDepth();
      // these add new price levels between the existing ones
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 12.0, 3));
      matcher.submit(new OrderRequest("Garry", Sides.Offer, 15.5, 2));

      expect(matcher.depthSnapshot()).toEqual(
        new DepthSnapshot(
          // bids
          [
            { price: 13.0, qty: 100 },
            { price: 12.0, qty: 3 },
            { price: 11.0, qty: 23 }
          ],
          // offers
          [
            { price: 15.0, qty: 19 },
            { price: 15.5, qty: 2 },
            { price: 16.0, qty: 100 }
          ]
        )
      );
    });

    it("provides depth snapshots aggregated by price", () => {
      addStartingDepth();
      // these add depth at a pre-existing price
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 11.0, 100));
      matcher.submit(new OrderRequest("Garry", Sides.Offer, 15.0, 100));

      expect(matcher.depthSnapshot()).toEqual(
        new DepthSnapshot(
          // bids
          [{ price: 13.0, qty: 100 }, { price: 11.0, qty: 123 }],
          // offers
          [{ price: 15.0, qty: 119 }, { price: 16.0, qty: 100 }]
        )
      );
    });

    it("provides depth snapshots with filled orders removed", () => {
      addStartingDepth();
      // these exactly match the qty at best bid and the whole qty on the offer side
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 16.0, 119));
      matcher.submit(new OrderRequest("Garry", Sides.Offer, 13.0, 100));

      expect(matcher.depthSnapshot()).toEqual(
        new DepthSnapshot(
          // bids
          [{ price: 11.0, qty: 23 }],
          // offers
          []
        )
      );
    });

    it("provides depth snapshots that show partial fills", () => {
      addStartingDepth();
      // these partially fill the best bid and offer orders
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 15.0, 1));
      matcher.submit(new OrderRequest("Garry", Sides.Offer, 13.0, 1));

      expect(matcher.depthSnapshot()).toEqual(
        new DepthSnapshot(
          // bids
          [{ price: 13.0, qty: 99 }, { price: 11.0, qty: 23 }],
          // offers
          [{ price: 15.0, qty: 18 }, { price: 16.0, qty: 100 }]
        )
      );
    });

    it("Adds unfilled portions of an order to the book", () => {
      // We have some depth in the market
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 15.0, 1));
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 11.0, 1));
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 16.0, 1));
      matcher.submit(new OrderRequest("Dan", Sides.Offer, 26.0, 1));

      // We submit an order that eats through all the depth it can and the rest is
      // added to the other side of the book
      matcher.submit(new OrderRequest("Dan", Sides.Offer, 15.0, 4));

      expect(matcher.depthSnapshot()).toEqual(
        new DepthSnapshot(
          // bids
          [{ price: 11.0, qty: 1 }],
          // offers
          [{ price: 15.0, qty: 2 }, { price: 26.0, qty: 1 }]
        )
      );
    });
  });

  describe("when considering order protocol", () => {
    it("acks orders", () => {
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 100));

      expect(orderUpdates.length).toEqual(1);
      expect(orderUpdates[0]).toEqual(
        partially({
          trader: "Garry",
          side: Sides.Bid,
          price: 13.0,
          reqQty: 100,
          remainingQty: 100,
          live: true
        })
      );
    });

    it("requests trade and order ids and uses them", () => {
      // will need 2 ids for garry, 1 for andrew and one trade id
      idGenerator.nextOrderId = 11;
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 43));
      idGenerator.nextOrderId = 16;
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 43));
      Object.assign(idGenerator, { nextOrderId: 4, nextTradeId: 6 });
      matcher.submit(new OrderRequest("Andrew", Sides.Offer, 13.0, 43));

      // Garrys 2 orders
      expect(orderUpdates[0].orderId).toEqual("Garry11");
      expect(orderUpdates[1].orderId).toEqual("Garry16");
      // Andrews
      expect(orderUpdates[2].orderId).toEqual("Andrew4");
      // the fill, should have three ids in
      expect(orderUpdates[3].tradeId).toEqual(6);
      expect(orderUpdates[3].giverOrderId).toEqual("Andrew4"); // Andrews
      expect(orderUpdates[3].takerOrderId).toEqual("Garry11");
    });

    it("orders with exactly matching prices fill and updated as not live", () => {
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 43));
      matcher.submit(new OrderRequest("Andrew", Sides.Offer, 13.0, 43));

      // two updates for each order, an ack and an order finished (not live) status
      // and one shared fill
      expect(orderUpdates.length).toEqual(5);
      expect(orderUpdates[0]).toEqual(
        partially({
          trader: "Garry",
          side: Sides.Bid,
          price: 13.0,
          reqQty: 43,
          remainingQty: 43,
          live: true
        })
      );
      expect(orderUpdates[1]).toEqual(
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 13.0,
          reqQty: 43,
          remainingQty: 43,
          live: true
        })
      );
      expect(orderUpdates[2]).toEqual(
        new Fill(0, "Andrew", "Andrew0", "Garry", "Garry0", 13.0, 43)
      );
      expect(orderUpdates[3]).toEqual(
        partially({
          trader: "Garry",
          side: Sides.Bid,
          price: 13.0,
          reqQty: 43,
          remainingQty: 0,
          live: false
        })
      );
      expect(orderUpdates[4]).toEqual(
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 13.0,
          reqQty: 43,
          remainingQty: 0,
          live: false
        })
      );
    });

    it("orders with inexactly matching prices fill at the price of the older order", () => {
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 15.0, 77));
      matcher.submit(new OrderRequest("Andrew", Sides.Offer, 13.0, 77));

      expect(orderUpdates[2]).toEqual(
        new Fill(0, "Andrew", "Andrew0", "Garry", "Garry0", 15.0, 77)
      );
    });

    it("orders with non matching prices do not fill", () => {
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 77));
      matcher.submit(new OrderRequest("Andrew", Sides.Offer, 15.0, 77));

      expect(orderUpdates.length).toEqual(2);
      expect(orderUpdates[0] instanceof OrderStatus).toEqual(true);
      expect(orderUpdates[1] instanceof OrderStatus).toEqual(true);
    });

    it("retains partially filled orders", () => {
      matcher.submit(new OrderRequest("Andrew", Sides.Offer, 13.0, 100));

      // After this first partial fill
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 10));

      // we can fill a second bid against the initial offer
      matcher.submit(new OrderRequest("Garry", Sides.Bid, 13.0, 10));

      // The three acks, two fills, two updates to the original order, and two finished orders
      let expected = [
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 13.0,
          reqQty: 100,
          remainingQty: 100,
          live: true
        }),
        // first fill
        partially({
          trader: "Garry",
          side: Sides.Bid,
          price: 13.0,
          reqQty: 10,
          remainingQty: 10,
          live: true
        }),
        new Fill(0, "Andrew", "Andrew0", "Garry", "Garry0", 13.0, 43),
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 13.0,
          reqQty: 100,
          remainingQty: 90,
          live: true
        }),
        partially({
          trader: "Garry",
          side: Sides.Bid,
          price: 13.0,
          reqQty: 10,
          remainingQty: 0,
          live: false
        }),
        // second fill
        partially({
          trader: "Garry",
          side: Sides.Bid,
          price: 13.0,
          reqQty: 10,
          remainingQty: 10,
          live: true
        }),
        new Fill(0, "Andrew", "Andrew0", "Garry", "Garry0", 13.0, 43),
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 13.0,
          reqQty: 100,
          remainingQty: 90,
          live: true
        }),
        partially({
          trader: "Garry",
          side: Sides.Bid,
          price: 13.0,
          reqQty: 10,
          remainingQty: 0,
          live: false
        })
      ];
      expect(orderUpdates.length).toEqual(expected.length);
      for (let i = 0; i++; i < expected.length) {
        expect(orderUpdates[i]).toEqual(expected);
      }
    });

    it("matches orders against the whole opposing side, status after fills", () => {
      matcher.submit(new OrderRequest("Andrew", Sides.Offer, 13.0, 10));
      matcher.submit(new OrderRequest("Andrew", Sides.Offer, 15.0, 10));
      matcher.submit(new OrderRequest("Andrew", Sides.Offer, 14.0, 10));

      // submit through the whole book
      matcher.submit(new OrderRequest("Guy", Sides.Bid, 20.0, 30));

      let expected = [
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 13.0,
          reqQty: 10,
          remainingQty: 10,
          live: true
        }),
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 15.0,
          reqQty: 10,
          remainingQty: 10,
          live: true
        }),
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 14.0,
          reqQty: 10,
          remainingQty: 10,
          live: true
        }),
        partially({
          trader: "Guy",
          side: Sides.Bid,
          price: 20.0,
          reqQty: 30,
          remainingQty: 30,
          live: true
        }),
        // The fills
        new Fill(0, "Guy", "Guy0", "Andrew", "Andrew0", 13.0, 10),
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 13.0,
          reqQty: 10,
          remainingQty: 0,
          live: false
        }),
        new Fill(0, "Guy", "Guy0", "Andrew", "Andrew0", 14.0, 10),
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 14.0,
          reqQty: 10,
          remainingQty: 0,
          live: false
        }),
        new Fill(0, "Guy", "Guy0", "Andrew", "Andrew0", 15.0, 10),
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 15.0,
          reqQty: 10,
          remainingQty: 0,
          live: false
        }),
        partially({
          trader: "Guy",
          side: Sides.Bid,
          price: 20.0,
          reqQty: 30,
          remainingQty: 0,
          live: false
        })
      ];
      expect(orderUpdates.length).toEqual(expected.length);
      for (let i = 0; i++; i < expected.length) {
        expect(orderUpdates[i]).toEqual(expected);
      }
    });

    it("matches against opposing orders in FIFO order, status after fills", () => {
      matcher.submit(new OrderRequest("Andrew", Sides.Bid, 13.0, 10));
      matcher.submit(new OrderRequest("Sonia", Sides.Bid, 14.0, 10));
      matcher.submit(new OrderRequest("Sam", Sides.Bid, 13.0, 10));
      matcher.submit(new OrderRequest("Barney", Sides.Bid, 14.0, 10));

      // submit through the whole book
      matcher.submit(new OrderRequest("Guy", Sides.Offer, 10.0, 50));

      let expected = [
        partially({
          trader: "Andrew",
          side: Sides.Bid,
          price: 13.0,
          reqQty: 10,
          remainingQty: 10,
          live: true
        }),
        partially({
          trader: "Sonia",
          side: Sides.Bid,
          price: 14.0,
          reqQty: 10,
          remainingQty: 10,
          live: true
        }),
        partially({
          trader: "Sam",
          side: Sides.Bid,
          price: 13.0,
          reqQty: 10,
          remainingQty: 10,
          live: true
        }),
        partially({
          trader: "Barney",
          side: Sides.Bid,
          price: 14.0,
          reqQty: 10,
          remainingQty: 10,
          live: true
        }),
        partially({
          trader: "Guy",
          side: Sides.Bid,
          price: 10.0,
          reqQty: 50,
          remainingQty: 350,
          live: true
        }),
        // The fills - first andrew then sam followed by sonia and then barney
        new Fill(0, "Guy", "Guy0", "Andrew", "Andrew0", 13.0, 10),
        partially({
          trader: "Andrew",
          side: Sides.Offer,
          price: 13.0,
          reqQty: 10,
          remainingQty: 0,
          live: false
        }),
        new Fill(0, "Guy", "Guy0", "Sam", "Sam0", 13.0, 10),
        partially({
          trader: "Sam",
          side: Sides.Offer,
          price: 14.0,
          reqQty: 10,
          remainingQty: 0,
          live: false
        }),
        new Fill(0, "Guy", "Guy0", "Sonia", "Sonia0", 14.0, 10),
        partially({
          trader: "Sonia",
          side: Sides.Offer,
          price: 14.0,
          reqQty: 10,
          remainingQty: 0,
          live: false
        }),
        new Fill(0, "Guy", "Guy0", "Barney", "Barney0", 14.0, 10),
        partially({
          trader: "Barney",
          side: Sides.Offer,
          price: 14.0,
          reqQty: 10,
          remainingQty: 0,
          live: false
        }),

        // the update for guy's order should show it is still live as it isnt filled
        partially({
          trader: "Guy",
          side: Sides.Bid,
          price: 10.0,
          reqQty: 50,
          remainingQty: 10,
          live: true
        })
      ];
      expect(orderUpdates.length).toEqual(expected.length);
      for (let i = 0; i++; i < expected.length) {
        expect(orderUpdates[i]).toEqual(expected);
      }
    });

    it("Provides order snapshots", () => {
      matcher.submit(new OrderRequest("Andrew", Sides.Bid, 13.0, 10));
      idGenerator["nextOrderId"] = 1;
      matcher.submit(new OrderRequest("Andrew", Sides.Bid, 14.0, 10));
      idGenerator["nextOrderId"] = 2;
      matcher.submit(new OrderRequest("Andrew", Sides.Offer, 16.0, 10));
      idGenerator["nextOrderId"] = 3;
      matcher.submit(new OrderRequest("Sonia", Sides.Bid, 14.0, 10));
      idGenerator["nextOrderId"] = 4;
      matcher.submit(new OrderRequest("Sonia", Sides.Offer, 16.0, 10));
      idGenerator["nextOrderId"] = 5;
      matcher.submit(new OrderRequest("Sam", Sides.Bid, 13.0, 10));

      expect(matcher.orderStatusSnapshot("Andrew").orders.length).toEqual(3);
      expect(matcher.orderStatusSnapshot("Sonia").orders.length).toEqual(2);
      expect(matcher.orderStatusSnapshot("Sam").orders.length).toEqual(1);
    });
  });
});
