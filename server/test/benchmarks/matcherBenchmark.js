var io = require("socket.io-client")
// These perf tests measure just the matcher in isolation

// I find it quite hard to do simple tests for the matcher, since the state that is built up
// will be giant, e.g. all the orders, and the depth in the book.
// I have modified things so that the store of orders can be turned off to stop that state build up
// being a concern. I have also had to design the tests so that each invocation leaves the depth empty
// This means that the test I concocted is:
//  1. Build depth on both sides of the market, 10 levels, with 10 orders each, all size 1
//  2. Submit orders that cross the spread and fill all of both sides, size 100, i.e. all depth consumed

process.on('unhandledRejection', function(reason, p) {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
// application specific logging, throwing an error, or other logic here
});

function loggedOn(socket){
    return new Promise(function (resolve, reject){
        socket.on('OrderSnapshot', function (snapShot) {
            resolve()
        })
    })
}

function finished(socket){
    var prm = new Promise(function(resolve, reject){
        socket.on('song',function(){
            resolve()
        })
    })
    socket.emit('sing',{})
    return prm
}

function simpleTest(serverPort){
    return function(deferred) {
        var socketA = io('http://localhost:' + serverPort, {reconnect: true});
        var socketB = io('http://localhost:' + serverPort, {reconnect: true});

        // when we set the trader we can submit the orders and do the ping
        Promise.all([loggedOn(socketA), loggedOn(socketB)]).then(function () {
            for (i = 0; i < 10; i++) {
                for (j = 0; j < 10; j++) {
                    socketA.emit('newOrder', {side: 0, price: 99 - i, qty: 1})
                    socketB.emit('newOrder', {side: 1, price: 101 + i, qty: 1})
                }
            }

            // These should fill all
            socketA.emit('newOrder', {side: 0, price: 101 + i, qty: 100})
            socketB.emit('newOrder', {side: 1, price: 99 - i, qty: 100})

            Promise.all([finished(socketA), finished(socketB)]).then(function () {
                deferred.resolve()
            })
        })

        // log them in
        socketA.emit('setTraderId',{traderId: "Julia"})
        socketB.emit('setTraderId',{traderId: "Melissa"})
    }
}

module.exports = function(boundServerPort){
    return {
        name: 'SimpleTest',
            defer: true,
        fn: simpleTest(boundServerPort)
    }
}