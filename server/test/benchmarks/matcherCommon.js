
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

module.exports = {
    allLoggedOn: function(sockets){
        return  Promise.all(sockets.map(function (socket) {return loggedOn(socket)}))
    },
    allFinished: function(sockets){
        return  Promise.all(sockets.map(function (socket) {return doRoundTrip(socket)}))
    },
    disconnectAll: function(sockets){
        sockets.map(function (socket) {return socket.disconnect()})
    }
}