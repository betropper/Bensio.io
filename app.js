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

var io = require('socket.io')(http,{});

//Server stuff.
var S = {
  gameworld: {
    SCALE: 30,
    fps: 30,
    //width: 1280,
    width: 1050,
    height: 920
  },
  //testnumber: 0,
  roundChanging: false,
  online: {},
  registeredNames: [],
  bgs: ['stars','west','sunset'],
  currentbg: 'stars',
  block: {
    width: 72,
    height: 72,
    velocityConstant: 500,
    positions: [
      {x: 200 - 1280/2, y: 150 - 920/2, vx: getRandomInt(-60,60), vy: getRandomInt(-60,60)},
      {x: 200 - 1280/2, y: 744 - 920/2, vx: getRandomInt(-60,60), vy: getRandomInt(-60,60)},
      {x: 1008 - 1280/2,y: 150 - 920/2, vx: getRandomInt(-60,60), vy: getRandomInt(-60,60)},
      {x: 1008 - 1280/2, y: 744 - 920/2, vx: getRandomInt(-60,60), vy: getRandomInt(-60,60)}
    ],
    names: ["red","blue","green","orange"]
  },
  obstacles: [],
  obstacleData: [],
  obstacleCount: 0,
  winner: ''
}
function Obstacle(x,y,type,material) {
  this.type = type;
  S.obstacleCount++
  this.obstacleNumber = S.obstacleCount;
  this.body = new p2.Body({
    position: [x,y]
  });
  this.body.material = material;
  this.die = function(deathCase) {
    world.removeBodies.push(this.body);
    console.log(type + " died.");
  };
  this.body.parent = this;
  this.info = {
    x: x,
    y: y,
    type: type,
    obstacleNumber: this.obstacleNumber
  };
  S.obstacles.push(this);
  S.obstacleData.push(this.info);
}

function Wall(x,y,type,material) {
  Obstacle.call(this,x,y,type,material);
  this.obstacleShape = new p2.Circle({ radius: 40});
  this.body.damaging = false;
  this.body.addShape(this.obstacleShape);
  world.addBody(this.body);
}

function Freeze(x,y,type,material) {
  Obstacle.call(this,x,y,type,material);
  this.obstacleShape = new p2.Circle({ radius: 40});
  this.body.damaging = false;
  this.body.stunning = true;
  this.stunTime = 2000;
  this.body.addShape(this.obstacleShape);
  world.addBody(this.body);
}

function Saw(x,y,type,material) {
  Obstacle.call(this,x,y,type,material);
  setTimeout(function(saw) {
    if (!S.roundChanging) {
      saw.obstacleShape = new p2.Circle({ radius: 50});
      saw.body.damaging = true;
      saw.body.addShape(saw.obstacleShape);
      world.addBody(saw.body);
    }
  }, 2000,this);
}

function spawnObstacle(x,y,type,owner) {
  switch (type) {
    case "Saw":
      var newObstacle = new Saw(x,y,type)
      //S.online[owner].obstaclesOwned.Saw.push(newObstacle);
      break;
    case "Wall":
      var newObstacle = new Wall(x,y,type)
      //S.online[owner].obstaclesOwned.Wall.push(newObstacle);
      break;
    case "Freeze":
      var newObstacle = new Freeze(x,y,type)
      //S.online[owner].obstaclesOwned.Freeze.push(newObstacle);
      break;
  }
  //console.log("New obstacle list",S.obstacles);
}

function Block(count) {
    this.count = count;
    this.body = new p2.Body({
      mass: 0.1,
      position: [S.block.positions[count].x, S.block.positions[count].y],
      velocity: [getRandomInt(-60,60), getRandomInt(-60,60)],
      damping: 0,
      angularDamping: 0
    });
    var boxShape = new p2.Box({width: S.block.width, height: S.block.height});
    this.body.addShape(boxShape); 
    this.body.damping = 0;
    world.addBody(this.body);
    this.body.parent = this;
    this.blockNumber = count;
    this.hp = 20;
    this.body.damaging = true;
    this.name = S.block.names[count];
    this.constrainVelocity = function(maxVelocity) {
      //constraints the block's velocity to a specific number
      var body = this.body;
      var angle, currVelocitySqr, vx, vy;
      vx = body.velocity[0];
      vy = body.velocity[1];
      currVelocitySqr = vx * vx + vy * vy;
      
      angle = Math.atan2(vy, vx);
        
      vx = Math.cos(angle) * maxVelocity;
      vy = Math.sin(angle) * maxVelocity;
        
      body.velocity[0] = vx;
      body.velocity[1] = vy;
    };
    this.die = function(deathCase) {
      world.removeBodies.push(this.body);
      world.deadBlocks.push(this.blockNumber);
    };
    this.revive = function(x,y) {
      var index = world.deadBlocks.indexOf(this.blockNumber);
      world.deadBlocks.splice(index,1);
      this.hp = 20;
      world.addBody(this.body);
      this.body.position = [S.block.positions[this.count].x, S.block.positions[this.count].y];
      this.body.velocity = [getRandomInt(-60,60), getRandomInt(-60,60)]; 
    };
}

