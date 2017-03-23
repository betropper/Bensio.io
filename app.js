
var express = require('express');
var app = express();
var http = require('http').Server(app);

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use('/',express.static(__dirname + '/'));
http.listen(8061);

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

//Server stuff.
var S = {
  testnumber: 0,
  online: 0,
  bgs: ['stars','west','sunset'],
  currentbg: 'stars',
  block: {
    positions: [
      {x: 200, y: 150, vx: getRandomInt(-1000,1000), vy: getRandomInt(-1000,1000)},
      {x: 200, y: 744, vx: getRandomInt(-1000,1000), vy: getRandomInt(-1000,1000)},
      {x: 1008, y: 150, vx: getRandomInt(-1000,1000), vy: getRandomInt(-1000,1000)},
      {x: 1008, y: 744, vx: getRandomInt(-1000,1000), vy: getRandomInt(-1000,1000)}
    ]
  }
}

var io = require('socket.io')(http,{});

io.sockets.on('connection', function(socket) {
  console.log('A player has connected.');
  S.online++
  socket.emit('firstMessage', {
    number: S.testnumber,
    online: S.online,
    bg: S.currentbg,
    positions: S.block.positions
  });
  socket.on('bet', function(data) {
    console.log(data.player + ' has placed a bet.');
    S.testnumber++
    io.sockets.emit('numberChanged', S.testnumber);
  });
  socket.on('disconnect', function() {
    S.online--
  });
});

var changeRound = function() {
  var newbg = S.bgs[Math.floor(Math.random() * S.bgs.length)];
  io.emit('newRound',{
    bg: newbg,
    positions: S.block.positions
  });
}

setInterval(changeRound, 5000);
