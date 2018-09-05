
var testnumber = 0;
var online = 0;

var io = require('socket.io')(http,{});
io.sockets.on('connection', function(socket) {
  console.log('A player has connected.');
  online++
  socket.emit('numberChanged', testnumber);
  socket.on('bet', function(data) {
    console.log(data.player + ' has placed a bet.');
    testnumber++
    io.sockets.emit('numberChanged', testnumber);
  });
  socket.on('disconnect', function() {
    online--
  });
});
