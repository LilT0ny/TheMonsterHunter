import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

export default class Level3Scene extends BaseLevelScene {
  constructor() {
    super('Level3Scene');
    this.portalPosition = null;
  }

  create() {
    this.createLevel({
      levelNumber: 3,
      title: 'Nivel 3 — Ruinas del oasis',
      mapKey: 'nivel3',
      tilesetName: 'desierto',
      tilesetImageKey: 'desiertoTiles',
      levelMusicMood: 'desierto',
      musicMood: 'calm'
    });

    this.portalPosition = this.findObject('portal');
    this.spawnLevelEnemies();
    this.spawnRandomCoinCaches();
    this.requiredKills = this.enemies.countActive(true);
    this.showObjective('Objetivo: usa SHIFT para saltar los muros bajos de las ruinas y llega a la momia gigante.');
  }

  checkLevelCompletion() {
    // A mitad de las ruinas ofrecemos sumar al Jugador 2. Se pregunta una sola
    // vez por partida: promptCoopJoin se auto-bloquea despues de la primera.
    if (this.requiredKills > 0 && this.enemyKills >= Math.ceil(this.requiredKills / 2)) {
      this.promptCoopJoin('Vas por la mitad de las ruinas. ¿Necesitás ayuda?');
    }

    if (this.enemyKills >= this.requiredKills && !this.portal) {
      addScore(this, 70);
      this.showObjective('Ruinas despejadas. Entra al portal para elegir habilidad y visitar la tienda.');
      this.createPortal(() => this.completeLevel(() => {
        this.scene.start('AbilityScene', {
          levelCompleted: 3,
          nextScene: 'TiendaScene',
          nextLevelScene: 'Level4Scene'
        });
      }), this.portalPosition);
    }
  }

  spawnLevelEnemies() {
    this.spawnEnemiesFromMap(['mummy', 'mummy_giant']);
  }

  spawnRandomCoinCaches() {
    const points = this.getRandomSafePoints(3, {
      margin: 150,
      minDistanceFromPlayer: 190,
      minDistanceBetween: 190
    });

    points.forEach((point) => {
      this.spawnCoinCache(point.x, point.y, Phaser.Math.Between(3, 6));
    });
  }
}
