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
      levelMusicMood: 'desierto'
    });

    this.requiredKills = 8;
    this.portalPosition = this.pickRandomPortalPosition();
    this.spawnRandomEnemies();
    this.spawnRandomCoinCaches();
    this.showObjective('Objetivo: explora el desierto, elimina enemigos y busca el portal.');
  }

  showObjective(text) {
    const objective = this.add.text(480, 78, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#fff2cc',
      backgroundColor: 'rgba(54, 29, 12, 0.78)',
      padding: { left: 12, right: 12, top: 8, bottom: 8 }
    }).setScrollFactor(0).setOrigin(0.5).setDepth(1100);

    this.tweens.add({
      targets: objective,
      alpha: 0,
      delay: 4200,
      duration: 700,
      onComplete: () => objective.destroy()
    });
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
      'scorpion',
      'scorpion',
      Phaser.Math.RND.pick(['spider', 'scorpion'])
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
