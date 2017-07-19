var express = require('express');
var app = express();
var http = require('http').Server(app);
var p2 = require('p2');
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var CLIENT_ID = '1059212892170-025b6gqce44nra0o71rj2mikokrciaie.apps.googleusercontent.com';
var client = new auth.OAuth2(CLIENT_ID, '', '');
var fs = require('fs');
var usersFile = ('./server/users.json');
var users = require(usersFile);
//var planck = require('./planck.min.js');

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use('/',express.static(__dirname + '/'));
http.listen(3000);

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

var io = require('socket.io')(http,{});

/*console.log([['blah',200],['no',1],['BLAH',10000],['notatall',32]].sort(function(a, b) {
      return b[1] - a[1];
  })[0]);*/
//Server stuff.
var S = {
  gameworld: {
    SCALE: 30,
    fps: 30,
    width: 1280,
    //width: 1050,
    height: 920
  },
  //testnumber: 0,
  roundChanging: false,
  online: {},
  highScores: [],
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
    names: ["red","blue","green","orange"],
    skins: {
      "dapper": ["dapper","fancy","monacle"],
      "dice": ["dice","roll"],
      "rubix": ["rubix"],
      "kiwi": ["kiwi","new zealand", "newzealand"]
    },
    betPools: {
      "red": [],
      "blue": [],
      "green": [],
      "orange": []
    }
  },
  obstacles: [],
  obstacleData: [],
  obstacleCount: 0,
  winner: ''
}
  S.highScores.update = function() {
    S.highScores.splice(0,S.highScores.length)
    for (var player in S.online) {
        S.highScores.push([S.online[player].name, S.online[player].buxio]);
    }
    S.highScores.sort(function(a, b) {
        return b[1] - a[1];
    });
  }
function Obstacle(x,y,type,material) {
  this.type = type;
  S.obstacleCount++
  this.obstacleNumber = S.obstacleCount;
  this.body = new p2.Body({
    position: [x,y]
  });
  this.die = function(deathCase) {
    S.obstacles.splice(S.obstacles.indexOf(this),1);
    S.obstacleData.splice(S.obstacles.indexOf(this.info),1);
    world.removeBodies.push(this.body);
    console.log(type + " died.");
  };
  this.body.material = material;
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

function Speaker(x,y,type,material) {
  Obstacle.call(this,x,y,type,material);
  this.obstacleShape = new p2.Circle({ radius: 40});
  this.body.damaging = false;
  this.body.propelling = true;
  this.propellTime = 1000;
  this.body.addShape(this.obstacleShape);
  world.addBody(this.body);
}

function Saw(x,y,type,material) {
  Obstacle.call(this,x,y,type,material);
  this.timeout = setTimeout(function(saw) {
    if (!S.roundChanging) {
      saw.obstacleShape = new p2.Circle({ radius: 50});
      saw.body.damaging = true;
      saw.body.addShape(saw.obstacleShape);
      world.addBody(saw.body);
    }
  }, 2000,this);
  this.die = function(deathCase) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    S.obstacles.splice(S.obstacles.indexOf(this),1);
    S.obstacleData.splice(S.obstacles.indexOf(this.info),1);
    world.removeBodies.push(this.body);
    console.log(type + " died.");
  }
}

function spawnObstacle(x,y,type,owner) {
  switch (type) {
    case "Saw":
      var newObstacle = new Saw(x,y,type)
      S.online[owner].obstaclesOwned.Saw++
      break;
    case "Wall":
      var newObstacle = new Wall(x,y,type)
      S.online[owner].obstaclesOwned.Wall++
      break;
    case "Freeze":
      var newObstacle = new Freeze(x,y,type)
      S.online[owner].obstaclesOwned.Freeze++
      break;
    case "Speaker":
      var newObstacle = new Speaker(x,y,type)
      S.online[owner].obstaclesOwned.Speaker++
      break;
  }
  //console.log("New obstacle list",S.obstacles);
}

