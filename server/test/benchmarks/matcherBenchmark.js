var io = require("socket.io-client")
var socketUtils = require('./matcherCommon')

// I find it quite hard to do simple tests for the matcher, since the state that is built up
// will be giant, e.g. all the orders, and the depth in the book.
// I have modified things so that the store of orders can be turned off to stop that state build up
// being a concern. I have also had to design the tests so that each invocation leaves the depth empty
// This means that the test I concocted is:
//  1. Build depth on both sides of the market, 10 levels, with 10 orders each, all size 1
//  2. Submit orders that cross the spread and fill all of both sides, size 100, i.e. all depth consumed

module.exports = function(serverPort){
    var loggedInPromises, socketA, socketB
    return {
        name: 'Matcher Via Socket',
        defer: true,
        onStart: function(){
            socketA = io('http://localhost:' + serverPort, {reconnect: true});
            socketB = io('http://localhost:' + serverPort, {reconnect: true});

            loggedInPromises = socketUtils.allLoggedOn([socketA, socketB])

            // log them in
            socketA.emit('setTraderId',{traderId: "Julia"})
            socketB.emit('setTraderId',{traderId: "Melissa"})
        },
        fn: function(deferred) {
            // when we set the trader we can submit the orders and do the ping
           loggedInPromises.then(function () {
                for (i = 0; i < 10; i++) {
                    for (j = 0; j < 10; j++) {
                        socketA.emit('newOrder', {side: 0, price: 99 - i, qty: 1})
                        socketB.emit('newOrder', {side: 1, price: 101 + i, qty: 1})
                    }
                }

                // These should fill all
                socketA.emit('newOrder', {side: 0, price: 101 + i, qty: 100})
                socketB.emit('newOrder', {side: 1, price: 99 - i, qty: 100})

                socketUtils.allFinished([socketA, socketB]).then(function () {
                    deferred.resolve()
                })
            })
        },
        onComplete: function(){
            socketUtils.disconnectAll([socketA, socketB])
        }
    }
}