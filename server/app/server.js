const uuid = require('uuid/v1');
var Matcher = require("../app/matcher");
var SocketController = require("../app/controller");
var winston = require("winston");

// const logger = winston.configure({
//     level: 'info',
//     transports: [
//         new winston.transports.File({ name: 'loggerA', filename: '/usr/src/app/error.log', level: 'error' }),
//         new winston.transports.File({ name: 'loggerB', filename: '/usr/src/app/combined.log' })
//     ]
// });

// No need to return any html yet
function handler (req, res) {
    res.writeHead(500);
    return res.end('Error loading index.html');
}

var server = require('http').createServer(handler)
server.listen(8080)

var matcher, socketController

function updateHandler(event){
    socketController.sendUpdate(event)
}

matcher = new Matcher(
    updateHandler,
    {
        getTradeId: function() {return uuid()},
        getOrderId: function(trader) {return uuid()}
    },
    process.argv.findIndex(function(arg){arg === '--remove-dead-orders'}) === -1,
    process.argv.findIndex(function(arg){arg === '--can-clear-book'}) === -1)

socketController = new SocketController(server, matcher)