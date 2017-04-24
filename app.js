
var express = require('express');
var app = express();
var http = require('http').Server(app);
var p2 = require('p2');
//var planck = require('./planck.min.js');

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
  gameworld: {
    SCALE: 30,
    fps: 30
  },
  testnumber: 0,
  online: 0,
  bgs: ['stars','west','sunset'],
  currentbg: 'stars',
  block: {
    width: 72,
    height: 72,
    positions: [
      {x: 200, y: 150, vx: getRandomInt(-1000,1000), vy: getRandomInt(-1000,1000)},
      {x: 200, y: 744, vx: getRandomInt(-1000,1000), vy: getRandomInt(-1000,1000)},
      {x: 1008, y: 150, vx: getRandomInt(-1000,1000), vy: getRandomInt(-1000,1000)},
      {x: 1008, y: 744, vx: getRandomInt(-1000,1000), vy: getRandomInt(-1000,1000)}
    ]
  }
}
function Block(count) {
    this.body = new p2.Body({
      mass: 0.1,
      position: [S.block.positions[count].x, S.block.positions[count].y]
    });
    var boxShape = new p2.Box({width: S.block.width, height: S.block.height});
    this.body.addShape(boxShape); 

    this.body.damping = 0;
    world.addBody(this.body);
    this.constrainVelocity = function(maxVelocity) {
      //constraints the block's velocity to a specific number
      var body = this.body;
      var angle, currVelocitySqr, vx, vy;

      vx = body.data.velocity[0];
      vy = body.data.velocity[1];
      currVelocitySqr = vx * vx + vy * vy;
      
      angle = Math.atan2(vy, vx);
        
      vx = Math.cos(angle) * maxVelocity;
      vy = Math.sin(angle) * maxVelocity;
        
      body.data.velocity[0] = vx;
      body.data.velocity[1] = vy;
    };
}


var world = new p2.World({
  gravity: [0,0]
});

world.blocks = [];
for (i = 0; i < 4; i++) {
  world.blocks[i] = new Block(i);
  console.log(world.blocks[i].body);
  console.log("---------------------");
  }
world.on('postStep', function() {
  console.log('tick');
});

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
