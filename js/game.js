var C = {
  game: {
    //width: window.innerWidth * window.devicePixelRatio,
    //height: window.innerHeight * window.devicePixelRatio,
    width: 1280,
    height: 920,
    number: ''
  },
  text: {
    style: {
      align: 'center',
      fill: "#ffffff",
      font: '50px Montserrat'
    },
    inputStyle: {
      fill: "#000",
      font: '24px Helvetica',
      fontWeight: 'bold',
      width: 260,
      height: 24,
      backgroundColor: '#f44e42',
      borderWidth: 4,
      borderColor: '#000',
      padding: 20,
      borderRadius: 20,
      max: 20,
      placeHolder: 'Anonymous',
    }
  },
  background: {
    width: 1280,
    height: 920,
    assets: {
      "stars": "assets/stars1.png",
      "west": "assets/west2.png",
      "sunset": "assets/sunset3.png"
    }
  },
  player: {
    name: 'Anonymous'
  },
  block: {
    width: 72,
    height: 72,
    velocity: 30,
    assets: {
      "red": "assets/redsquare.png",
      "blue": "assets/bluesquare.png",
      "green": "assets/greensquare.png",
      "orange": "assets/orangesquare.png"
    },
    names: ["red","blue","green","orange"]
  },
  obstacle: {
    width: 72,
    height: 72,
    offensive: ["saw"],
    defensive: ["wall","freeze"],
    assets: {
      "wall": "assets/red-circle.png",
      "freeze": "assets/blue-circle.png",
      "saw": "assets/sawbody.png",
      "sawblade": "assets/sawblade.png"
    }
  }
}

function Block(game,x,y,color,frame) {
  //this.sprite = game.blocks.create(x, y, color);
  console.log(x,y,color,frame);
  Phaser.Sprite.call(this, game, x, y, color);
  this.anchor.setTo(.5);
  //game.physics.p2.enable(this);
  //this.body.setCollisionGroup(C.block.blockCollisionGroup);
  //this.body.collideWorldBounds = true;
  //this.body.friction = 0;
  //this.body.restitution = 1;
  //this.body.velocity.x = velocityX;
  //this.body.velocity.y = velocityY;
  this.filters = [game.blurX, game.blurY];
  /*this.constrainVelocity = function(maxVelocity) {
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
  };*/
  this.syncBlock = function(x,y,angle) {
    this.x = x + C.game.width/2;
    this.y = y + C.game.height/2;
    /*this.body.x = x;
    this.body.y = y;*/
    this.angle = angle * (180/Math.PI);
  }
  this.lose = function(condition) {
    this.dying = true;
  }
  console.log(this);
  //game.stage.addChild(this);
  game.add.existing(this)
};

Block.prototype = Object.create(Phaser.Sprite.prototype);
Block.prototype.constructor = Block;
Block.prototype.update = function() {
    //this.constrainVelocity(C.block.velocity);
    if (this.dying) {
      this.angle += 10;
      this.alpha -= .05;
      if (this.alpha <= 0) {
        this.kill();
        this.dying = false;
        this.alpha = 1;
      }
    }
};

function ObstacleSpawner(game,x,y,type,frame) {
  console.log(x,y,type,frame);
  Phaser.Sprite.call(this, game, x, y, type);
  this.homeX = x;
  this.homeY = y;
  this.anchor.setTo(.5);
  this.filters = [game.blurX, game.blurY];
  this.inputEnabled = true;
  this.input.enableDrag();
  this.checkOutOfBounds = function() {
    if (this.x > C.game.width - 115 || this.x < 115 || this.y < 0 || this.y > C.game.height) {
      console.log("Failure.");
    } else {
      console.log("Success.");
      new Obstacle(game,this.x,this.y,type,frame);
    }
    this.x = this.homeX;
    this.y = this.homeY;
  }
  this.events.onDragStop.add(this.checkOutOfBounds,this);
  game.add.existing(this);
  this.width = C.obstacle.width;
  this.height = C.obstacle.height;
  if (type == "saw") {
    this.sawBlade = this.addChild(game.make.sprite(x,y,"sawblade"));
    this.sawBlade.width = C.obstacle.width;
    this.sawBlade.height = C.obstacle.height;
    this.sawBlade.anchor.setTo(.5);
    this.sawBlade.filters = [game.blurX, game.blurY];
  };
}

ObstacleSpawner.prototype = Object.create(Phaser.Sprite.prototype);
ObstacleSpawner.prototype.constructor = ObstacleSpawner;


