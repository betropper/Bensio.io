function convertSet(a1) {
  // Contents check
  var len = a1.length;
  var numblist1 = [];
  for (i = 0; i < len; i++) {
    if (a1[i].obstacleNumber) {
      numblist1.push(a1[i].obstacleNumber); 
    }
  }
  return numblist1;
}

function compareSets(a1, a2) {
  if (a1.length !== a2.length) { return false; }
  if (a1.sort().join('|') === a2.sort().join('|')) {
      return true;
  } else {
      return false;
  }
}

var C = {
  game: {
    //width: window.innerWidth * window.devicePixelRatio,
    //height: window.innerHeight * window.devicePixelRatio,
    width: 1280,
    height: 920
    //number: ''
  },
  text: {
    style: {
      align: 'center',
      fill: "#ffffff",
      font: '50px Montserrat'
    },
    scoreStyle: {
      align: 'center',
      fill: "#ffffff",
      font: '30px Montserrat'
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
      placeHolder: sessionStorage.getItem('userName') || 'Anonymous',
    }
  },
  background: {
    width: 1280,
    height: 1280,
    assets: {
      "stars": "assets/stars1.png",
      "west": "assets/west2.png",
      "sunset": "assets/sunset3.png"
    }
  },
  player: {
    name: 'Anonymous',
    obstaclesOwned: {
      Freeze: 0,
      Wall: 0,
      Saw: 0,
      Speaker: 0
    },
    bettingOn: ''
  },
  block: {
    width: 72,
    height: 72,
    velocity: 70,
    assets: {
      "red": "assets/redsquare.png",
      "blue": "assets/bluesquare.png",
      "green": "assets/greensquare.png",
      "orange": "assets/orangesquare.png"
    },
    skins: {
      "dapper": "assets/skins/dapper.png",
      "dice": "assets/skins/6die.png",
      "kiwi": "assets/skins/kiwi.png"
    },
    names: ["red","blue","green","orange"],
    hp: []
  },
  obstacle: {
    width: 72,
    height: 72,
    offensive: ["Saw","Speaker"],
    defensive: ["Wall","Freeze"],
    data: {
      "Wall": {
        source: "assets/wall.png",
        scale: .25,
        max: 2
      },
      "Freeze": {
        source: "assets/freeze.png",
        scale: .5,
        max: 2
      },
      "FreezeAura": {
        source: "assets/freezeaura.png",
        scale: .2,
      },
      "Saw": {
        source: "assets/sawbody.png",
        scale: .25,
        max: 2
      },
      "SawBlade": {
        source: "assets/sawblade.png",
        scale: 1,
      },
      "Speaker": {
        source: "assets/speaker.png",
        scale: .3,
        max: 2
      }
    }
  }
}

