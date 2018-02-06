var io = require("socket.io-client")
var socketUtils = require('./matcherCommon')

function testSocket(serverPort) {
    return
}

module.exports = function(serverPort){
    return {
        name: 'Socket Round Trip',
        defer: true,
        fn: function (deferred) {
            var socket = io('http://localhost:' + serverPort, {reconnect: true});

            socketUtils.allFinished([socket]).then(function () {
                socket.disconnect()
                deferred.resolve()
            })
        }
    }
}