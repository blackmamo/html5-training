const io = require("socket.io-client");
const socketUtils = require("./matcherCommon");

module.exports = serverPort => {
  let socket;
  return {
    name: "Socket Round Trip (Reused Connection)",
    defer: true,
    onStart: () => {
      socket = io("http://localhost:" + serverPort, { reconnect: true });
    },
    fn: deferred => {
      socketUtils.allFinished([socket]).then(() => {
        deferred.resolve();
      });
    },
    onComplete: () => {
      socket.disconnect();
    }
  };
};
