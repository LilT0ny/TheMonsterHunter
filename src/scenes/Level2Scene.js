import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

const LAVA_DAMAGE = 8;
const LAVA_DAMAGE_COOLDOWN = 500;
const LAVA_PROXIMITY = 10;

export default class Level2Scene extends BaseLevelScene {
  constructor() {
    super('Level2Scene');
    this.nextLavaDamageAt = 0;
    this.wavesSpawned = 0;
    this.maxWaves = 3;
    this.lavaWarningText = null;
    this.portalPosition = null;
    this.waveSpawnPoints = [];
  }

  create() {
    this.createLevel({
      levelNumber: 2,
      title: 'Nivel 2 — Catacumbas ardientes',
      mapKey: 'nivel2',
      tilesetName: 'catacumbas',
      tilesetImageKey: 'catacumbasTiles',
      levelMusicMood: 'catacumbas'
    });

    this.nextLavaDamageAt = 0;
    this.wavesSpawned = 0;
    this.maxWaves = 3;
    this.requiredKills = 9;
    this.lavaWarningText = null;

    this.applyRandomLavaPattern();
    this.portalPosition = this.pickRandomPortalPosition();
    this.waveSpawnPoints = this.pickWaveSpawnPoints();
    this.spawnRandomCoinCaches();
    this.createLavaDamage();
    this.createMovingPlatforms();
    this.startTimedWaves();
    this.showObjective('Objetivo: sobrevive a 3 oleadas, evita la lava y entra al portal.');
  }

  showObjective(text) {
    const objective = this.add.text(480, 78, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#fff2cc',
      backgroundColor: 'rgba(20, 10, 8, 0.82)',
      padding: { left: 12, right: 12, top: 8, bottom: 8 }
    }).setScrollFactor(0).setOrigin(0.5).setDepth(1100);