function Block(count) {
    this.count = count;
    this.skin = 'None';
    this.highestBidder = ['None',0];
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
    this.hp = 40;
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
      this.hp = 40;
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
      if (world.stunned || block.stunned) {
        block.constrainVelocity(0);
      } else if (block.propelled) {
        block.constrainVelocity(S.block.velocityConstant*2); 
      } else {
        block.constrainVelocity(S.block.velocityConstant);
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
    for (i = S.obstacles.length-1; i >= 0; i--) {
      S.obstacles[i].die();
    };
    S.roundChanging = true;
  } else {
      io.emit('worldTick',{
      positions: world.blocks.positions,
      angles: world.blocks.angles,
      velocities: world.blocks.velocities,
      hp: [
        world.blocks[0].hp,
        world.blocks[1].hp,
        world.blocks[2].hp,
        world.blocks[3].hp
      ],
      skins: [
        world.blocks[0].skin,
        world.blocks[1].skin,
        world.blocks[2].skin,
        world.blocks[3].skin
      ],
      obstacles: S.obstacleData,
      paused: world.stunned,
      highScores: S.highScores
    });
    /*console.log(
        world.blocks[0].skin,
        world.blocks[1].skin,
        world.blocks[2].skin,
        world.blocks[3].skin
    );*/
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
      //S.obstacles.splice(S.obstacles.indexOf(bodyB.parent),1);
      //S.obstacleData.splice(S.obstacleData.indexOf(bodyB.parent.info),1);
      bodyA.parent.stunned = true;
      setTimeout(function(stunnedBlock) {
        stunnedBlock.stunned = false;
      }, bodyB.parent.stunTime, bodyA.parent);
    }
    if (bodyB.propelling && bodyB.parent) {
      bodyA.parent.propelled = true;
      setTimeout(function(propelledBlock) {
        propelledBlock.propelled = false;
      }, bodyB.parent.propellTime, bodyA.parent);
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
      //S.obstacles.splice(S.obstacles.indexOf(bodyA.parent),1);
      //S.obstacleData.splice(S.obstacleData.indexOf(bodyA.parent.info),1);
      bodyB.parent.stunned = true;
      setTimeout(function(stunnedBlock) {
        stunnedBlock.stunned = false;
        stunnedBlock.constrainVelocity(S.block.velocityConstant);
      }, bodyA.parent.stunTime, bodyB.parent);
    }
    if (bodyA.propelling && bodyA.parent) {
      bodyB.parent.propelled = true;
      setTimeout(function(propelledBlock) {
        propelledBlock.propelled = false;
      }, bodyA.parent.propellTime, bodyB.parent);
    }
  }
});


