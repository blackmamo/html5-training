var io = require("socket.io-client")

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

function testSocket(serverPort) {
    var socketA = io('http://localhost:' + serverPort, {reconnect: true});
    var socketB = io('http://localhost:' + serverPort, {reconnect: true});

    return {
        test: function (deferred) {
            Promise.all([doRoundTrip(socketA), doRoundTrip(socketB)]).then(function () {
                deferred.resolve()
            })
        },
        cleanup: function(){
            socketA.disconnect()
            socketB.disconnect()
        }
    }
}

module.exports = function(boundServerPort){
    var test = testSocket(boundServerPort)
    return {
        name: 'Two Socket Round Trip (Reused Connections)',
        defer: true,
        fn: test.test,
        onComplete: test.cleanup
    }
}