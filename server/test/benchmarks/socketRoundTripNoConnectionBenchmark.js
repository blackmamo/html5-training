var io = require("socket.io-client")
var socketUtils = require('./matcherCommon')

module.exports = function(serverPort){
    var socket
    return {
        name: 'Socket Round Trip (Reused Connection)',
        defer: true,
        onStart: function(){
            socket = io('http://localhost:' + serverPort, {reconnect: true});
        },
        fn: function (deferred) {
            socketUtils.allFinished([socket]).then(function () {
                deferred.resolve()
            })
        },
        onComplete: function(){
            socket.disconnect()
        }
    }
}