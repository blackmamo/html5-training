const partially = jasmine.objectContaining;

describe("example", () => {
  // There has to be a nicer way than this? TODO require karma, look at args and this
  let serverPort = __karma__.config.jasmine.serverPort;
  let timeout = __karma__.config.jasmine.timeout;
  console.log(
    "Connecting to server on port: " + __karma__.config.jasmine.serverPort
  );
  let socketA = io("http://localhost:" + serverPort, { reconnect: true });
  let socketB = io("http://localhost:" + serverPort, { reconnect: true });

  function trackOrders(socket) {
    return new Promise((resolve, reject) => {
      let details = {};
      socket.on("OrderSnapshot", snapShot => {
        details["snapshot"] = snapShot;
        details["updates"] = [];
        details["fills"] = [];
        socket.on("OrderStatus", update => {
          details.updates.push(update);
        });
        socket.on("Fill", fill => {
          details.fills.push(fill);
        });
        resolve(details);
      });
    });
  }

  function promiseFinished(socket) {
    let prm = new Promise((resolve, reject) => {
      socket.on("song", () => {
        resolve();
      });
    });
    socket.emit("sing", { foo: "hh" });
    return prm;
  }

  it(
    "Fills orders",
    done => {
      // empty the book for repeatability
      socketA.emit("clearBook", {});

      // listen for order updates, before logging in
      Promise.all([trackOrders(socketA), trackOrders(socketB)]).then(values => {
        let updatesA = values[0],
          updatesB = values[1];

        socketA.emit("newOrder", { side: 0, price: 127.2, qty: 75 });
        socketB.emit("newOrder", { side: 1, price: 127.2, qty: 75 });

        Promise.all([promiseFinished(socketA), promiseFinished(socketB)]).then(
          () => {
            expect(updatesA.updates.length).toEqual(2);
            expect(updatesB.updates.length).toEqual(2);
            expect(updatesA.fills.length).toEqual(1);
            expect(updatesB.fills.length).toEqual(1);
            done();
          }
        );
      });

      // log them in
      socketA.emit("setTraderId", { traderId: "Julia" });
      socketB.emit("setTraderId", { traderId: "Melissa" });
    },
    timeout
  );

  it(
    "Provides snapshots",
    function(done) {
      trackOrders(socketA).then(emptyDetails => {
        // empty the book for repeatability
        socketA.emit("clearBook", {});

        // add some depth
        socketA.emit("newOrder", { side: 0, price: 127.2, qty: 75 });
        socketA.emit("newOrder", { side: 1, price: 128.2, qty: 75 });

        promiseFinished(socketA).then(() => {
          // setup part two which is to reconnect
          socketA.on("disconnect", () => {
            socketA = io("http://localhost:" + serverPort, { reconnect: true });

            // prepare to capture depth
            let depthSnapshot;
            socketA.on("DepthSnapshot", snapshot => {
              depthSnapshot = snapshot;
            });

            // reconnect and validate
            trackOrders(socketA).then(details => {
              expect(details.snapshot.orders.length).toEqual(2);
              expect(details.snapshot.orders[0]).toEqual(
                partially({
                  side: { side: 0 },
                  price: 127.2,
                  reqQty: 75,
                  live: true
                })
              );
              expect(details.snapshot.orders[1]).toEqual(
                partially({
                  side: { side: 1 },
                  price: 128.2,
                  reqQty: 75,
                  live: true
                })
              );

              expect(depthSnapshot.bids.length).toEqual(1);
              expect(depthSnapshot.bids[0]).toEqual(
                partially({
                  price: 127.2,
                  qty: 75
                })
              );

              expect(depthSnapshot.offers.length).toEqual(1);
              expect(depthSnapshot.offers[0]).toEqual(
                partially({
                  price: 128.2,
                  qty: 75
                })
              );

              done();
            });

            // log them in
            socketA.emit("setTraderId", { traderId: "Julia" });
          });

          // trigger part 2
          socketA.disconnect();
        });
      });

      // log them in
      socketA.emit("setTraderId", { traderId: "Julia" });
    },
    timeout
  );
});
