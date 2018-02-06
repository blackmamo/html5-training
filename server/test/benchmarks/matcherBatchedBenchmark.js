var io = require("socket.io-client")
var socketUtils = require('./matcherCommon')

// Based on the main batcher test but with the setup orders batched
module.exports = function(serverPort){
    var loggedInPromises, socketA, socketB
    return {
        name: 'Matcher Via Socket (Batched Setup)',
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