var world = new p2.World({
  gravity: [0,0]
});

world.defaultContactMaterial.friction = 0;
world.defaultContactMaterial.restitution = 1;
/*world.obstacleMaterial = new p2.Material();
world.blockMaterial = new p2.Material();
var obstacleBlockContactMaterial = new p2.ContactMaterial(world.obstacleMaterial, world.blockMaterial, {
      friction : 0.03,
      restitution: 1
});
var blockBlockContactMaterial = new p2.ContactMaterial(world.blockMaterial, world.blockMaterial, {
      friction : 0.03,
      restitution: 1
});
console.log(obstacleBlockContactMaterial);
world.addContactMaterial(obstacleBlockContactMaterial);
world.addContactMaterial(blockBlockContactMaterial);*/
world.blocks = [];
world.deadBlocks = [];
world.removeBodies = [];
for (i = 0; i < 4; i++) {
  world.blocks[i] = new Block(i);
  //world.blocks[i].constrainVelocity(S.block.velocityConstant);
  //world.blocks[i].body.material = world.blockMaterial;
}
world.blocks.positions = [];
world.blocks.velocities = [];
world.blocks.angles = [];

//Create the world boundries

var floor = new p2.Body({
  position: [0,-S.gameworld.height/2]
});
floor.addShape(new p2.Plane());
var ceiling = new p2.Body({
  // radians
  angle: Math.PI,
  position: [0,S.gameworld.height/2]
});
ceiling.addShape(new p2.Plane());

var right = new p2.Body({
  angle: Math.PI / 2,
  position: [S.gameworld.width/2,0]
});
right.addShape(new p2.Plane());

var left = new p2.Body({
  angle: (3 * Math.PI) / 2,
  position: [-S.gameworld.width/2,0]
});

left.addShape(new p2.Plane());
left.damaging = true;
right.damaging = true;
floor.damaging = true;
ceiling.damaging = true;
/*left.material = world.obstacleMaterial;
right.material = world.obstacleMaterial;
floor.material = world.obstacleMaterial;
ceiling.material = world.obstacleMaterial;*/
world.addBody(left);
world.addBody(right);
world.addBody(floor);
world.addBody(ceiling);

var fixedTimeStep = 1/100; // seconds

setInterval(function(){
  // Move bodies forward in time
  world.step(fixedTimeStep);

}, 1000*fixedTimeStep);

//requestAnimationFrame(animate);

world.on('postStep', function() {
  for (var i = 0; i < world.removeBodies.length; i++) {
    world.removeBody(world.removeBodies[i]);
  }
  world.removeBodies.length = 0;
  world.blocks.forEach(function(block) {
    if (block.hp > 0) {
      //console.log(world.blocks[0].body.velocity[1]);
      if (!block.stunned && !world.stunned) {
        block.constrainVelocity(S.block.velocityConstant);
      } else if (world.stunned) {
        block.constrainVelocity(0);
      } else {
        block.constrainVelocity(0);
      }
      world.blocks.positions[block.count] = block.body.position;
      world.blocks.velocities[block.count] = block.body.velocity;
      world.blocks.angles[block.count] = block.body.angle;
    }
  });
  //console.log(world.blocks[0].body.position[0],world.blocks[0].body.velocity[0]);
  if (world.deadBlocks.length+1 >= world.blocks.length && !S.roundChanging) {
    for (i = 0; i < world.blocks.length; i++) {
      if (world.blocks[i].hp > 0) {
        S.winner = world.blocks[i].name;
        break;
      }
    }
    setTimeout(changeRound, 3000);
    S.roundChanging = true;
  } else {
      io.emit('worldTick',{
      positions: world.blocks.positions,
      angles: world.blocks.angles,
      velocities: world.blocks.velocities,
      deadBlocks: world.deadBlocks,
      obstacles: S.obstacleData,
      paused: world.stunned
    });
    //console.log(world.blocks.velocities[0]);
  }
});

