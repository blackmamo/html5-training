const io = require("socket.io-client");
const socketUtils = require("./matcherCommon");

module.exports = serverPort => {
  let socketA, socketB;
  return {
    name: "Two Socket Round Trip (Reused Connections)",
    defer: true,
    onStart: () => {
      socketA = io("http://localhost:" + serverPort, { reconnect: true });
      socketB = io("http://localhost:" + serverPort, { reconnect: true });
    },
    fn: deferred => {
      socketUtils.allFinished([socketA, socketB]).then(() => {
        deferred.resolve();
      });
    },
    onComplete: () => {
      socketA.disconnect();
      socketB.disconnect();
    }
  };
};
