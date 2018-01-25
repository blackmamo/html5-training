var socketIo = require('socket.io')
var OrderRequestValidator = require("../app/validator");
var DepthEvents = require("../app/depthEvents");
var DepthChanged = DepthEvents.DepthChanged, DepthRemoved = DepthEvents.DepthRemoved
var OrderEvents = require("../app/orderEvents");
var OrderRequest = OrderEvents.OrderRequest, OrderStatus = OrderEvents.OrderStatus,
    Fill = OrderEvents.Fill

function SocketController(server, matcher) {
    var io = socketIo(server)
    var validator = OrderRequestValidator()

    io.on('connection', function (socket) {
        var trader
        socket.join('publicData')

        socket.on('setTraderId', function (data) {
            trader = data.traderId
            socket.join(trader)
            var initalDepth = matcher.depthSnapshot()
            var initalOrders = matcher.orderStatusSnapshot(trader)
            socket.emit('depthSnapshot', initalDepth)
            socket.emit('orderSnapshot', initalOrders)
        });

        socket.on('newOrder', function(data){
            var request = new OrderRequest(data.trader, data.side, data.price, data.qty)
            var validationIssues = validator.validate(request)
            if (validationIssues.length !== 0) {
                var rejection = new OrderStatus(
                    null, order.trader, order.side, order.price, order.qty, order.qty, false,
                    "Validation failed: "+validationIssues.join("; "))
                socket.emit('OrderStatus', rejection)
            } else {
                matcher.submit(request)
            }
        })

        socket.on('disconnect', function () {
            socket.leave('publicData')
            socket.leave(trader)
        });
    });
}

SocketController.prototype.sendUpdate = function(event){
    if (event instanceof DepthChanged) {
        io.to('publicData').emit('DepthChanged', event)
    }
    else if (event instanceof DepthRemoved) {
        io.to('publicData').emit('DepthRemoved', event)
    }
    else if (event instanceof OrderStatus) {
        io.to(event.trader).emit('OrderStatus', event)
    }
    else if (event instanceof Fill) {
        io.to(event.giver).emit('Fill', event)
        io.to(event.taker).emit('Fill', event)
    }
}

module.exports = SocketController