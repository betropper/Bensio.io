var C = {
  game: {
    width: window.innerWidth * window.devicePixelRatio,
    height: window.innerHeight * window.devicePixelRatio,
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
      font: '30px Montserrat',
      fontWeight: 'bold',
      width: 500,
      height: 40,
      backgroundColor: '#f44e42',
      borderWidth: 4,
      borderColor: '#000',
      padding: 12,
      borderRadius: 20,
      max: 20,
      placeHolder: 'Anonymous'
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
    name: 'No One'
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
  }
  create() {
    game.socket = io();
    game.socket.on('firstMessage',function(data) {
      game.bg = new Background(data.bg);
      game.bg.blurrify();
      C.game.number = data.number;
      game.clickCount = game.add.text(game.world.centerX,game.world.centerY,C.game.number,C.text.style);
      game.clickCount.anchor.setTo(.5);
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
    game.bensioTitle = game.add.text(game.world.centerX,game.world.centerY - 200,"bensio",C.text.style);
    var input = game.add.inputField(game.world.centerX - C.text.inputStyle.width/2 , game.world.centerY - C.text.inputStyle.height/2, C.text.inputStyle);
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

  this.blurX = game.add.filter('BlurX');
  this.blurY = game.add.filter('BlurY');
  this.blurrify = function() {
    this.blurX.blur = 100;
    this.blurY.blur = 1;
    this.sprite.filters = [this.blurX, this.blurY];
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
}


var game = new Phaser.Game(C.game.width, C.game.height);
game.state.add('Boot',Boot);
game.state.add('Load',Load);
game.state.add('MainMenu',MainMenu);
game.state.add('Play',Play);
game.state.start('Boot');