    this.tweens.add({
      targets: objective,
      alpha: 0,
      delay: 4500,
      duration: 700,
      onComplete: () => objective.destroy()
    });
  }

  createLavaDamage() {
    if (!this.dangerLayer) return;
    this.dangerLayer.setCollisionByExclusion([-1, 0]);
    this.lavaWarningText = this.add.text(480, 156, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#ffcf8a',
      stroke: '#4f1008',
      strokeThickness: 4
    }).setScrollFactor(0).setOrigin(0.5).setDepth(1100).setAlpha(0);
  }

  updateLavaDamage(time) {
    if (!this.dangerLayer || !this.player || this.levelFinished) return;

    const nearLava = this.isPlayerNearLava();
    if (this.lavaWarningText) {
      this.lavaWarningText.setText(nearLava ? 'Lava cercana: pierdes HP si te quedas ahi' : '');
      this.lavaWarningText.setAlpha(nearLava ? 1 : 0);
    }

    if (!nearLava || time < this.nextLavaDamageAt) return;

    this.nextLavaDamageAt = time + LAVA_DAMAGE_COOLDOWN;
    this.applyDamageToPlayer(LAVA_DAMAGE);
  }

  isPlayerNearLava() {
    const body = this.player.body;
    const tileWidth = this.map.tileWidth;
    const tileHeight = this.map.tileHeight;
    const bounds = {
      left: body.x - LAVA_PROXIMITY,
      right: body.x + body.width + LAVA_PROXIMITY,
      top: body.y - LAVA_PROXIMITY,
      bottom: body.y + body.height + LAVA_PROXIMITY
    };

    const minTileX = Math.max(0, Math.floor(bounds.left / tileWidth));
    const maxTileX = Math.min(this.map.width - 1, Math.floor(bounds.right / tileWidth));
    const minTileY = Math.max(0, Math.floor(bounds.top / tileHeight));
    const maxTileY = Math.min(this.map.height - 1, Math.floor(bounds.bottom / tileHeight));

    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
        const tile = this.dangerLayer.getTileAt(tileX, tileY);
        if (tile && tile.index > 0 && this.isBodyNearTile(body, tileX, tileY)) {
          return true;
        }
      }
    }

    return false;
  }

  isBodyNearTile(body, tileX, tileY) {
    const tileLeft = tileX * this.map.tileWidth;
    const tileRight = tileLeft + this.map.tileWidth;
    const tileTop = tileY * this.map.tileHeight;
    const tileBottom = tileTop + this.map.tileHeight;
    const bodyRight = body.x + body.width;
    const bodyBottom = body.y + body.height;
    const dx = Math.max(tileLeft - bodyRight, body.x - tileRight, 0);
    const dy = Math.max(tileTop - bodyBottom, body.y - tileBottom, 0);

    return Math.hypot(dx, dy) <= LAVA_PROXIMITY;
  }

  createMovingPlatforms() {
    const platformObjects = this.findObjects('platform');
    platformObjects.forEach((object, index) => {
      const offsetX = Phaser.Math.Between(-64, 64);
      const offsetY = Phaser.Math.Between(-44, 44);
      const x = Phaser.Math.Clamp(object.x + object.width / 2 + offsetX, 160, this.map.widthInPixels - 160);
      const y = Phaser.Math.Clamp(object.y + object.height / 2 + offsetY, 120, this.map.heightInPixels - 120);
      const platform = this.platforms.create(x, y, 'platform')
        .setDepth(8);
      platform.body.setAllowGravity(false);
      platform.body.setImmovable(true);
      platform.body.setSize(object.width || 112, object.height || 26);
      platform.displayWidth = object.width || 112;
      platform.displayHeight = object.height || 26;

      const horizontal = index % 2 === 0;
      this.tweens.add({
        targets: platform,
        x: horizontal ? platform.x + 170 : platform.x,
        y: horizontal ? platform.y : platform.y + 120,
        duration: 2300 + index * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    });

    this.physics.add.collider(this.player, this.platforms);
    if (this.wallsLayer) this.physics.add.collider(this.platforms, this.wallsLayer);
  }

  startTimedWaves() {
    this.spawnWave();
    this.waveEvent = this.time.addEvent({
      delay: 8000,
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
    this.tweens.add({ targets: waveText, alpha: 0, y: 95, delay: 950, duration: 700, onComplete: () => waveText.destroy() });

    spawners.forEach((spawner, i) => {
      const type = (this.wavesSpawned + i) % 2 === 0 ? 'serpent' : 'mummy';
      this.spawnEnemy(type, spawner.x, spawner.y);
    });

    if (this.wavesSpawned === 2) {
      const point = this.getRandomSafePoint({ minDistanceFromPlayer: 260 }) || { x: this.player.x + 280, y: this.player.y - 120 };
      this.spawnEnemy('mummy', point.x, point.y);
    }

    if (this.wavesSpawned === 3) {
      const points = this.getRandomSafePoints(2, { minDistanceFromPlayer: 280, minDistanceBetween: 150 });
      const first = points[0] || { x: this.player.x + 320, y: this.player.y + 110 };
      const second = points[1] || { x: this.player.x + 360, y: this.player.y - 30 };
      this.spawnEnemy('serpent', first.x, first.y);
      this.spawnEnemy('mummy', second.x, second.y);
    }
  }

  checkLevelCompletion() {
    const activeEnemies = this.enemies.countActive(true);
    const wavesDone = this.wavesSpawned >= this.maxWaves;
    if (wavesDone && activeEnemies === 0 && !this.portal) {
      addScore(this, 100);
      this.showObjective('¡Catacumbas completadas! Entra al portal para finalizar el MVP.');
      this.createPortal(() => this.completeLevel(() => this.scene.start('VictoryScene')), this.portalPosition);
    }
  }

  applyRandomLavaPattern() {
    if (!this.dangerLayer) return;

    const openings = Phaser.Math.RND.pick([
      [{ x: 8, y: 15, width: 4, height: 4 }, { x: 36, y: 20, width: 3, height: 4 }],
      [{ x: 14, y: 5, width: 4, height: 3 }, { x: 25, y: 21, width: 5, height: 3 }],
      [{ x: 4, y: 16, width: 4, height: 3 }, { x: 31, y: 5, width: 5, height: 3 }]
    ]);

    openings.forEach((rect) => this.clearDangerRect(rect));

    const extraPools = Phaser.Math.RND.pick([
      [{ x: 20, y: 13, width: 3, height: 2 }],
      [{ x: 32, y: 15, width: 2, height: 3 }],
      [{ x: 42, y: 10, width: 3, height: 2 }]
    ]);

    extraPools.forEach((rect) => this.fillDangerRect(rect));
  }

  clearDangerRect({ x, y, width, height }) {
    for (let tileY = y; tileY < y + height; tileY += 1) {
      for (let tileX = x; tileX < x + width; tileX += 1) {
        this.dangerLayer.removeTileAt(tileX, tileY);
      }
    }
  }

  fillDangerRect({ x, y, width, height }) {
    for (let tileY = y; tileY < y + height; tileY += 1) {
      for (let tileX = x; tileX < x + width; tileX += 1) {
        if (this.isPointSafe(tileX * this.map.tileWidth + 16, tileY * this.map.tileHeight + 16, false)) {
          this.dangerLayer.putTileAt(3, tileX, tileY);
        }
      }
    }
  }

  pickWaveSpawnPoints() {
    const points = this.getRandomSafePoints(3, {
      margin: 180,
      minDistanceFromPlayer: 320,
      minDistanceBetween: 230
    });

    return points.length >= 3 ? points : this.findObjects('wave_spawner');
  }

  spawnRandomCoinCaches() {
    const points = this.getRandomSafePoints(3, {
      margin: 160,
      minDistanceFromPlayer: 220,
      minDistanceBetween: 220
    });

    points.forEach((point) => {
      this.spawnCoinCache(point.x, point.y, Phaser.Math.Between(4, 7));
    });
  }

  pickRandomPortalPosition() {
    return this.getRandomSafePoint({
      margin: 160,
      minDistanceFromPlayer: 750,
      attempts: 140
    }) || this.findObject('portal');
  }

  update(time, delta) {
    super.update(time, delta);
    if (!this.levelFinished) {
      this.updateLavaDamage(time);
      this.checkLevelCompletion();
    }
  }
}
