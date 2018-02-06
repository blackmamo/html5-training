var socketIo = require('socket.io')
var Side = require("../app/side")
var OrderRequestValidator = require("../app/validator");
var DepthEvents = require("../app/depthEvents");
var DepthChanged = DepthEvents.DepthChanged, DepthRemoved = DepthEvents.DepthRemoved
var OrderEvents = require("../app/orderEvents");
var OrderRequest = OrderEvents.OrderRequest, OrderStatus = OrderEvents.OrderStatus,
    Fill = OrderEvents.Fill
var logger = require('winston')

function socketMeta(socket){
    return {
        id: socket.id
    }
}

function logMeta(socket, trader, event){
    var meta = socketMeta(socket)
    meta['trader'] = trader
    if (event){
        meta['event'] = event
    }
    return meta
}

function SocketController(server, matcher) {
    var io = socketIo(server)
    this.io = io
    var validator = new OrderRequestValidator()
    logger.info('Created socket controller', {serverPort: server.address().port})

    io.on('connection', function (socket) {
        var trader
        socket.join('publicData')

        logger.debug('New connection', socketMeta(socket))

        socket.on('setTraderId', function (data) {
            trader = data.traderId
            socket.join(trader)

            logger.info('Trader logon', logMeta(socket, trader))

            var initalDepth = matcher.depthSnapshot()
            var initalOrders = matcher.orderStatusSnapshot(trader)

            logger.info('Initial depth', logMeta(socket, trader, initalDepth))
            socket.emit('DepthSnapshot', initalDepth)
            logger.info('Initial orders', logMeta(socket, trader, initalOrders))
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
                logger.warn('Order rejected', logMeta(socket, trader, rejection))
                socket.emit('OrderStatus', rejection)
            } else {
                logger.info('Submitting order', logMeta(socket, trader, request))
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

        socket.on('clearBook', function() {
            logger.info('Attempting to clear order book', logMeta(socket, trader))
            matcher.clear()
        })

        // useful in finding the end of tests and for the client to check that the server is alive
        socket.on('sing', function(data){
            logger.info('Responding to ping', logMeta(socket, trader, data))
            socket.emit('song',data)
        })

        socket.on('disconnect', function () {
            logger.info('Trader disconnecting', logMeta(socket, trader))
            socket.leave('publicData')
            socket.leave(trader)
        });
    });
}

SocketController.prototype.sendUpdate = function(event){
    if (event instanceof DepthChanged) {
        logger.info('Depth update', {event:event})
        this.io.to('publicData').emit('DepthChanged', event)
    }
    else if (event instanceof DepthRemoved) {
        logger.info('Depth removed', {event:event})
        this.io.to('publicData').emit('DepthRemoved', event)
    }
    else if (event instanceof OrderStatus) {
        logger.info('Order update', {event:event})
        this.io.to(event.trader).emit('OrderStatus', event)
    }
    else if (event instanceof Fill) {
        logger.info('Fill', {event:event})
        this.io.to(event.giver).emit('Fill', event)
        this.io.to(event.taker).emit('Fill', event)
    }
}

module.exports = SocketController