var io = require("socket.io-client")

function testSocket(serverPort) {
    return function (deferred) {
        var socket = io('http://localhost:' + serverPort, {reconnect: true});

        new Promise(function(resolve, reject){
            socket.once('song',function(){
                socket.disconnect()
                resolve()
            })
        }).then(function () {
            deferred.resolve()
        })
        socket.emit('sing',{})
    }
}

module.exports = function(boundServerPort){
    return {
        name: 'Socket Round Trip',
        defer: true,
        fn: testSocket(boundServerPort)
    }
}