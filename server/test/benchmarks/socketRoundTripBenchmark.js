const io = require("socket.io-client");
const socketUtils = require("./matcherCommon");

module.exports = serverPort => {
  return {
    name: "Socket Round Trip",
    defer: true,
    fn: deferred => {
      let socket = io("http://localhost:" + serverPort, { reconnect: true });

      socketUtils.allFinished([socket]).then(() => {
        socket.disconnect();
        deferred.resolve();
      });
    }
  };
};