world.on('beginContact', function(evt) {
  var bodyA = evt.bodyA;
  var bodyB = evt.bodyB;
  /*if (bodyA.parent) {
    console.log(bodyA.parent.name, bodyA.parent.hp);
  }
  if (bodyB.parent) {
    console.log(bodyB.parent.name,bodyB.parent.hp);
  }*/
  if (bodyA.parent && bodyA.parent.hp) {
    if (bodyB.damaging) {
      bodyA.parent.hp -= 1;
      if (bodyA.parent.hp <= 0) {
        bodyA.parent.die();
      }
    }
    if (bodyB.stunning && bodyB.parent) {
      bodyB.parent.die();
      S.obstacles.splice(S.obstacles.indexOf(bodyB.parent),1);
      S.obstacleData.splice(S.obstacleData.indexOf(bodyB.parent.info),1);
      bodyA.parent.stunned = true;
      setTimeout(function(stunnedBlock) {
        stunnedBlock.stunned = false;
      }, bodyB.parent.stunTime, bodyA.parent);
    }
  }
  if (bodyB.parent && bodyB.parent.hp) {
    if (bodyA.damaging) {
      bodyB.parent.hp -= 1;
      if (bodyB.parent.hp <= 0) {
        bodyB.parent.die();
      }
    }
    if (bodyA.stunning && bodyA.parent) {
      bodyA.parent.die();
      S.obstacles.splice(S.obstacles.indexOf(bodyA.parent),1);
      S.obstacleData.splice(S.obstacleData.indexOf(bodyA.parent.info),1);
      bodyB.parent.stunned = true;
      setTimeout(function(stunnedBlock) {
        stunnedBlock.stunned = false;
        stunnedBlock.constrainVelocity(S.block.velocityConstant);
      }, bodyA.parent.stunTime, bodyB.parent);
    }
  }
});


io.sockets.on('connection', function(socket) {
  console.log('A player has connected.');
  console.log(socket.id);
  socket.emit('firstMessage', {
    //number: S.testnumber,
    online: S.online,
    bg: S.currentbg,
    positions: world.blocks.positions,
    angles: world.blocks.angles,
    velocities: world.blocks.velocities,
    deadBlocks: world.deadBlocks,
    paused: world.stunned
  });
  socket.on('bet', function(data) {
    if (S.online[socket.id] && data.player && data.color && world.stunned) {
      console.log(data.player + ' has placed a bet.');
      S.online[socket.id].bettingOn = data.color;
    }
  });
  socket.on('obstacleBought', function(data) {
    if (S.online[socket.id] && !world.stunned) {
      console.log(data.player + ' has placed a ' + data.obstacle  + '.');
      spawnObstacle(data.x,data.y,data.obstacle,socket.id);
      //io.sockets.emit('obstaclePlaced', {x: data.x, y: data.y, obstacle: newestObstacle});
      //io.to(socket.id).emit('obstacleVerified', newestObstacle.obstacleNumber);
      //
    }
  });
  socket.on('nameRegistered', function(name) {
    var namenum = 1;
    while (S.registeredNames.indexOf(name) > -1) {
      name = name + namenum.toString();
      namenum++
    }
    console.log(S.registeredNames);
    S.registeredNames.push(name);
    S.online[socket.id] = {
      buxio: 0,
      name: name,
      obstaclesOwned: {
        Freeze: [],
        Wall: [],
        Saw: []
      }
    };
    console.log(name + " has registered their name.");
    console.log(S.online);
  });
  socket.on('disconnect', function(err) {
    //S.online.splice();
    if (S.online[socket.id]) {
      console.log(S.online[socket.id].name, 'has left the game.');
      S.registeredNames.splice(S.registeredNames.indexOf(S.online[socket.id].name));
      delete S.online[socket.id];
      console.log(S.online);
    }
  });
});

var changeRound = function() {
  S.roundChanging = false;
  console.log(S.winner);
  Object.keys(S.online).forEach(function(playerId) {
    if (S.online[playerId].bettingOn && S.online[playerId].bettingOn == S.winner) {
      S.online[playerId].buxio += 10;
      console.log(S.online[playerId].name + " just won! Total Buxio:",S.online[playerId].buxio);
      delete S.online[playerId].bettingOn;
    }
  });
  for (i = S.obstacles.length-1; i >= 0; i--) {
    S.obstacles[i].die();
  };
  S.obstacles = [];
  S.obstacleData = [];
  var newbg = S.bgs[Math.floor(Math.random() * S.bgs.length)];
  world.blocks.forEach(function(block) {
    block.body.angularVelocity = 0;
    block.body.angle = 0;
    block.revive();
  });
  io.emit('newRound',{
    bg: newbg,
  });
  world.stunned = true;
  setTimeout(function(world) {
    S.winner = '';
    world.stunned = false;
    io.sockets.emit('bettingFinished');
    world.blocks.forEach(function(block) {
      block.body.velocity = [getRandomInt(-60,60), getRandomInt(-60,60)]; 
    });
  }, 10000, world);
}
