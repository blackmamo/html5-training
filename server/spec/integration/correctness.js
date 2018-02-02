var partially = jasmine.objectContaining

describe("example", function() {
    // There has to be a nicer way than this? TODO require karma, look at args and this
    var serverPort =  __karma__.config.jasmine.serverPort
    var timeout =  __karma__.config.jasmine.timeout
    console.log("Connecting to server on port: "+__karma__.config.jasmine.serverPort)
    var socketA = io('http://localhost:'+serverPort, {reconnect:true});
    var socketB = io('http://localhost:'+serverPort, {reconnect:true});

    function trackOrders(socket){
        return new Promise(function(resolve, reject) {
            var details = {}
            socket.on('OrderSnapshot', function (snapShot) {
                details['snapshot'] = snapShot
                details['updates'] = []
                details['fills'] = []
                socket.on('OrderStatus', function (update) {
                    details.updates.push(update)
                })
                socket.on('Fill', function (fill) {
                    details.fills.push(fill)
                })
                resolve(details)
            })
        })
    }

    function promiseFinished(socket){
        var prm = new Promise(function(resolve, reject){
            socket.on('song',function(){
                resolve()
            })
        })
        socket.emit('sing',{foo:"hh"})
        return prm
    }

    it("Fills orders", function(done) {
        // listen for order updates, before logging in
        Promise.all([trackOrders(socketA), trackOrders(socketB)]).then(function(values){
            var updatesA = values[0], updatesB = values[1]

            socketA.emit('newOrder',{side: 0, price: 127.2, qty: 75})
            socketB.emit('newOrder',{side: 1, price: 127.2, qty: 75})

            Promise.all([promiseFinished(socketA),promiseFinished(socketB)]).then(function(){
                expect(updatesA.updates.length).toEqual(2)
                expect(updatesB.updates.length).toEqual(2)
                expect(updatesA.fills.length).toEqual(1)
                expect(updatesB.fills.length).toEqual(1)
                done()
            })
        })

        // log them in
        socketA.emit('setTraderId',{traderId: "Julia"})
        socketB.emit('setTraderId',{traderId: "Melissa"})
    }, timeout)

    it("Provides snapshots", function(done) {
        trackOrders(socketA).then(function(emptyDetails){
            // add some depth
            socketA.emit('newOrder',{side: 0, price: 127.2, qty: 75})
            socketA.emit('newOrder',{side: 1, price: 128.2, qty: 75})

            // setup part two which is to reconnect
            socket.on('disconnect', function() {
                socketA = io('http://localhost:'+serverPort, {reconnect:true})

                // prepare to capture depth
                var depthSnapshot
                socket.on('DepthSnapshot', function (snapshot) {
                    depthSnapshot = snapshot
                })

                // reconnect and validate
                trackOrders(socketA).then(function(details) {
                    expect(details.snapshot.length).toEqual(2)
                    expect(details.snapshot[0]).toEqual(partially({
                        side: 0, price: 127.2, qty: 75, live: true
                    }))
                    expect(details.snapshot[1]).toEqual(partially({
                        side: 1, price: 128.2, qty: 75, live: true
                    }))

                    expect(depthSnapshot.bids.length).toEqual(1)
                    expect(depthSnapshot.bids[0]).toEqual(partially({
                        price: 127.2, qty: 75
                    }))

                    expect(depthSnapshot.offers.length).toEqual(1)
                    expect(depthSnapshot.offers[0]).toEqual(partially({
                        price: 128.2, qty: 75
                    }))
                })
            });

            // trigger part 2
            socket.disconnect()
        })

        // log them in
        socketA.emit('setTraderId',{traderId: "Julia"})
    },timeout)
})