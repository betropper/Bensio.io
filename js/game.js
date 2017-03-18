var C = {
  game: {
    width: 1280,
    height: 920
  },
  background: {
    width: 1280,
    height: 920,
    assets: {
      "stars": "stars1.png",
      "west": "west2.png",
      "sunset": "sunset3.png"
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
    Object.keys(C.backgrounds.assets).forEach(function(assetName) {
      game.load.image(assetName, C.background.assets[assetName]);
    });
  }
  load() {
    game.state.start('MainMenu');
  }
}

class MainMenu {


}


game.state.add('Boot',Boot);
game.state.add('Load',Load);
game.state.add('MainMenu',MainMenu);
var game = new Phaser.Game(C.game.width, C.game.height);