function Obstacle(game,x,y,type,frame) {
  console.log(x,y,type,frame);
  Phaser.Sprite.call(this, game, x, y, type);
  this.anchor.setTo(.5);
  this.filters = [game.blurX, game.blurY];
  game.add.existing(this);
  this.width = C.obstacle.width;
  this.height = C.obstacle.height;
  if (type == "saw") {
    this.obstacleType = "saw";
    this.sawBlade = this.addChild(game.make.sprite(x,y,"sawblade"));
    this.sawBlade.width = C.obstacle.width;
    this.sawBlade.height = C.obstacle.height;
    this.sawBlade.anchor.setTo(.5);
    this.sawBlade.filters = [game.blurX, game.blurY];
  }
}
Obstacle.prototype = Object.create(Phaser.Sprite.prototype);
Obstacle.prototype.constructor = Obstacle;
Obstacle.prototype.update = function() {
  if (this.obstacleType && this.obstacleType == "saw") {
    this.sawBlade.angle += 10;
  }
};

class Boot {
  init() {
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.stage.disableVisibilityChange = true;
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.add.plugin(Fabrique.Plugins.InputField);
    game.load.script('filterX', '../filters/BlurX.js');
    //game.load.script('filterY', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurY.js');
    game.load.script('filterY', '../filters/BlurY.js');
    //console.log("%c||| Bootin' Bensio |||","color:#fdf6e3; background:#073642");
    /*We've gotten data. Do something with it.
      console.log(data);
    });*/
  }
  create() {
    game.state.start('Load')
  }
}

class Load {
  preload() {
    game.loadingText = game.add.text(game.world.centerX,game.world.centerY,"Loading",C.text.style);
    game.loadingText.anchor.setTo(.5);
    game.time.events.repeat(Phaser.Timer.SECOND, 10, function() {
       game.loadingText.text = game.loadingText.text + ".";
    }, this); 
    Object.keys(C.background.assets).forEach(function(assetName) {
      game.load.image(assetName, C.background.assets[assetName], C.background.width, C.background.height);
    });
    Object.keys(C.block.assets).forEach(function(assetName) {
      game.load.image(assetName, C.block.assets[assetName], C.block.width, C.block.height);
    });
    Object.keys(C.obstacle.assets).forEach(function(assetName) {
      game.load.image(assetName, C.obstacle.assets[assetName]);
    });
  }
  create() {
    //Create the blurry background at the start of the game.
    game.blurX = game.add.filter('BlurX');
    game.blurY = game.add.filter('BlurY');
    game.blurX.blur = 10;
    game.blurY.blur = 10;
    game.blurTweens = [];
    game.blurTweens[0] = game.add.tween(game.blurX).to({blur: 10}, 1000, Phaser.Easing.Linear.None);
    game.blurTweens[1] = game.add.tween(game.blurY).to({blur: 10}, 1000, Phaser.Easing.Linear.None);
    game.clearTweens = [];
    game.clearTweens[0] = game.add.tween(game.blurX).to({blur: 0}, 1000, Phaser.Easing.Linear.None);
    game.clearTweens[1] = game.add.tween(game.blurY).to({blur: 0}, 1000, Phaser.Easing.Linear.None);
    game.blurrify = function() {
      game.blurTweens.forEach(function(tween) {
        tween.start();
      });
    }
    game.clear = function() {
      game.clearTweens.forEach(function(tween) {
        tween.start();
      });
    }
    game.socket = io();
    game.socket.on('firstMessage',function(data) {
      game.bg = new Background(data.bg);
      C.game.number = data.number;
      game.clickCount = game.add.text(game.world.centerX,game.world.centerY,C.game.number,C.text.style);
      game.clickCount.anchor.setTo(.5);
      game.stage.disableVisibilityChange = true; 
      // Add physics
      /*
      game.world.setBounds(0, 0, C.game.width, C.game.height);
      game.physics.startSystem(Phaser.Physics.P2JS);
      game.physics.p2.setBoundsToWorld(true, true, true, true, true);
      game.physics.p2.setImpactEvents(true);
      C.block.blockCollisionGroup = game.physics.p2.createCollisionGroup(); 
      game.physics.p2.updateBoundsCollisionGroup();
      game.physics.p2.damping = 0;
      game.physics.p2.friction = 0;
      game.physics.p2.angularDamping = 0;
      game.physics.p2.restitution = 1;*/
      //create blocks

      if (!game.blocks) {
        game.blocks = game.add.group();
        game.blocks.classType = Block;
        game.offensiveSpawners = game.add.group();
        game.offensiveSpawners.classType = ObstacleSpawner;
        game.defensiveSpawners = game.add.group();
        game.defensiveSpawners.classType = ObstacleSpawner;
      } else {
        game.blocks.forEach(function(block) {
         if (!block.alive) {
          block.revive();
         }
        });
      }
      //game.blocks.enableBody = true;
      //game.blocks.physicsBodyType = Phaser.Physics.P2JS;
      game.blocks.positions = data.positions;
      game.blocks.velocities = data.velocities;
      game.blocks.deadBlocks = data.deadBlocks;
      game.clickCount.kill();
      game.loadingText.destroy();
      if (game.state.current == "Load") {
        game.state.start('MainMenu',false);
      }
    });
  }
}

