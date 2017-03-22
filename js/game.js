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
    assets: {
      "red": "assets/redsquare.png",
      "blue": "assets/bluesquare.png",
      "green": "assets/greensquare.png",
      "orange": "assets/orangesquare.png"
    },
    names: ["red","blue","green","orange"]
  }
}

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
  }
  create() {
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
      game.physics.startSystem(Phaser.Physics.P2JS);
      game.physics.p2.setImpactEvents(true);
      C.block.blockCollisionGroup = game.physics.p2.createCollisionGroup(); 
      game.physics.p2.updateBoundsCollisionGroup();
      game.physics.p2.damping = 0;
      game.physics.p2.friction = 0;
      game.physics.p2.angularDamping = 0;
      game.physics.p2.restitution = 1;
      //create blocks
      
      game.blocks = [];
      for (var i = 0; i < C.block.names.length; i++) {
        game.blocks[i] = new Block(data.positions[i].x,data.positions[i].y,C.block.names[i]);
      }
      game.socket.on('numberChanged',function(number) {
        C.game.number = number;
        game.clickCount.text = number.toString();
      });
      game.clickCount.kill();
      game.loadingText.destroy();
      game.state.start('MainMenu',false);
    });
  }
}

class MainMenu {
  preload() {
    game.socket.on('newRound', function(data) {
      console.log('Round over.');
      game.bg.changeBackground(data.bg);
    });
  }
  create() {
    //game.bg.sprite.filters = [];
    game.bensioTitle = game.add.text(game.world.centerX,game.world.centerY - 200,"bensio",C.text.style);
    game.bensioTitle.anchor.setTo(.5);
    var input = game.add.inputField(game.world.centerX - C.text.inputStyle.width/2 - C.text.inputStyle.padding, game.world.centerY - C.text.inputStyle.height/2 - C.text.inputStyle.padding, C.text.inputStyle);
    input.blockInput = false;
    game.world.bringToTop(input);
    console.log(input);
    var enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    enter.onDown.add(function() {
      C.player.name = input.value || 'Anonymous';
      input.destroy();
      game.state.start('Play',false);
    });
  }
}

class Play {
  create() {
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

function Block(x,y,color) {
  this.sprite = game.add.sprite(x, y, color);
  game.physics.p2.enable(this.sprite);
  this.sprite.enableBody = true;
  this.sprite.physicsBodyType = Phaser.Physics.P2JS;
  this.sprite.filters = [game.blurX, game.blurY];
  console.log(this.sprite);
}


var game = new Phaser.Game(C.game.width, C.game.height);
game.state.add('Boot',Boot);
game.state.add('Load',Load);
game.state.add('MainMenu',MainMenu);
game.state.add('Play',Play);
game.state.start('Boot');
