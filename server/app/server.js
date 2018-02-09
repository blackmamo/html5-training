const uuid = require("uuid/v1");
const Matcher = require("../app/matcher");
const SocketController = require("../app/controller");
const winston = require("winston");
const WinstonElastic = require("winston-elasticsearch");
const elasticsearch = require("elasticsearch");

const elasticClient = new elasticsearch.Client({
  host: process.env.ELKSERVER_PORT_9200_TCP_ADDR + ":9200",
  log: "info"
});

winston.configure({
  level: "info",
  transports: [
    new winston.transports.File({
      name: "loggerA",
      filename: "/usr/src/app/app/error.log",
      level: "error"
    }),
    new winston.transports.File({
      name: "loggerB",
      filename: "/usr/src/app/app/combined.log"
    }),
    new WinstonElastic({ level: "info", client: elasticClient })
  ]
});

// No need to return any html yet
function handler(req, res) {
  res.writeHead(500);
  return res.end("Error loading index.html");
}

const server = require("http").createServer(handler);
server.listen(8080);

let socketController;

function updateHandler(event) {
  socketController.sendUpdate(event);
}

const matcher = new Matcher(
  updateHandler,
  {
    getTradeId: () => {
      return uuid();
    },
    getOrderId: trader => {
      return uuid();
    }
  },
  process.argv.findIndex(arg => {
    arg === "--remove-dead-orders";
  }) === -1,
  process.argv.findIndex(arg => {
    arg === "--can-clear-book";
  }) === -1
);

socketController = new SocketController(server, matcher);
