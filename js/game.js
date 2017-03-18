var C = {
  game: {
    width: 1280,
    height: 920
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
    game.state.start('Play');
  }
}

class MainMenu {
  create() {
    game.state.start('Play');
  }
}

class Play {
  preload() {
    game.bg = new Background();
  }
  create() {
    console.log("Did it!")
  }
}
function Background() {
  this.changeBackground = function() {
      var keys = Object.keys(C.background.assets)
      return game.add.tileSprite(0,0,C.background.width,C.background.height, keys[ keys.length * Math.random() << 0]);
  };
  this.sprite = this.changeBackground();
}


var game = new Phaser.Game(C.game.width, C.game.height);
game.state.add('Boot',Boot);
game.state.add('Load',Load);
game.state.add('MainMenu',MainMenu);
game.state.add('Play',Play);
game.state.start('Boot');
