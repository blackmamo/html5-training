var io = require("socket.io-client")
// These perf tests measure just the matcher in isolation

// I find it quite hard to do simple tests for the matcher, since the state that is built up
// will be giant, e.g. all the orders, and the depth in the book.
// I have modified things so that the store of orders can be turned off to stop that state build up
// being a concern. I have also had to design the tests so that each invocation leaves the depth empty
// This means that the test I concocted is:
//  1. Build depth on both sides of the market, 10 levels, with 10 orders each, all size 1
//  2. Submit orders that cross the spread and fill all of both sides, size 100, i.e. all depth consumed

function loggedOn(socket){
    return new Promise(function (resolve, reject){
        socket.once('OrderSnapshot', function (snapShot) {
            resolve()
        })
    })
}

function doRoundTrip(socket){
    var prm = new Promise(function(resolve, reject){
        socket.once('song',function(){
            resolve()
        })
    })
    socket.emit('sing',{})
    return prm
}
function testWithSockets(serverPort){
    var socketA = io('http://localhost:' + serverPort, {reconnect: true});
    var socketB = io('http://localhost:' + serverPort, {reconnect: true});

    var loggedInPromises = [loggedOn(socketA), loggedOn(socketB)]

    // log them in
    socketA.emit('setTraderId',{traderId: "Julia"})
    socketB.emit('setTraderId',{traderId: "Melissa"})

    return {
        test: function(deferred) {
            // when we set the trader we can submit the orders and do the ping
            Promise.all(loggedInPromises).then(function () {
                var aOrders = [], bOrders = []
                for (i = 0; i < 10; i++) {
                    for (j = 0; j < 10; j++) {
                        aOrders.push({side: 0, price: 99 - i, qty: 1})
                        bOrders.push({side: 1, price: 101 + i, qty: 1})
                    }
                }

                //batch send the setup orders
                socketA.emit('newOrder', aOrders)
                socketB.emit('newOrder', bOrders)

                    // These should fill all
                socketA.emit('newOrder', {side: 0, price: 101 + i, qty: 100})
                socketB.emit('newOrder', {side: 1, price: 99 - i, qty: 100})

                Promise.all([doRoundTrip(socketA), doRoundTrip(socketB)]).then(function () {
                    deferred.resolve()
                })
            })
        },
        cleanup: function(){
            socketA.disconnect()
            socketB.disconnect()
        }
    }
}

module.exports = function(boundServerPort){
    var test = testWithSockets(boundServerPort)
    return {
        name: 'Matcher Via Socket (Batched Setup)',
        defer: true,
        fn: test.test,
        onComplete: test.cleanup
    }
}