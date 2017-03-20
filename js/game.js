var C = {
  game: {
    width: 1280,
    height: 920
  },
  text: {
    style: {
      align: 'center',
      fill: "#ffffff",
      font: '50px Comic Sans MS'
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
  }
}

class Boot {
  init() {
    console.log("%c||| Bootin' Bensio |||",
                "color:#fdf6e3; background:#073642");
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
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
    Object.keys(C.background.assets).forEach(function(assetName) {
      game.load.image(assetName, C.background.assets[assetName], C.background.width, C.background.height);
    });
  }
  create() {
    game.state.start('MainMenu');
  }
}

class MainMenu {
  preload() {
  }
  create() {
    game.state.start('Play');
  }
}

class Play {
  create() {
    game.socket = io();
    console.log("Did it!")
    game.socket.on('firstMessage',function() {

    });
    game.bg = new Background(currentbg);
    game.bg.number = countingNumber;
    game.bg.clickCount = game.add.text(game.world.centerX,game.world.centerY,game.bg.number,C.text.style);
    game.bg.clickCount.anchor.setTo(.5);
    this.input.enabled = true;
    this.input.onTap.add(function() {
      game.socket.emit('bet', {player: "Betropper"});
    },this);
    game.socket.on('numberChanged',function(number) {
      game.bg.number = number;
      game.bg.clickCount.text = number.toString();
    });
  }
}
function Background(currentkey) {
  this.randomBackground = function() {
      var keys = Object.keys(C.background.assets)
      return game.add.tileSprite(0,0,C.background.width,C.background.height, keys[ keys.length * Math.random() << 0]);
  };
  this.changeBackground = function(backgroundKey) {
    if (!backgroundKey) {
      this.sprite = this.randomBackground();
    } else {
      this.sprite.loadTexture(backgroundKey);
    }
  }
  if (currentkey) {
    this.sprite = game.add.tileSprite(0,0,C.background.width,C.background.height, currentkey);
  } else {
    this.changeBackground();
  }
}


var game = new Phaser.Game(C.game.width, C.game.height);
game.state.add('Boot',Boot);
game.state.add('Load',Load);
game.state.add('MainMenu',MainMenu);
game.state.add('Play',Play);
game.state.start('Boot');
