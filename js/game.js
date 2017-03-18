var C = {
  game: {
    width: 568,
    height: 320
  },
  backgrounds: {


  }
}

class Boot {
  

}


game.state.add('Boot',Boot);
var game = new Phaser.Game(C.game.width, C.game.height);
