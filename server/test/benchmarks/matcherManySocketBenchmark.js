const io = require("socket.io-client");
const socketUtils = require("./matcherCommon");

// Based on the main matcher test but using more sockets
module.exports = serverPort => {
  let socketsPerSide = 4;
  let socketsA = [];
  let socketsB = [];
  let allSockets;
  let loggedInPromises;

  return {
    name: "Matcher Via Many Sockets",
    defer: true,
    onStart: () => {
      for (let i = 0; i < socketsPerSide; i++) {
        socketsA[i] = io("http://localhost:" + serverPort, { reconnect: true });
        socketsB[i] = io("http://localhost:" + serverPort, { reconnect: true });
      }

      allSockets = socketsA.concat(socketsB);
      loggedInPromises = socketUtils.allLoggedOn(allSockets);

      for (let i = 0; i < socketsPerSide; i++) {
        // log them in
        socketsA[i].emit("setTraderId", { traderId: "Julia" });
        socketsB[i].emit("setTraderId", { traderId: "Melissa" });
      }
    },
    fn: deferred => {
      // when we set the trader we can submit the orders and do the ping
      loggedInPromises.then(() => {
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            socketsA[i % socketsPerSide].emit("newOrder", {
              side: 0,
              price: 99 - i,
              qty: 1
            });
            socketsB[i % socketsPerSide].emit("newOrder", {
              side: 1,
              price: 101 + i,
              qty: 1
            });
          }
        }

        // These should fill all
        socketsA[0].emit("newOrder", { side: 0, price: 101 + i, qty: 100 });
        socketsB[0].emit("newOrder", { side: 1, price: 99 - i, qty: 100 });

        let pingPromises = socketUtils.allFinished(allSockets);

        pingPromises.then(() => {
          deferred.resolve();
        });
      });
    },
    onComplete: () => {
      socketUtils.disconnectAll(allSockets);
    }
  };
};
