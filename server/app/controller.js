var socketIo = require('socket.io')
var Side = require("../app/side")
var OrderRequestValidator = require("../app/validator");
var DepthEvents = require("../app/depthEvents");
var DepthChanged = DepthEvents.DepthChanged, DepthRemoved = DepthEvents.DepthRemoved
var OrderEvents = require("../app/orderEvents");
var OrderRequest = OrderEvents.OrderRequest, OrderStatus = OrderEvents.OrderStatus,
    Fill = OrderEvents.Fill

function SocketController(server, matcher) {
    var io = socketIo(server)
    this.io = io
    var validator = new OrderRequestValidator()

    io.on('connection', function (socket) {
        var trader
        socket.join('publicData')

        socket.on('setTraderId', function (data) {
            trader = data.traderId
            socket.join(trader)
            var initalDepth = matcher.depthSnapshot()
            var initalOrders = matcher.orderStatusSnapshot(trader)
            socket.emit('DepthSnapshot', initalDepth)
            socket.emit('OrderSnapshot', initalOrders)
        });

        function processNewOrder(data){
            var side = data.side === Side.Bid.side ? Side.Bid : Side.Offer
            var request = new OrderRequest(trader, side, data.price, data.qty)
            var validationIssues = validator.validate(request)
            if (validationIssues.length !== 0) {
                var rejection = new OrderStatus(
                    null, request.trader, request.side, request.price, request.qty, request.qty, false,
                    "Validation failed: "+validationIssues.join("; "))
                socket.emit('OrderStatus', rejection)
            } else {
                matcher.submit(request)
            }
        }

        socket.on('newOrder', function(data){
            if (Array.isArray(data)){
                for (var i = 0; i < data.length; i++){
                    processNewOrder(data[i])
                }
            } else {
                processNewOrder(data)
            }
        })

        // useful in finding the end of tests and for the client to check that the server is alive
        socket.on('sing', function(data){
            socket.emit('song',data)
        })

        socket.on('disconnect', function () {
            socket.leave('publicData')
            socket.leave(trader)
        });
    });
}

SocketController.prototype.sendUpdate = function(event){
    if (event instanceof DepthChanged) {
        this.io.to('publicData').emit('DepthChanged', event)
    }
    else if (event instanceof DepthRemoved) {
        this.io.to('publicData').emit('DepthRemoved', event)
    }
    else if (event instanceof OrderStatus) {
        this.io.to(event.trader).emit('OrderStatus', event)
    }
    else if (event instanceof Fill) {
        this.io.to(event.giver).emit('Fill', event)
        this.io.to(event.taker).emit('Fill', event)
    }
}

module.exports = SocketController