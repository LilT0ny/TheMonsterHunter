import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

export default class Level1Scene extends BaseLevelScene {
  constructor() {
    super('Level1Scene');
    this.portalPosition = null;
  }

  create() {
    this.createLevel({
      levelNumber: 1,
      title: 'Nivel 1 - El paso de arena',
      mapKey: 'nivel1',
      tilesetName: 'desierto',
      tilesetImageKey: 'desiertoTiles',
      levelMusicMood: 'desierto',
      musicMood: 'calm'
    });

    this.requiredKills = 8;
    this.portalPosition = this.pickRandomPortalPosition();
    // Los arbustos van primero: son cobertura, y las aranas tienen que aparecer
    // repartidas alrededor de ellos, no encima.
    this.spawnBushes(16);
    this.spawnRandomEnemies();
    this.spawnRandomCoinCaches();
    this.showObjective('Objetivo: elimina 8 enemigos y busca el portal. Usa los arbustos como cobertura: frenan a las arañas, pero tus flechas los atraviesan.');
  }

  checkLevelCompletion() {
    if (this.enemyKills >= this.requiredKills && !this.portal) {
      addScore(this, 50);
      this.showObjective('Nivel despejado. Entra al portal para elegir habilidad y visitar la tienda.');
      this.createPortal(() => this.completeLevel(() => {
        this.scene.start('AbilityScene', {
          levelCompleted: 1,
          nextScene: 'TiendaScene',
          nextLevelScene: 'Level2Scene'
        });
      }), this.portalPosition);
    }
  }

  spawnRandomEnemies() {
    const enemyPlan = Phaser.Utils.Array.Shuffle([
      'spider',
      'spider',
      'spider',
      'spider',
      'spider',
      'spider',
      'spider',
      'spider'
    ]);
    const points = this.getRandomSafePoints(enemyPlan.length, {
      margin: 150,
      minDistanceFromPlayer: 260,
      minDistanceBetween: 105
    });

    enemyPlan.forEach((type, index) => {
      const fallback = this.findObjects(type)[index] || this.getRandomSafePoint({ minDistanceFromPlayer: 260 });
      const point = points[index] || fallback;
      if (point) {
        this.spawnEnemy(type, point.x, point.y);
      }
    });
  }

  spawnRandomCoinCaches() {
    const points = this.getRandomSafePoints(4, {
      margin: 140,
      minDistanceFromPlayer: 190,
      minDistanceBetween: 190
    });

    points.forEach((point) => {
      this.spawnCoinCache(point.x, point.y, Phaser.Math.Between(3, 6));
    });
  }

  pickRandomPortalPosition() {
    return this.getRandomSafePoint({
      margin: 140,
      minDistanceFromPlayer: 700,
      attempts: 120
    }) || this.findObject('portal');
  }
}