function Block(game,x,y,color,frame) {
  //this.sprite = game.blocks.create(x, y, color);
  console.log(x,y,color,frame);
  Phaser.Sprite.call(this, game, x, y, color);
  this.anchor.setTo(.5);
  this.color = color;
  //this.scale = game.bg.scale;
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
  this.syncBlock = function(x,y,rotation) {
    //this.x = x + C.game.width/2;
    //this.y = y + C.game.height/2;
    this.x = x*game.bg.sprite.scale.x + game.width/2;
    this.y = y*game.bg.sprite.scale.y + game.height/2;
    /*this.body.x = x;
    this.body.y = y;*/
    //this.body.angle = angle * (180/Math.PI);
    this.rotation = rotation;
    if (this.skin) {
      this.skin.x = this.x;
      this.skin.y = this.y;
      this.skin.rotation = this.rotation;
    }
  }
  this.changeSkin = function(skin) {
    if (skin == 'None') {
      if (this.skin) {
        this.skin.destroy();
      } else {
        return;
      }
    } else if (!this.skin) {
      this.skin = game.add.sprite(this.x, this.y, skin);
      this.skin.anchor.setTo(.5);
      this.skin.rotation = this.rotation;
      this.skin.width = this.width;
      this.skin.height = this.height;
    } else if (skin != this.skin.key) {
      this.skin.loadTexture(skin);
    }
    game.world.bringToTop(this.skin);
  }
  this.enableBetting = function(state) {
    if (game.state.current == "Play") {
      if (state == true) {
        if (!this.alive) {
          this.revive();
        }
        C.player.bettingOn = '';
        game.userDisplay.bensioTitle.betStateTween = game.add.tween(game.userDisplay.bensioTitle).to({y: game.world.centerY, alpha: 1}, 1000, Phaser.Easing.Linear.None, true)
        game.userDisplay.bensioTitle.text = "Click on a block to join its team."
        game.userDisplay.noBets.text = ""
        this.inputEnabled = true;
        this.bettingEnabled = true;
        this.events.onInputUp.add(function() {
          for (i = 0; i < game.blocks.children.length; i++) {
            game.blocks.children[i].tint = 0xffffff;
          }
          this.tint = 0x686868;
          game.userDisplay.noBets.alpha = 0;
          game.userDisplay.bettingOn.loadTexture(this.key);
          game.userDisplay.bettingOn.alpha = 1;
          game.userDisplay.bettingHP.alpha = 1;
          C.player.bettingOn = this.key;
          game.socket.emit('bet', {player: C.player.name, color: this.key});
        },this);
        this.events.onInputOver.add(function() {
          this.hoverTween = game.add.tween(this.scale).to({x: game.bg.sprite.scale.x*1.5, y: game.bg.sprite.scale.y*1.5}, 400, Phaser.Easing.Linear.None, true, 0, -1, true);
        }, this);
        this.events.onInputOut.add(function() {
          this.hoverTween.stop();
          this.scale.setTo(game.bg.sprite.scale.x);
        }, this);
      } else {
        if (game.userDisplay.bensioTitle.betStateTween) {
          game.userDisplay.bensioTitle.betStateTween.stop();
          game.userDisplay.bensioTitle.betStateTween = undefined;
        }
        for (i = 0; i < game.blocks.children.length; i++) {
          game.blocks.children[i].tint = 0xffffff;
        }
        game.userDisplay.bensioTitle.alpha = 0;
        game.userDisplay.bensioTitle.text = "bensio";
        if (game.userDisplay.bettingOn.alpha == 0) {
          game.userDisplay.noBets.alpha = 1;
        }
        game.userDisplay.noBets.text = "No side chosen!"
        game.userDisplay.bensioTitle.y = game.world.centerY - 200;
        this.inputEnabled = false;
        this.bettingEnabled = false;
        this.events.onInputOver._bindings = [];
        this.events.onInputOut._bindings = [];
        if (this.hoverTween) {
          this.hoverTween.stop();
          this.scale.setTo(game.bg.sprite.scale.x);
        }
      }
    }
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

    if (this.skin) {
      this.skin.height = this.height;
      this.skin.width = this.width;
    }
    if (this.dying) {
      this.angle += 10;
      this.alpha -= .05;
      if (this.skin) {
        this.angle += 10;
        this.alpha -= .05;
      }
      if (this.alpha <= 0) {
        if (this.skin) {
          this.skin.destroy();
        }
        this.kill();
        this.dying = false;
        this.alpha = 1;
      }
    } else if (game.status == "Finishing" && this.winner) {
        this.angle += 10;
    } else if (game.status != "Finishing") {
        if (this.victoryTween) {
          this.victoryTween.stop();
          this.victoryTween = null;
        }
        if (this.winner) {
          this.winner = false;
        }
    }
};

function ObstacleSpawner(game,x,y,type,frame) {
  console.log(x,y,type,frame);
  Phaser.Sprite.call(this, game, x, y, type, frame);
  this.homeX = x;
  this.homeY = y;
  this.type = type;
  this.anchor.setTo(.5);
  this.obstacleType = type;
  this.filters = [game.blurX, game.blurY];
  this.inputEnabled = true;
  this.attach = function() {
    if (!this.dragged) {
      this.homeX = this.x;
      this.homeY = this.y;
      this.dragged = true;
    } else if (this.dragged) {
      this.checkOutOfBounds();
      this.dragged = false;
    }
  }
  this.createInstanceOf = function() {
    if (game.status == "Ongoing") {
      /*if (window[this.obstacleType]) {
        var tempObst = new window[this.obstacleType](game,this.x,this.y,type);
      } else {
        var tempObst = new Obstacle(game,this.x,this.y,type);
      }*/
      var tempObst = game.add.sprite(this.x,this.y,type);
      tempObst.anchor.setTo(.5);
      tempObst.scale.setTo(C.obstacle.data[type].scale*game.bg.sprite.scale.x);
      tempObst.lifespan = 100;
      /*game.time.events.add(Phaser.Timer.SECOND * .1, function() {
        this.destroy();
      }, tempObst);*/
      /*if (this.obstacleType == "Saw") {
        new Saw(game,this.x,this.y,type,frame);
      } else {
        new Obstacle(game,this.x,this.y,type,frame);
    }*/
      game.socket.emit('obstacleBought', {player: C.player.name, obstacle: this.obstacleType, x: (this.x-game.width/2)/game.bg.sprite.scale.x, y: (this.y-game.height/2)/game.bg.sprite.scale.y});
      C.player.obstaclesOwned[this.obstacleType]++
      if (C.player.obstaclesOwned[this.obstacleType] >= C.obstacle.data[type].max) {
        this.kill();
      }
    }
  }
  this.checkOutOfBounds = function(pointer) {
    console.log(this);
    console.log("Checking out of bounds...");
    if (pointer) {
      this.x = pointer.x;
      this.y = pointer.y;
    }
    if (this.x > game.width - ((game.width-game.bg.sprite.width)/2) || this.x < (game.width-game.bg.sprite.width)/2 || this.y < (game.height-game.bg.sprite.height)/2 || this.y > game.height - ((game.height-game.bg.sprite.height)/2) ) {
      console.log("Failure.");
    } else {
      console.log("Success.");
      this.createInstanceOf();
    }
    this.x = this.homeX;
    this.y = this.homeY;
  }
  game.add.existing(this);
  //REMOVE THIS LATER THIS IS BAD CODE. RESIZE THE SPRITE INSTEAD.
  this.scale.setTo(C.obstacle.data[type].scale*game.bg.sprite.scale.x);
  this.events.onDragStart.add(function() {
    this.scale.setTo(C.obstacle.data[type].scale*game.bg.sprite.scale.x*1.5);
  }, this);
  this.events.onDragStop.add(function() {
    this.scale.setTo(C.obstacle.data[type].scale*game.bg.sprite.scale.x); 
  }, this);
}

ObstacleSpawner.prototype = Object.create(Phaser.Sprite.prototype);
ObstacleSpawner.prototype.constructor = ObstacleSpawner;
ObstacleSpawner.prototype.update = function() {
  if (this.dragged) {
    this.x = game.input.mousePointer.x
    this.y = game.input.mousePointer.y
  }
};

function Obstacle(game,x,y,type,frame) {
  console.log(x,y,type,frame);
  Phaser.Sprite.call(this, game, x, y, type);
  this.anchor.setTo(.5);
  this.scale.setTo(C.obstacle.data[type].scale*game.bg.sprite.scale.x); 
  this.filters = [game.blurX, game.blurY];
  game.localObstacles.push(this);
  game.add.existing(this);
  this.clean = function() {
    this.destroy();
  }
  this.syncScale = function() {
    this.scale.setTo(C.obstacle.data[type].scale*game.bg.sprite.scale.x);
    this.x = this.sentX*game.bg.sprite.scale.x + game.width/2;
    this.y = this.sentY*game.bg.sprite.scale.y + game.height/2;
  }
  this.tweenTint = function(obj, startColor, endColor, time, yoyo, repeat) {
    var repeat = repeat || 0;
    // create an object to tween with our step value at 0   
    var colorBlend = {step: 0};
    // create the tween on this object and tween its step property to 100
    var colorTween = game.add.tween(colorBlend).to({step: 100}, time, Phaser.Easing.Linear.None, false, 0, repeat);
    // run the interpolateColor function every time the tween updates, feeding it the updated value of our tween each time, and set the result as our tint
    colorTween.onUpdateCallback(function() { 
      obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
    });
    // set the object to the start color straight away
    obj.tint = startColor;
    // start the tween
    colorTween.start();
    if (yoyo && repeat) {
      colorTween.yoyo(true,repeat);
    } else if (yoyo) {
      colorTween.yoyo(true);
    }
  }
}
Obstacle.prototype = Object.create(Phaser.Sprite.prototype);
Obstacle.prototype.constructor = Obstacle;
Obstacle.prototype.update = function() {

};

function Wall(game,x,y,name,frame) {
  Obstacle.call(this,game,x,y,name);
}
Wall.prototype = Object.create(Phaser.Sprite.prototype);
Wall.prototype.constructor = Wall;
Wall.prototype.update = function() {

};

function Speaker(game,x,y,name,frame) {
  Obstacle.call(this,game,x,y,name);
  game.add.tween(this.scale).to( {x: C.obstacle.data["Speaker"].scale*game.bg.sprite.scale.x*1.2, y: C.obstacle.data["Speaker"].scale*game.bg.sprite.scale.x*1.2}, 50, Phaser.Easing.Linear.In, true, 0, -1).yoyo(true).repeatDelay(500);
}
Speaker.prototype = Object.create(Phaser.Sprite.prototype);
Speaker.prototype.constructor = Wall;
Speaker.prototype.update = function() {

};

function Saw(game,x,y,name,frame) {
  Obstacle.call(this, game, x, y, name);
  this.sawBlade = game.add.sprite(this.x,this.y,"SawBlade");
  game.add.existing(this.sawBlade);
  this.sawBlade.anchor.setTo(.5);
  this.sawBlade.filters = [game.blurX, game.blurY];
  this.sawBlade.scale.setTo(.01);
  this.sawBlade.x += 1.7;
  this.sawBlade.y += 1.2;
  //this.scale.setTo(.2);
  game.world.bringToTop(this);
  this.clean = function() {
    this.sawBlade.destroy();
    this.destroy();
  }
  this.syncScale = function() {
    this.scale.setTo(C.obstacle.data["Saw"].scale*game.bg.sprite.scale.x);
    this.sawBlade.scale.setTo(C.obstacle.data["SawBlade"].scale*game.bg.sprite.scale.x);
    this.x = this.sentX*game.bg.sprite.scale.x + game.width/2;
    this.y = this.sentY*game.bg.sprite.scale.y + game.height/2;
    this.sawBlade.x = this.x + 1.7*game.bg.sprite.scale.x;
    this.sawBlade.y = this.y + 1.2*game.bg.sprite.scale.y;
  }
}
Saw.prototype = Object.create(Phaser.Sprite.prototype);
Saw.prototype.constructor = Saw;
Saw.prototype.update = function() {
  this.sawBlade.angle += 20;
  if (this.sawBlade.scale.x < C.obstacle.data["SawBlade"].scale*game.bg.sprite.scale.x) {
    this.sawBlade.scale.setTo(this.sawBlade.scale.x + .02*game.bg.sprite.scale.x);
  }
};

function Freeze(game,x,y,name,frame) {
  Obstacle.call(this, game, x, y, name);
  this.aura = game.add.sprite(this.x,this.y,"FreezeAura");
  game.add.existing(this.aura);
  this.aura.anchor.setTo(.5);
  this.aura.scale.setTo(C.obstacle.data["FreezeAura"].scale*game.bg.sprite.scale.x);
  this.aura.filters = [game.blurX, game.blurY];
  this.syncScale = function() {
    this.scale.setTo(C.obstacle.data["Freeze"].scale*game.bg.sprite.scale.x);
    this.aura.scale.setTo(C.obstacle.data["FreezeAura"].scale*game.bg.sprite.scale.x);
    this.x = this.sentX*game.bg.sprite.scale.x + game.width/2;
    this.y = this.sentY*game.bg.sprite.scale.y + game.height/2;
    this.aura.x = this.sentX*game.bg.sprite.scale.x + game.width/2;
    this.aura.y = this.sentY*game.bg.sprite.scale.y + game.height/2;
  }
  game.world.bringToTop(this);
  this.pulseOut = true;
  this.clean = function() {
    this.tweenTint(this,0xffffff, 0xfeffff, 1000);
    game.add.tween(this).to( { width: 0, height: 0, alpha: 0 }, 150, Phaser.Easing.Linear.None, true, 0);
    this.aura.scale.setTo(.01);
    game.add.tween(this.aura).to( { width: 200, height: 200, alpha: .5 }, 200, Phaser.Easing.Linear.None, true, 0).yoyo(true);
    game.time.events.add(200, function() {
      this.aura.destroy();
      this.destroy();
    }, this);
  }
}

Freeze.prototype = Object.create(Phaser.Sprite.prototype);
Freeze.prototype.constructor = Freeze;
Freeze.prototype.update = function() {
  if (this.pulseOut) {
    this.aura.scale.setTo(this.aura.scale.x + .05);
    if (this.aura.scale.x >= .2) {
      this.pulseOut = false;
    }
  } else {
    this.aura.scale.setTo(this.aura.scale.x - .01);
    if (this.aura.scale.x <= .05) {
      this.pulseOut = true;
    }
  }
};

class Boot {
  init() {
    //game.stage.smoothed = false;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.stage.disableVisibilityChange = true;
    this.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    //this.scale.setGameSize(window.innerWidth-100,window.innerHeight-100);
    game.add.plugin(Fabrique.Plugins.InputField);
    game.load.script('filterX', '../filters/BlurX.js');
    //game.load.script('filterY', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurY.js');
    game.load.script('filterY', '../filters/BlurY.js');
    //game.load.script('grayfilter', '../filters/Gray.js');
    //game.load.script('glowFilter', '../filters/glow/GlowFilter.js');
    //console.log("%c||| Bootin' Bensio |||","color:#fdf6e3; background:#073642");
    /*We've gotten data. Do something with it.
      console.log(data);
    });*/
  }
  create() {
    game.state.start('Load');
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
      console.log(C.background.assets[assetName].source);
      game.load.image(assetName, C.background.assets[assetName], C.background.width, C.background.height);
    });
    Object.keys(C.block.assets).forEach(function(assetName) {
      game.load.image(assetName, C.block.assets[assetName], C.block.width, C.block.height);
    });
    Object.keys(C.block.skins).forEach(function(assetName) {
      game.load.image(assetName, C.block.skins[assetName], C.block.width, C.block.height);
    });
    Object.keys(C.obstacle.data).forEach(function(assetName) {
      game.load.image(assetName, C.obstacle.data[assetName].source);
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
      game.status = "";
      game.bg = new Background(data.bg);
      C.game.number = data.number;
      //game.clickCount = game.add.text(game.world.centerX,game.world.centerY,C.game.number,C.text.style);
      //game.clickCount.anchor.setTo(.5);
      game.stage.disableVisibilityChange = true; 
      // Add physics
      /*game.world.setBounds(0, 0, C.game.width, C.game.height);
      game.physics.startSystem(Phaser.Physics.P2JS);
      game.world.customBounds = { left: null, right: null, top: null, bottom: null };
      game.world.createPreviewBounds = function(x, y, w, h) {
        var sim = game.physics.p2;
        //  If you want to use your own collision group then set it here and un-comment the lines below
        var mask = sim.boundsCollisionGroup.mask;

        game.world.customBounds.left = new p2.Body({ mass: 0, position: [ sim.pxmi(x), sim.pxmi(y) ], angle: 1.5707963267948966 });
        game.world.customBounds.left.addShape(new p2.Plane());
        // game.world.customBounds.left.shapes[0].collisionGroup = mask;

        game.world.customBounds.right = new p2.Body({ mass: 0, position: [ sim.pxmi(x + w), sim.pxmi(y) ], angle: -1.5707963267948966 });
        game.world.customBounds.right.addShape(new p2.Plane());
        // game.world.customBounds.right.shapes[0].collisionGroup = mask;

        game.world.customBounds.top = new p2.Body({ mass: 0, position: [ sim.pxmi(x), sim.pxmi(y) ], angle: -3.141592653589793 });
        game.world.customBounds.top.addShape(new p2.Plane());
        // game.world.customBounds.top.shapes[0].collisionGroup = mask;

        game.world.customBounds.bottom = new p2.Body({ mass: 0, position: [ sim.pxmi(x), sim.pxmi(y + h) ] });
        game.world.customBounds.bottom.addShape(new p2.Plane());
        // game.world.customBounds.bottom.shapes[0].collisionGroup = mask;

        sim.world.addBody(game.world.customBounds.left);
        sim.world.addBody(game.world.customBounds.right);
        sim.world.addBody(game.world.customBounds.top);
        sim.world.addBody(game.world.customBounds.bottom);
      }*/
      // game.world.createPreviewBounds(115,0,1050,950);
      //game.physics.p2.setBoundsToWorld(true, true, true, true, true);
      //game.physics.p2.setImpactEvents(true);
      //C.block.blockCollisionGroup = game.physics.p2.createCollisionGroup(); 
      //game.physics.p2.updateBoundsCollisionGroup();
      //create blocks

      if (!game.blocks) {
        game.blocks = game.add.group();
        game.localObstacles = [];
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
      /*game.physics.startSystem(Phaser.Physics.P2JS);
      game.physics.p2.damping = 0;
      game.physics.p2.friction = 0;
      game.physics.p2.angularDamping = 0;
      game.physics.p2.restitution = 1;
      game.physics.p2.enable(game.blocks);
      game.blocks.enableBody = true;
      game.blocks.physicsBodyType = Phaser.Physics.P2JS;*/
      game.blocks.positions = data.positions;
      game.blocks.velocities = data.velocities;
      game.blocks.deadBlocks = data.deadBlocks;
      /*game.obstacles.forEach(function(obstacle) {
        obstacle.clean()
      });*/
      /*data.obstacles.forEach(function(obstacle) {
        if (C.obstacle.offensive.indexOf(obstacle.type) > -1 || C.obstacle.defensive.indexOf(obstacle.type) > -1) {
          console.log("Buildin' a " + obstacle.type);
          new window[obstacle.type](game,data.x+C.game.width/2,data.y+C.game.height/2,obstacle.type);
        } else {
          new Obstacle(game,data.x+C.game.width/2,data.y+C.game.height/2,obstacle.type);
        }
      });*/
      //game.clickCount.kill();
      game.loadingText.destroy();
      if (game.state.current == "Load") {
        game.state.start('MainMenu',false);
      }
    });
  }
}

