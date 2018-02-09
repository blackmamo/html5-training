const socketIo = require("socket.io");
const Side = require("../app/side");
const validate = require("../app/validator");
const DepthEvents = require("../app/depthEvents");
const DepthChanged = DepthEvents.DepthChanged,
  DepthRemoved = DepthEvents.DepthRemoved;
const OrderEvents = require("../app/orderEvents");
const OrderRequest = OrderEvents.OrderRequest,
  OrderStatus = OrderEvents.OrderStatus,
  Fill = OrderEvents.Fill;
const logger = require("winston");

class SocketController {
  logMeta(socket, trader, event) {
    let meta = { id: socket.id };
    if (trader) {
      meta["trader"] = trader;
    }
    if (event) {
      meta["event"] = event;
    }
    return meta;
  }

  constructor(server, matcher) {
    let io = socketIo(server);
    this.io = io;
    logger.info("Created socket controller", {
      serverPort: server.address().port
    });

    io.on("connection", socket => {
      let trader;
      socket.join("publicData");

      logger.debug("New connection", logMeta(socket));

      socket.on("setTraderId", data => {
        trader = data.traderId;
        socket.join(trader);

        logger.info("Trader logon", logMeta(socket, trader));

        let initalDepth = matcher.depthSnapshot();
        let initalOrders = matcher.orderStatusSnapshot(trader);

        logger.info("Initial depth", logMeta(socket, trader, initalDepth));
        socket.emit("DepthSnapshot", initalDepth);
        logger.info("Initial orders", logMeta(socket, trader, initalOrders));
        socket.emit("OrderSnapshot", initalOrders);
      });

      function processNewOrder(data) {
        let side = data.side === Side.Bid.side ? Side.Bid : Side.Offer;
        let request = new OrderRequest(trader, side, data.price, data.qty);
        let validationIssues = validate(request);
        if (validationIssues.length !== 0) {
          let rejection = new OrderStatus(
            null,
            request.trader,
            request.side,
            request.price,
            request.qty,
            request.qty,
            false,
            "Validation failed: " + validationIssues.join("; ")
          );
          logger.warn("Order rejected", logMeta(socket, trader, rejection));
          socket.emit("OrderStatus", rejection);
        } else {
          logger.info("Submitting order", logMeta(socket, trader, request));
          matcher.submit(request);
        }
      }

      socket.on("newOrder", data => {
        if (Array.isArray(data)) {
          for (let i = 0; i < data.length; i++) {
            processNewOrder(data[i]);
          }
        } else {
          processNewOrder(data);
        }
      });

      socket.on("clearBook", () => {
        logger.info("Attempting to clear order book", logMeta(socket, trader));
        matcher.clear();
      });

      // useful in finding the end of tests and for the client to check that the server is alive
      socket.on("sing", data => {
        logger.info("Responding to ping", logMeta(socket, trader, data));
        socket.emit("song", data);
      });

      socket.on("disconnect", () => {
        logger.info("Trader disconnecting", logMeta(socket, trader));
        socket.leave("publicData");
        socket.leave(trader);
      });
    });
  }

  sendUpdate(event) {
    if (event instanceof DepthChanged) {
      logger.info("Depth update", { event });
      this.io.to("publicData").emit("DepthChanged", event);
    } else if (event instanceof DepthRemoved) {
      logger.info("Depth removed", { event });
      this.io.to("publicData").emit("DepthRemoved", event);
    } else if (event instanceof OrderStatus) {
      logger.info("Order update", { event });
      this.io.to(event.trader).emit("OrderStatus", event);
    } else if (event instanceof Fill) {
      logger.info("Fill", { event });
      this.io.to(event.giver).emit("Fill", event);
      this.io.to(event.taker).emit("Fill", event);
    }
  }
}

module.exports = SocketController;
