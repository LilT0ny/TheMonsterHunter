import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

export default class Level2Scene extends BaseLevelScene {
  constructor() {
    super('Level2Scene');
    this.portalPosition = null;
  }

  create() {
    this.createLevel({
      levelNumber: 2,
      title: 'Nivel 2 — Dunas errantes',
      mapKey: 'nivel2',
      tilesetName: 'desierto',
      tilesetImageKey: 'desiertoTiles',
      levelMusicMood: 'desierto',
      musicMood: 'calm'
    });

    this.requiredKills = 10;
    this.portalPosition = this.pickRandomPortalPosition();
    this.spawnBushes(10);
    this.spawnRandomEnemies();
    this.spawnRandomCoinCaches();
    this.showObjective('Objetivo: matá a los limos VERDES rápido — cada uno se parte en dos si lo dejás vivo demasiado tiempo.');
  }

  checkLevelCompletion() {
    if (this.enemyKills >= this.requiredKills && !this.portal) {
      addScore(this, 60);
      this.showObjective('Dunas despejadas. Entra al portal para elegir habilidad y visitar la tienda.');
      this.createPortal(() => this.completeLevel(() => {
        this.scene.start('AbilityScene', {
          levelCompleted: 2,
          nextScene: 'TiendaScene',
          nextLevelScene: 'Level3Scene'
        });
      }), this.portalPosition);
    }
  }

  spawnRandomEnemies() {
    const scorpionPlan = Phaser.Utils.Array.Shuffle(['scorpion', 'scorpion', 'scorpion', 'scorpion', 'scorpion', 'scorpion']);
    const points = this.getRandomSafePoints(scorpionPlan.length, {
      margin: 150,
      minDistanceFromPlayer: 260,
      minDistanceBetween: 130
    });

    scorpionPlan.forEach((type, index) => {
      const fallback = this.findObjects(type)[index] || this.getRandomSafePoint({ minDistanceFromPlayer: 260 });
      const point = points[index] || fallback;
      if (point) {
        this.spawnEnemy(type, point.x, point.y);
      }
    });

    const elitePoint = this.getRandomSafePoint({ margin: 150, minDistanceFromPlayer: 520, attempts: 120 })
      || this.findObject('scorpion_elite');
    if (elitePoint) {
      this.spawnEnemy('scorpion_elite', elitePoint.x, elitePoint.y);
    }

    this.spawnSlimes();
  }

  /**
   * Los limos verdes son el reloj del nivel: cada uno se parte en dos a los 7
   * segundos, y esos hijos vuelven a partirse una vez mas. Dejarlos vivos no te
   * castiga con dano, te castiga con cantidad.
   */
  spawnSlimes() {
    const points = this.getRandomSafePoints(3, {
      margin: 160,
      minDistanceFromPlayer: 340,
      minDistanceBetween: 210
    });

    points.forEach((point) => {
      this.spawnEnemy('slime_green', point.x, point.y);
    });
  }

  spawnRandomCoinCaches() {
    const points = this.getRandomSafePoints(3, {
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
      minDistanceFromPlayer: 650,
      attempts: 120
    }) || this.findObject('portal');
  }
}