class MainMenu {
  preload() {
    if (document.getElementById("signInButton") && !signedIn) {
      document.getElementById("signInButton").style["animation-name"] = "flyIn";
      document.getElementById("signInButton").style["animation-duration"] = "2s";
      document.getElementById("signInButton").style["bottom"] = "10%";
    }
    game.socket.on('newRound', function(data) {
      console.log('Round over.');
      game.blocks.forEach(function(block) {
        if (!block.alive) {
          block.revive();
          //block.enableBetting(true);
          game.world.bringToTop(block);
        }
      });
      game.offensiveSpawners.forEach(function(spawner) {
        if (!spawner.alive) {
          spawner.revive();
          game.world.bringToTop(spawner);
        }
      });
      game.defensiveSpawners.forEach(function(spawner) {
        if (!spawner.alive) {
          spawner.revive();
          game.world.bringToTop(spawner);
        }
      });
      /*game.localObstacles.forEach(function(obstacle) {
        obstacle.clean();
      });*/
      game.bg.changeBackground(data.bg);
      for (var obstacle in C.player.obstaclesOwned) {
          C.player.obstaclesOwned[obstacle] = 0;
      }
      game.userDisplay.bettingOn.alpha = 0;
      game.userDisplay.bettingHP.alpha = 0;
      game.userDisplay.noBets.alpha = 1;
    });
    /*game.socket.on('numberChanged',function(number) {
      C.game.number = number;
      game.clickCount.text = number.toString();
    });*/
  }
  create() {
    //game.bg.sprite.filters = [];
      for (var i = 0; i < C.obstacle.offensive.length; i++) {
        game.offensiveSpawners.create(game.width - C.obstacle.width/2, C.obstacle.height/2 + 150*game.bg.sprite.scale.y*i, C.obstacle.offensive[i]);
      }
      for (var i = 0; i < C.obstacle.defensive.length; i++) {
        game.defensiveSpawners.create(C.obstacle.width/2, C.obstacle.height/2 + 150*game.bg.sprite.scale.y*i, C.obstacle.defensive[i]);
      }
      game.offensiveSpawners.forEach(function(spawner) {
        spawner.inputEnabled = false;
      });
      game.defensiveSpawners.forEach(function(spawner) {
        spawner.inputEnabled = false;
      });
      if (game.blocks.length == 0) {
      for (var i = 0; i < C.block.names.length; i++) {
          var index = game.blocks.deadBlocks.indexOf(i);
          var lastBlock = game.blocks.create(game.blocks.positions[i][0],game.blocks.positions[i][1],C.block.names[i]);
          lastBlock.scale.setTo(game.bg.sprite.scale.x);
          if (index > 0) {
            lastBlock.kill();
          }
          //lastBlock.body.velocity.x = game.blocks.velocities[i][0];
          //lastBlock.body.velocity.y = game.blocks.velocities[i][1];
          //Commented out to test. Uncomment later.
          /*lastBlock.body.angularDamping = 0;
          lastBlock.body.damping = 0;
          lastBlock.body.mass = 0.1;*/
      }
    }
    game.socket.on('killBlock',function(block) {
      var dyingBlock = game.blocks[block.number];
      dyingBlock.kill();
    });
    game.socket.on('worldTick',function(data) { 
      for (i = 0; i < data.hp.length; i++) {
        if (data.hp[i] <= 0 && game.blocks.deadBlocks.indexOf(i) < 0) {
          game.blocks.deadBlocks.push(i);
        } else if (data.hp[i] > 0 && game.blocks.deadBlocks.indexOf(i) > -1) {
          game.blocks.deadBlocks.splice(game.blocks.deadBlocks.indexOf(i),1);
        }
      }
      C.block.hp = data.hp;
      if (game.userDisplay.bettingHP && C.block.names.indexOf(C.player.bettingOn) > -1) {
        game.userDisplay.bettingHP.text = C.block.hp[C.block.names.indexOf(C.player.bettingOn)] + " HP";
      }
      if (game.blocks.deadBlocks.length >= game.blocks.length-1) {
        game.status = "Finishing";
      } else if (data.paused) {
        game.status = "Betting";
      } else {
        game.status = "Ongoing";
      }
      if (game.userDisplay && game.userDisplay.highScores) { 
        var finalText = "High Scores:"
        for (i = 0; i < 3; i++) {
          if (data.highScores[i]) {
            finalText = finalText + "\n" + data.highScores[i][0] + " : " + data.highScores[i][1];
          }
        }
        game.userDisplay.highScores.text = finalText;
      }
      for (var i = 0; i < game.blocks.length; i++) {
        if (game.blocks.children[i].skin != data.skins[i]) {
          game.blocks.children[i].changeSkin(data.skins[i]);
        }
        if (data.paused) {
          game.blocks.children[i].revive();
        }
        //Include indexOf for IE later. 
        if (game.blocks.deadBlocks.indexOf(i) > -1 && game.blocks.children[i].alive && !game.blocks.children[i].winner) {
          game.blocks.children[i].lose();
        } else if (game.blocks.children[i].alive && game.status != "Finishing") {
          game.blocks.children[i].syncBlock(data.positions[i][0], data.positions[i][1],data.angles[i]);
          if (data.paused && !game.blocks.children[i].bettingEnabled) {
            game.blocks.children[i].enableBetting(true);
          } else if (!data.paused && game.blocks.children[i].bettingEnabled) {
            game.blocks.children[i].enableBetting(false);
          }
        } else if (game.status == "Finishing" && game.blocks.children[i].alive) {
          game.blocks.children[i].winner = true;
          if (!game.blocks.children[i].victoryTween) {
            game.blocks.children[i].victoryTween = game.add.tween(game.blocks.children[i]).to({x: game.world.centerX, y: game.world.centerY}, 1000, Phaser.Easing.Linear.None, true);
            game.userDisplay.bensioTitle.text = "Team " + game.blocks.children[i].color + " wins!";
            game.world.bringToTop(game.userDisplay.bensioTitle);
            game.userDisplay.bensioTitle.winStateTween = game.add.tween(game.userDisplay.bensioTitle).to({y: game.world.centerY - 150, alpha: 1}, 1000, Phaser.Easing.Linear.None, true)
          }
        }
      }
        var tempDataObstacles = convertSet(data.obstacles);
        var tempLocalObstacles = convertSet(game.localObstacles);
        if (!compareSets(tempDataObstacles,tempLocalObstacles)) {
          console.log("Obstacles changed.");
          //First. Are there any new obstacles? If so, create them.
          data.obstacles.forEach(function(obstacle) {
            if (tempLocalObstacles.indexOf(obstacle.obstacleNumber) < 0 ) {
              console.log("AND I'M PLACIN' ONE WHEEEEEEEEE-");
              console.log(obstacle.x);
              var newestObstacle = new window[obstacle.type](game,obstacle.x*game.bg.sprite.scale.x+game.width/2,obstacle.y*game.bg.sprite.scale.y+game.height/2,obstacle.type);
              newestObstacle.obstacleNumber = obstacle.obstacleNumber;
              newestObstacle.sentX = obstacle.x;
              newestObstacle.sentY = obstacle.y;
            }
          });
          for (i = game.localObstacles.length-1; i >= 0; i--) {
              if (tempDataObstacles.indexOf(game.localObstacles[i].obstacleNumber) < 0) {
                console.log(game.localObstacles[i], "To be deleted");
                game.localObstacles[i].clean();
                game.localObstacles.splice(i,1);
              }
            };
        }
        //game.blocks.children[i].x = data.positions[i][0];
        //game.blocks.children[i].y = data.positions[i][1];

        /*for (i = 0; i < game.blocks.children.length; i++ ) {
          if (game.blocks.children[i]) {
            game.blocks.children[i].body.velocity.x = data.velocities[i][0];
            game.blocks.children[i].body.velocity.y = data.velocities[i][1];
          }
        }*/
    });
    game.userDisplay = {};
    game.userDisplay.bensioTitle = game.add.text(game.world.centerX,game.world.centerY - 200*game.bg.sprite.scale.x,"bensio",C.text.style);
    game.userDisplay.bensioTitle.anchor.setTo(.5);
    game.userDisplay.bensioTitle.resetPosition = function() {
      this.x = game.world.centerX;
      this.y = game.world.centerY - 200*game.bg.sprite.scale.x;
    }
    var input = game.add.inputField(game.world.centerX - C.text.inputStyle.width/2 - C.text.inputStyle.padding, game.world.centerY - C.text.inputStyle.height/2 - C.text.inputStyle.padding, C.text.inputStyle);
    input.blockInput = false;
    game.world.bringToTop(input);
    console.log(input);
    var enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    //window.addEventListener("resize", function(event) {
    game.adjustSize = function() {
      console.log("tick");
      game.bg.sprite.x = game.width/2;
      game.bg.sprite.y = game.height/2;
      var previousWidth = game.bg.sprite.width;
      var previousHeight = game.bg.sprite.height;
      //if (window.innerWidth > window.innerHeight) {
          game.bg.sprite.width = game.width;
          game.bg.sprite.scale.y = game.bg.sprite.scale.x;
          if (game.bg.sprite.height > game.height-game.height/5) {
            game.bg.sprite.width = previousWidth;
            game.bg.sprite.scale.y = game.bg.sprite.scale.x;
          }
      /*} else {
          game.bg.sprite.height = game.height;
          game.bg.sprite.scale.x = game.bg.sprite.scale.y;
          if (game.bg.sprite.width > game.width) {
            console.log("TOO WIDE")
            game.bg.sprite.height = previousHeight;
            game.bg.sprite.scale.y = game.bg.sprite.scale.x;
          }
      }*.
      //game.bg.sprite.scale.setTo(game.bg.sprite.scale.x);
      /*if (game.bg.sprite.width > game.width || game.bg.sprite.height > game.height) {
        if (window.innerWidth > window.innerHeight) {
          console.log("heights are",game.height,game.bg.sprite.height);
          game.bg.sprite.scale.setTo(game.height/game.bg.sprite.height);
        } else {
          console.log("widths are",game.width,game.bg.sprite.width);
          game.bg.sprite.scale.setTo(game.width/game.bg.sprite.width);
        }
      }*/
      for (var i = 0; i < game.defensiveSpawners.length; i++) {
        game.defensiveSpawners.children[i].scale.setTo(C.obstacle.data[game.defensiveSpawners.children[i].type].scale*game.bg.sprite.scale.x);
        //game.defensiveSpawners.children[i].reset(game.defensiveSpawners.children[i].width/2, game.defensiveSpawners.children[i].height/2 + game.defensiveSpawners.children[i].height*i);
        game.defensiveSpawners.children[i].reset(C.obstacle.width/2, C.obstacle.height/2 + 150*game.bg.sprite.scale.y*i);
      }
      for (var i = 0; i < game.offensiveSpawners.length; i++) {
        game.offensiveSpawners.children[i].scale.setTo(C.obstacle.data[game.offensiveSpawners.children[i].type].scale*game.bg.sprite.scale.x);
        game.offensiveSpawners.children[i].reset(game.width - C.obstacle.width/2, C.obstacle.height/2 + 150*game.bg.sprite.scale.y*i);
      }
      game.localObstacles.forEach(function(obstacle) {
        obstacle.syncScale();
      });
      game.blocks.forEach(function(block) {
        block.scale.setTo(game.bg.sprite.scale.x);
      });
      Object.keys(game.userDisplay).forEach(function(displayKey) {
        if (game.userDisplay[displayKey] && game.userDisplay[displayKey].resetPosition) {
          game.userDisplay[displayKey].resetPosition();
          game.userDisplay[displayKey].scale.setTo(game.bg.sprite.scale.x);
        }
      });
      if (input) {
        input.x = game.world.centerX - C.text.inputStyle.width/2 - C.text.inputStyle.padding;
        input.y = game.world.centerY - C.text.inputStyle.height/2 - C.text.inputStyle.padding;
      }
    };
    game.adjustSize();
    game.scale.onSizeChange.add(function() {
      game.adjustSize();
    });
    enter.onDown.add(function() {
      C.player.name = input.value || sessionStorage.getItem('userName') || 'Anonymous';
      sessionStorage.setItem('userName', C.player.name);
      game.socket.emit('nameRegistered', C.player.name);
      input.destroy();
      if (document.getElementById("signInButton")) {
        document.getElementById("signInButton").remove();
      }
      if (document.getElementById("signOutButton")) {
        document.getElementById("signOutButton").remove();
      }
      game.state.start('Play',false);
    });
  }
}

