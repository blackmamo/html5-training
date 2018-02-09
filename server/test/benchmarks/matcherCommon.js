function loggedOn(socket) {
  return new Promise((resolve, reject) => {
    socket.once("OrderSnapshot", snapShot => {
      resolve();
    });
  });
}

function doRoundTrip(socket) {
  let prm = new Promise((resolve, reject) => {
    socket.once("song", () => {
      resolve();
    });
  });
  socket.emit("sing", {});
  return prm;
}

module.exports = {
  allLoggedOn: sockets => {
    return Promise.all(
      sockets.map(socket => {
        return loggedOn(socket);
      })
    );
  },
  allFinished: sockets => {
    return Promise.all(
      sockets.map(socket => {
        return doRoundTrip(socket);
      })
    );
  },
  disconnectAll: sockets => {
    sockets.map(socket => {
      return socket.disconnect();
    });
  }
};