io.sockets.on('connection', function(socket) {
  console.log('A player has connected.');
  console.log(socket.id);
  socket.emit('firstMessage', {
    //number: S.testnumber,
    bg: S.currentbg,
    positions: world.blocks.positions,
    angles: world.blocks.angles,
    velocities: world.blocks.velocities,
    deadBlocks: world.deadBlocks
  });
  console.log("Sent a first message");
  socket.on('googleSignIn', function(id_token) {
    console.log(id_token);
    client.verifyIdToken(
      id_token,
      CLIENT_ID,
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
      function(e, login) {
        var payload = login.getPayload();
        var userid = payload['sub'];
        socket.googleInfo = payload;
        console.log(payload,userid);
        if (!users[userid]) {
          if (S.online[socket.id] && S.online[socket.id].buxio) {
            var userbuxio = S.online[socket.id].buxio;
          } else {
            var userbuxio = 0;
          }
          users[userid] = {
            "email": payload.email, 
            "buxio": 0,
            "skins": []
          };
          fs.writeFile(usersFile, JSON.stringify(users,null,2), function (err) {
            if (err) return console.log(err);
            console.log(JSON.stringify(users));
            console.log('writing to ' + usersFile);
          });
        }
      });
  });
  socket.on('bet', function(data) {
    if (S.online[socket.id] && data.player && data.color && S.block.names.indexOf(data.color) > -1 && world.stunned) {
      console.log(S.online[socket.id].name + ' has placed a bet.');
      //Clean up previous bets
      if (S.online[socket.id].bettingOn /*&& S.online[socket.id].bettingOn != data.color*/) {
        console.log(S.block.betPools[S.online[socket.id].bettingOn],S.block.betPools[S.online[socket.id].bettingOn].indexOf([S.online[socket.id].name, S.online[socket.id].buxio]))
        var blahblah = S.block.betPools[S.online[socket.id].bettingOn].splice(
          S.block.betPools[S.online[socket.id].bettingOn].indexOf([S.online[socket.id].name, S.online[socket.id].buxio]),1
        );
        console.log("Cut out this old stuff:",blahblah);
        var blockObject = world.blocks[S.block.names.indexOf(S.online[socket.id].bettingOn)];
        //if (blockObject.highestBidder && blockObject.highestBidder[0] == S.online[socket.id].skin && blockObject.highestBidder[1] == S.online[socket.id].buxio) {
          if (S.block.betPools[S.online[socket.id].bettingOn].length > 0) {
            blockObject.highestBidder = 
              S.block.betPools[S.online[socket.id].bettingOn].sort(function(a, b) {
                  return b[1] - a[1];
              })[0];
              console.log(blockObject.highestBidder);
            for (var skin in S.block.skins) {
              var length = S.block.skins[skin].length;
              for (i = S.block.skins[skin].length-1; i >= 0; i--) {
                if (blockObject.highestBidder[0].toLowerCase().indexOf(S.block.skins[skin][i])!=-1) {
                    // their name contains a skin name
                    blockObject.skin = skin;
                }
              }
            }
          } else {
            blockObject.highestBidder = ['None', 0];
            blockObject.skin = 'None';
          }
        //}
      }
      //add new bets
      var blockObject = world.blocks[S.block.names.indexOf(data.color)];
      if (S.online[socket.id].skin != 'None' && (S.online[socket.id].buxio > blockObject.highestBidder[1] || blockObject.highestBidder[0] == 'None')) {
        blockObject.highestBidder = [S.online[socket.id].skin, S.online[socket.id].buxio];
        console.log("Highest skinned bidder on " + data.color + " is " + S.online[socket.id].name + " with a " + S.online[socket.id].skin);
        blockObject.skin = S.online[socket.id].skin;
      }
      S.online[socket.id].bettingOn = data.color;
      S.block.betPools[data.color].push([S.online[socket.id].name, S.online[socket.id].buxio]);
      console.log(S.online[socket.id].color,S.block.betPools);
    }
  });
  socket.on('obstacleBought', function(data) {
    if (S.online[socket.id] && !world.stunned) {
      console.log(data.player + ' has placed a ' + data.obstacle  + '.');
      if (S.online[socket.id].obstaclesOwned[data.obstacle] < 2) {
        spawnObstacle(data.x,data.y,data.obstacle,socket.id);
      }
      //io.sockets.emit('obstaclePlaced', {x: data.x, y: data.y, obstacle: newestObstacle});
      //io.to(socket.id).emit('obstacleVerified', newestObstacle.obstacleNumber);
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
      skin: 'None',
      obstaclesOwned: {
        Freeze: 0,
        Wall: 0,
        Saw: 0,
        Speaker: 0
      },
      socket: socket
    };
    if (socket.googleInfo) {
      var savedGoogleUser = users[socket.googleInfo["sub"]];
      S.online[socket.id].buxio = savedGoogleUser.buxio;
      S.online[socket.id].socket.emit("buxioChange", S.online[socket.id].buxio);
    }
    for (var skin in S.block.skins) {
      var length = S.block.skins[skin].length;
      for (i = S.block.skins[skin].length-1; i >= 0; i--) {
        if (name.toLowerCase().indexOf(S.block.skins[skin][i])!=-1) {
            // their name contains a skin name
            S.online[socket.id].skin = skin;
        }
      }
    }
    console.log(name + " has registered their name.");
    S.highScores.update();
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
    S.highScores.update();
  });
});

var changeRound = function() {
  S.roundChanging = false;
  console.log(S.winner);
  var buxioList = {};
  var betterCount = 0;
  Object.keys(S.block.betPools).forEach(function(pool) {
    betterCount += S.block.betPools[pool].length;
  });
  var payoutPool = betterCount * 10;
  var winnerPayout = Math.ceil(payoutPool/S.block.betPools[S.winner].length);
  Object.keys(S.block.betPools).forEach(function(pool) {
    S.block.betPools[pool] = [];
  });
  console.log("Pool: " + payoutPool + " Winners each get: " + winnerPayout);
  Object.keys(S.online).forEach(function(playerId) {
    if (S.online[playerId].bettingOn && S.online[playerId].bettingOn == S.winner) {
      S.online[playerId].buxio += winnerPayout;
      if (S.online[playerId].socket.googleInfo) {
        users[S.online[playerId].socket.googleInfo["sub"]].buxio += winnerPayout;
      }
      buxioList[S.online[playerId].name] = S.online[playerId].buxio;
      console.log(S.online[playerId].name + " just won! Total Buxio:",S.online[playerId].buxio);
      S.online[playerId].socket.emit("buxioChange", S.online[playerId].buxio);
      delete S.online[playerId].bettingOn;
    }
    for (var obstacle in S.online[playerId].obstaclesOwned) {
        S.online[playerId].obstaclesOwned[obstacle] = 0;
    }
  });
  var newbg = S.bgs[Math.floor(Math.random() * S.bgs.length)];
  world.blocks.forEach(function(block) {
    block.body.angularVelocity = 0;
    block.body.angle = 0;
    block.skin = 'None';
    block.highestBidder = ['None', 0];
    block.revive();
  });
  S.highScores.update();
  io.emit('newRound',{
    bg: newbg
  });
  buxioList = {};
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
