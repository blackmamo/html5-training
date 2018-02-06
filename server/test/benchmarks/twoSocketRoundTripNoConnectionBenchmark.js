var io = require("socket.io-client")
var socketUtils = require('./matcherCommon')

module.exports = function(serverPort){
    var socketA, socketB
    return {
        name: 'Two Socket Round Trip (Reused Connections)',
        defer: true,
        onStart: function(){
            socketA = io('http://localhost:' + serverPort, {reconnect: true});
            socketB = io('http://localhost:' + serverPort, {reconnect: true});
        },
        fn: function (deferred) {
            socketUtils.allFinished([socketA, socketB]).then(function () {
                deferred.resolve()
            })
        },
        onComplete: function(){
            socketA.disconnect()
            socketB.disconnect()
        }
    }
}