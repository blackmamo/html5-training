var io = require("socket.io-client")

function testSocket(serverPort) {
    var socket = io('http://localhost:' + serverPort, {reconnect: true});
    return {
        test: function (deferred) {

            new Promise(function(resolve, reject){
                socket.once('song',function(){
                    resolve()
                })
            }).then(function () {
                deferred.resolve()
            })
            socket.emit('sing',{})
        },
        cleanup: function(){
            socket.disconnect()
        }
    }
}

module.exports = function(boundServerPort){
    var test = testSocket(boundServerPort)
    return {
        name: 'Socket Round Trip (Reused Connection)',
        defer: true,
        fn: test.test,
        onComplete: test.cleanup
    }
}