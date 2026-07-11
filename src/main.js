import { GAME_HEIGHT, GAME_WIDTH } from './core/config.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import Level1Scene from './scenes/Level1Scene.js';
import Level2Scene from './scenes/Level2Scene.js';
import Level3Scene from './scenes/Level3Scene.js';
import Level4Scene from './scenes/Level4Scene.js';
import Boss5Scene from './scenes/Boss5Scene.js';
import Level6Scene from './scenes/Level6Scene.js';
import Level7Scene from './scenes/Level7Scene.js';
import Level8Scene from './scenes/Level8Scene.js';
import Level9Scene from './scenes/Level9Scene.js';
import Boss10Scene from './scenes/Boss10Scene.js';
import AbilityScene from './scenes/AbilityScene.js';
import TiendaScene from './scenes/TiendaScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  backgroundColor: '#21160f',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    PreloadScene,
    MenuScene,
    Level1Scene,
    Level2Scene,
    Level3Scene,
    Level4Scene,
    Boss5Scene,
    Level6Scene,
    Level7Scene,
    Level8Scene,
    Level9Scene,
    Boss10Scene,
    AbilityScene,
    TiendaScene,
    UIScene,
    GameOverScene,
    VictoryScene
  ]
};

window.addEventListener('load', () => {
  // eslint-disable-next-line no-new
  new Phaser.Game(config);
});