class MainMenu {
  preload() {
    game.socket.on('newRound', function(data) {
      console.log('Round over.');
      game.blocks.forEach(function(block) {
        if (!block.alive) {
          block.revive();
          game.world.bringToTop(block);
        }
      });
      game.bg.changeBackground(data.bg);
    });
    game.socket.on('numberChanged',function(number) {
      C.game.number = number;
      game.clickCount.text = number.toString();
    });
  }
  create() {
    //game.bg.sprite.filters = [];
      for (var i = 0; i < C.obstacle.offensive.length; i++) {
        game.offensiveSpawners.create(game.width - C.obstacle.width/2, C.obstacle.height/2 + C.obstacle.height*i, C.obstacle.offensive[i]);
      }
      for (var i = 0; i < C.obstacle.defensive.length; i++) {
        game.defensiveSpawners.create(C.obstacle.width/2, C.obstacle.height/2 + C.obstacle.height*i, C.obstacle.defensive[i]);
      }
      if (game.blocks.length == 0) {
      for (var i = 0; i < C.block.names.length; i++) {
          var index = game.blocks.deadBlocks.indexOf(i);
          var lastBlock = game.blocks.create(game.blocks.positions[i][0],game.blocks.positions[i][1],C.block.names[i]);
          if (index > 0) {
            lastBlock.kill();
          }
          //lastBlock.body.velocity.x = game.blocks.velocities[i][0];
          //lastBlock.body.velocity.y = game.blocks.velocities[i][1];
          //Commented out to test. Uncomment later.
          /*
          lastBlock.body.angularDamping = 0;
          lastBlock.body.damping = 0;
          lastBlock.body.mass = 0.1;*/
      }
    }
    game.socket.on('killBlock',function(block) {
      var dyingBlock = game.blocks[block.number];
      dyingBlock.kill();
    });
    game.socket.on('worldTick',function(data) {
      for (var i = 0; i < game.blocks.length; i++) {
        //Include indexOf for IE later.
        if (data.deadBlocks && data.deadBlocks.indexOf(i) > -1 && game.blocks.children[i].alive) {
          game.blocks.children[i].lose();
          game.blocks.deadBlocks = data.deadBlocks;
        } else if (game.blocks.children[i].alive) {
          game.blocks.children[i].syncBlock(data.positions[i][0], data.positions[i][1],data.angles[i]);
        }
        //game.blocks.children[i].x = data.positions[i][0];
        //game.blocks.children[i].y = data.positions[i][1];
        //game.blocks.children[i].body.velocity.x = data.velocities[i][0];
        //game.blocks.children[i].body.velocity.y = data.velocities[i][1];
      }
    });
    game.bensioTitle = game.add.text(game.world.centerX,game.world.centerY - 200,"bensio",C.text.style);
    game.bensioTitle.anchor.setTo(.5);
    var input = game.add.inputField(game.world.centerX - C.text.inputStyle.width/2 - C.text.inputStyle.padding, game.world.centerY - C.text.inputStyle.height/2 - C.text.inputStyle.padding, C.text.inputStyle);
    input.blockInput = false;
    game.world.bringToTop(input);
    console.log(input);
    var enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    enter.onDown.add(function() {
      C.player.name = input.value || 'Anonymous';
      game.socket.emit('nameRegistered', C.player.name);
      input.destroy();
      game.state.start('Play',false);
    });
  }
}

class Play {
  create() {
    game.blocks.forEach(function(block) {
      block.revive();
    });
    console.log("Did it!")
    game.clear();
    game.clickCount.revive();
    //Deal with socket messages.
    this.input.onTap.add(function() {
      game.socket.emit('bet', {player: C.player.name});
    },this);
  }
}

function Background(currentkey) {
  this.randomBackground = function() {
      var keys = Object.keys(C.background.assets)
      return game.add.sprite(0,0,keys[ keys.length * Math.random() << 0]);
  };
  this.changeBackground = function(backgroundKey) {
    if (!backgroundKey) {
      this.sprite = this.randomBackground();
    } else {
      this.sprite.loadTexture(backgroundKey);
    }
    game.world.sendToBack(this.sprite);
  }

  this.blurrify = function() {
    
  }
  if (currentkey) {
    this.sprite = game.add.sprite(0,0,currentkey);
  } else {
    this.changeBackground();
  }
  //game.stage.addChild(this.sprite);
  //this.sprite.width = C.game.width;
  //this.sprite.height = C.game.height;
  
  this.sprite.anchor.setTo(.5);
  this.sprite.x = game.world.centerX;
  this.sprite.y = game.world.centerY;
  game.world.sendToBack(this.sprite);

  this.sprite.filters = [game.blurX, game.blurY];

}



var game = new Phaser.Game(C.game.width, C.game.height);
game.state.add('Boot',Boot);
game.state.add('Load',Load);
game.state.add('MainMenu',MainMenu);
game.state.add('Play',Play);
game.state.start('Boot');
