import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

const AMBUSH_TRIGGER_RADIUS = 48;

export default class Level7Scene extends BaseLevelScene {
  constructor() {
    super('Level7Scene');
    this.portalPosition = null;
    this.ambushTrigger = null;
    this.ambushLeft = null;
    this.ambushRight = null;
    this.ambushTriggered = false;
  }

  create() {
    this.createLevel({
      levelNumber: 7,
      title: 'Nivel 7 — Laberinto de huesos',
      mapKey: 'nivel7',
      tilesetName: 'desierto',
      tilesetImageKey: 'desiertoTiles',
      levelMusicMood: 'desierto',
      musicMood: 'tense'
    });

    this.ambushTriggered = false;
    this.portalPosition = this.findObject('portal');
    this.ambushTrigger = this.findObject('ambush_trigger');
    this.ambushLeft = this.findObject('ambush_left');
    this.ambushRight = this.findObject('ambush_right');

    this.requiredKills = 9;
    this.spawnEnemiesFromMap(['serpent']);
    this.showObjective('Objetivo: navega el laberinto de huesos. Cuidado con el corredor angosto.');
  }

  update(time, delta) {
    super.update(time, delta);
    if (this.levelFinished) return;
    this.checkAmbush();
  }

  checkAmbush() {
    if (this.ambushTriggered || !this.ambushTrigger) return;

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ambushTrigger.x, this.ambushTrigger.y);
    if (distance > AMBUSH_TRIGGER_RADIUS) return;

    this.ambushTriggered = true;
    this.cameras.main.shake(200, 0.01);
    this.showObjective('¡Emboscada! Serpientes cierran el corredor por ambos lados.');

    if (this.ambushLeft) {
      this.spawnEnemy('serpent', this.ambushLeft.x, this.ambushLeft.y);
      this.spawnEnemy('serpent', this.ambushLeft.x, this.ambushLeft.y + 20);
    }
    if (this.ambushRight) {
      this.spawnEnemy('serpent', this.ambushRight.x, this.ambushRight.y);
      this.spawnEnemy('serpent', this.ambushRight.x, this.ambushRight.y + 20);
    }
  }

  checkLevelCompletion() {
    if (this.enemyKills >= this.requiredKills && !this.portal) {
      addScore(this, 90);
      this.showObjective('Laberinto despejado. Entra al portal para elegir habilidad y visitar la tienda.');
      this.createPortal(() => this.completeLevel(() => {
        this.scene.start('AbilityScene', {
          levelCompleted: 7,
          nextScene: 'TiendaScene',
          nextLevelScene: 'Level8Scene'
        });
      }), this.portalPosition);
    }
  }
}
