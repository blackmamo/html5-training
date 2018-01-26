const uuid = require('uuid/v1');
var Matcher = require("../app/matcher");
var SocketController = require("../app/controller");

// No need to return any html yet
function handler (req, res) {
    res.writeHead(500);
    return res.end('Error loading index.html');
}

var server = require('http').createServer(handler)
server.listen(80)

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
    process.argv[0] == 'true')

socketController = new SocketController(server, matcher)