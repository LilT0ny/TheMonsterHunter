import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/config.js';
import { getAudio } from '../core/audio.js';

const WAVE_ENEMY_SPEED_MULTIPLIER = 1.3;
const WAVE_INTERVAL = 3200;

export default class Level4Scene extends BaseLevelScene {
  constructor() {
    super('Level4Scene');
    this.wavesSpawned = 0;
    this.maxWaves = 3;
    this.portalPosition = null;
    this.waveSpawnPoints = [];
  }

  create() {
    this.createLevel({
      levelNumber: 4,
      title: 'Nivel 4 — Tormenta de arena',
      mapKey: 'nivel4',
      tilesetName: 'desierto',
      tilesetImageKey: 'desiertoTiles',
      levelMusicMood: 'desierto',
      musicMood: 'calm'
    });

    this.wavesSpawned = 0;
    this.maxWaves = 3;

    this.portalPosition = this.pickRandomPortalPosition();
    this.waveSpawnPoints = this.pickWaveSpawnPoints();
    this.spawnRandomCoinCaches();
    this.createSandstormOverlay();
    getAudio(this)?.startFoley('sandstorm');
    this.startTimedWaves();
    this.showObjective('Objetivo: sobrevive a 3 oleadas seguidas sin pausa entre ellas y busca el portal.', { backgroundColor: 'rgba(54, 34, 12, 0.82)' });
  }

  createSandstormOverlay() {
    if (!this.textures.exists('sandstormVignette')) {
      const canvasTexture = this.textures.createCanvas('sandstormVignette', GAME_WIDTH, GAME_HEIGHT);
      const ctx = canvasTexture.getContext();
      const gradient = ctx.createRadialGradient(
        GAME_WIDTH / 2, GAME_HEIGHT / 2, 90,
        GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.62
      );
      gradient.addColorStop(0, 'rgba(90, 60, 30, 0)');
      gradient.addColorStop(1, 'rgba(60, 38, 18, 0.88)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      canvasTexture.refresh();
    }

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sandstormVignette')
      .setScrollFactor(0)
      .setDepth(900)
      .setAlpha(0.85);
  }

  startTimedWaves() {
    this.spawnWave();
    this.waveEvent = this.time.addEvent({
      delay: WAVE_INTERVAL,
      repeat: this.maxWaves - 2,
      callback: () => this.spawnWave()
    });
  }

  spawnWave() {
    this.wavesSpawned += 1;
    const spawners = this.waveSpawnPoints.length > 0 ? this.waveSpawnPoints : this.findObjects('wave_spawner');
    const waveText = this.add.text(480, 120, `Oleada ${this.wavesSpawned}/${this.maxWaves}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '30px',
      color: '#ffd27f',
      stroke: '#2b0b05',
      strokeThickness: 5
    }).setScrollFactor(0).setOrigin(0.5).setDepth(1100);
    this.tweens.add({ targets: waveText, alpha: 0, y: 95, delay: 850, duration: 600, onComplete: () => waveText.destroy() });

    const roster = ['spider', 'scorpion', 'mummy', 'serpent'];
    spawners.forEach((spawner, i) => {
      const type = roster[(this.wavesSpawned + i) % roster.length];
      this.spawnFastEnemy(type, spawner.x, spawner.y);
    });

    if (this.wavesSpawned >= 2) {
      const point = this.getRandomSafePoint({ minDistanceFromPlayer: 240 }) || { x: this.player.x + 260, y: this.player.y - 100 };
      this.spawnFastEnemy('serpent', point.x, point.y);
    }
  }

  spawnFastEnemy(type, x, y) {
    const enemy = this.spawnEnemy(type, x, y);
    enemy.setData('speed', (enemy.getData('speed') || 70) * WAVE_ENEMY_SPEED_MULTIPLIER);
    return enemy;
  }

  checkLevelCompletion() {
    const activeEnemies = this.enemies.countActive(true);
    const wavesDone = this.wavesSpawned >= this.maxWaves;
    if (wavesDone && activeEnemies === 0 && !this.portal) {
      addScore(this, 110);
      this.showObjective('¡Tormenta superada! Entra al portal para continuar.', { backgroundColor: 'rgba(54, 34, 12, 0.82)' });
      getAudio(this)?.stopFoley('sandstorm');
      this.createPortal(() => this.completeLevel(() => {
        this.scene.start('AbilityScene', {
          levelCompleted: 4,
          nextScene: 'TiendaScene',
          nextLevelScene: 'Boss5Scene'
        });
      }), this.portalPosition);
    }
  }

  pickWaveSpawnPoints() {
    const points = this.getRandomSafePoints(3, {
      margin: 180,
      minDistanceFromPlayer: 300,
      minDistanceBetween: 220
    });

    return points.length >= 3 ? points : this.findObjects('wave_spawner');
  }

  spawnRandomCoinCaches() {
    const points = this.getRandomSafePoints(3, {
      margin: 150,
      minDistanceFromPlayer: 200,
      minDistanceBetween: 200
    });

    points.forEach((point) => {
      this.spawnCoinCache(point.x, point.y, Phaser.Math.Between(3, 6));
    });
  }

  pickRandomPortalPosition() {
    return this.getRandomSafePoint({
      margin: 150,
      minDistanceFromPlayer: 700,
      attempts: 120
    }) || this.findObject('portal');
  }

  update(time, delta) {
    super.update(time, delta);
    if (!this.levelFinished) {
      this.checkLevelCompletion();
    }
  }
}