class Play {
  create() {
    game.blocks.forEach(function(block) {
      block.revive();
    });
    console.log("Did it!");
    game.userDisplay.bensioTitle.alpha = 0;
    game.clear();
    //game.clickCount.revive();
    //Create the user's display
    game.userDisplay.currentWorth = game.add.text(50*game.bg.sprite.scale.x,game.world.height - 100*game.bg.sprite.scale.x,"Score: 0",C.text.style);
    game.userDisplay.currentWorth.anchor.setTo(0);
    game.userDisplay.currentWorth.resetPosition = function() {
      this.x = 50*game.bg.sprite.scale.x;
      this.y = game.world.height - 100*game.bg.sprite.scale.x;
    }
    game.socket.on('buxioChange',function(bux) {
      game.userDisplay.currentWorth.text = "Score: " + bux;
    });
    game.userDisplay.highScores = game.add.text(game.world.width - 50*game.bg.sprite.scale.x,game.world.height - 50*game.bg.sprite.scale.x,"High Scores:",C.text.scoreStyle);
    game.userDisplay.highScores.anchor.setTo(1);
    game.userDisplay.highScores.resetPosition = function() {
      this.x = game.world.width - 50*game.bg.sprite.scale.x;
      this.y = game.world.height - 50*game.bg.sprite.scale.x;
    }
    game.userDisplay.noBets = game.add.text(game.world.centerX,50*game.bg.sprite.scale.x,"Game in Progress...",C.text.style);
    game.userDisplay.noBets.anchor.setTo(.5);
    game.userDisplay.noBets.resetPosition = function() {
      this.x = game.world.centerX;
      this.y = 50*game.bg.sprite.scale.x;
    }
    game.userDisplay.bettingOn = game.add.sprite(game.world.centerX - 60*game.bg.sprite.scale.x,60*game.bg.sprite.scale.y,"red");
    game.userDisplay.bettingOn.anchor.setTo(.5);
    game.userDisplay.bettingOn.alpha = 0;
    game.userDisplay.bettingOn.resetPosition = function() {
      this.x = game.world.centerX - 60*game.bg.sprite.scale.x;
      this.y = 60*game.bg.sprite.scale.x;
    }
    game.userDisplay.bettingHP = game.add.text(game.world.centerX + 60*game.bg.sprite.scale.x,60*game.bg.sprite.scale.y,"40 HP",C.text.style);
    game.userDisplay.bettingHP.anchor.setTo(.5);
    game.userDisplay.bettingHP.alpha = 0;
    game.userDisplay.bettingHP.resetPosition = function() {
      this.x = game.world.centerX + 60*game.bg.sprite.scale.x;
      this.y = 60*game.bg.sprite.scale.x;
    }
    Object.keys(game.userDisplay).forEach(function(displayKey) {
      game.userDisplay[displayKey].homeX = game.userDisplay[displayKey].x;
      game.userDisplay[displayKey].homeY = game.userDisplay[displayKey].y;
      game.userDisplay[displayKey].scale.setTo(game.bg.sprite.scale.x);
    });
    game.offensiveSpawners.forEach(function(spawner) {
      spawner.inputEnabled = true;
      if (Phaser.Device.desktop) {
        spawner.events.onInputUp.add(spawner.attach,spawner);
      } else {
        spawner.input.enableDrag(true);
        spawner.events.onDragStop.add(spawner.checkOutOfBounds,spawner);
      }
    });
    game.defensiveSpawners.forEach(function(spawner) {
      spawner.inputEnabled = true;
      if (Phaser.Device.desktop) {
        spawner.events.onInputUp.add(spawner.attach,spawner);
      } else {
        spawner.input.enableDrag(true);
        spawner.events.onDragStop.add(spawner.checkOutOfBounds,spawner);
      }
    });
    //Deal with socket messages.
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
      //Needs upkeep
    } else {
      this.sprite.loadTexture(backgroundKey);
    }
    game.world.sendToBack(this.sprite);
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

  this.sprite.width = C.game.width;
  this.sprite.height = C.game.width;
  if (this.sprite.width > game.width || this.sprite.height > game.height) {
    if (window.innerWidth*window.devicePixelRatio > window.innerHeight*window.devicePixelRatio) {
      console.log("heights are",game.height,this.sprite.height);
      this.sprite.scale.setTo(game.height/this.sprite.height);
    } else {
      console.log("widths are",game.width,this.sprite.width);
      this.sprite.scale.setTo(game.width/this.sprite.width);
    }
  }

}


//var game = new Phaser.Game(C.game.width, C.game.height);
game = new Phaser.Game(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
game.state.add('Boot',Boot);
game.state.add('Load',Load);
game.state.add('MainMenu',MainMenu);
game.state.add('Play',Play);
game.state.start('Boot');
