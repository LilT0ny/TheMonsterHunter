import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';
import { getAudio } from '../core/audio.js';

const GOLEM_MAX_HP = 900;
const PHASE2_THRESHOLD = GOLEM_MAX_HP * 0.5;
const APPROACH_RANGE = 140;
const APPROACH_TIMEOUT = 1400;
const APPROACH_SPEED = 60;
const TELEGRAPH_DURATION = 700;
const RETREAT_DURATION = 900;
const RETREAT_SPEED = 70;
const SLAM_RADIUS = 130;
const SLAM_DAMAGE = 30;

export default class Boss5Scene extends BaseLevelScene {
  constructor() {
    super('Boss5Scene');
    this.boss = null;
    this.bossSpawnPoint = null;
    this.bossState = 'approach';
    this.bossStateUntil = 0;
    this.phase2Triggered = false;
    this.fragments = [];
    this.spirits = [];
    this.rewardGiven = false;
    this.portalPosition = null;
  }

  create() {
    this.boss = null;
    this.bossState = 'approach';
    this.bossStateUntil = 0;
    this.phase2Triggered = false;
    this.fragments = [];
    this.spirits = [];
    this.rewardGiven = false;

    this.createLevel({
      levelNumber: 5,
      title: 'Nivel 5 — El Coloso de Piedra',
      mapKey: 'nivel5',
      tilesetName: 'desierto',
      tilesetImageKey: 'desiertoTiles',
      levelMusicMood: 'desierto',
      musicMood: 'boss'
    });

    this.portalPosition = this.findObject('portal');
    this.spawnBoss();
    this.events.off('enemyHpFloor', this.handleEnemyHpFloor, this);
    this.events.on('enemyHpFloor', this.handleEnemyHpFloor, this);
    this.showObjective('Objetivo: derrota al Coloso de Piedra. Esquivá el aplastón cuando parpadee en rojo.');
  }

  spawnBoss() {
    const spawn = this.findObject('boss_golem') || { x: this.map.widthInPixels - 200, y: this.map.heightInPixels / 2 };
    this.bossSpawnPoint = { x: spawn.x, y: spawn.y };
    this.boss = this.spawnEnemy('boss_golem', spawn.x, spawn.y);
    this.boss.setData('minHp', PHASE2_THRESHOLD);
    this.bossState = 'approach';
    this.bossStateUntil = this.time.now + APPROACH_TIMEOUT;
  }

  handleEnemyHpFloor(enemy) {
    if (enemy === this.boss && !this.phase2Triggered) {
      this.triggerPhase2();
    }
  }

  update(time, delta) {
    super.update(time, delta);
    if (this.levelFinished) return;

    if (this.boss && this.boss.active && !this.phase2Triggered) {
      this.updateBossPhase1(time);
    }

    this.checkLevelCompletion();
  }

  updateBossPhase1(time) {
    const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
    const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);

    if (this.bossState === 'approach') {
      this.physics.velocityFromRotation(angle, APPROACH_SPEED, this.boss.body.velocity);
      if (distance <= APPROACH_RANGE || time > this.bossStateUntil) {
        this.enterTelegraph(time);
      }
    } else if (this.bossState === 'telegraph') {
      this.boss.setVelocity(0, 0);
      this.boss.setTint(0xff4444);
      if (time > this.bossStateUntil) {
        this.performSlam(time);
      }
    } else if (this.bossState === 'retreat') {
      this.physics.velocityFromRotation(angle + Math.PI, RETREAT_SPEED, this.boss.body.velocity);
      if (time > this.bossStateUntil) {
        this.enterApproach(time);
      }
    }
  }

  enterApproach(time) {
    this.bossState = 'approach';
    this.bossStateUntil = time + APPROACH_TIMEOUT;
  }

  enterTelegraph(time) {
    this.bossState = 'telegraph';
    this.bossStateUntil = time + TELEGRAPH_DURATION;
    this.boss.setVelocity(0, 0);

    const ring = this.add.image(this.boss.x, this.boss.y, 'explosionRing')
      .setDepth(25)
      .setAlpha(0.7)
      .setScale(SLAM_RADIUS / 34);
    this.fadeOutAndDestroy(ring, TELEGRAPH_DURATION);
  }

  performSlam(time) {
    if (this.boss.active) {
      this.boss.clearTint();
      const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
      if (distance <= SLAM_RADIUS) {
        this.applyDamageToPlayer(SLAM_DAMAGE);
      }
      this.cameras.main.shake(220, 0.012);
      getAudio(this)?.playSfx('golemCreak');
    }

    this.bossState = 'retreat';
    this.bossStateUntil = time + RETREAT_DURATION;
  }

  triggerPhase2() {
    this.phase2Triggered = true;
    const remainingHp = Math.max(180, this.boss.getData('hp') || PHASE2_THRESHOLD);
    this.disableSprite(this.boss);

    this.showObjective('¡El Coloso se fragmenta! Los espíritus de arena solo son vulnerables a flechas eléctricas o explosivas.');
    this.cameras.main.shake(320, 0.02);
    this.announceBossPhase(1.6);

    const perFragmentHp = Math.max(60, Math.round(remainingHp / 3));
    const fragmentAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
    this.fragments = fragmentAngles.map((a) => {
      const x = this.bossSpawnPoint.x + Math.cos(a) * 70;
      const y = this.bossSpawnPoint.y + Math.sin(a) * 70;
      const fragment = this.spawnEnemy('golem_fragment', x, y);
      fragment.setData('hp', perFragmentHp);
      return fragment;
    });

    this.spirits = [-1, 1].map((side) => {
      const x = this.bossSpawnPoint.x + side * 90;
      const y = this.bossSpawnPoint.y - 70;
      return this.spawnEnemy('sand_spirit', x, y);
    });
  }

  checkLevelCompletion() {
    if (!this.phase2Triggered || this.rewardGiven || this.portal) return;
    const bossDefeated = this.fragments.length > 0 && this.fragments.every((fragment) => !fragment.active);
    if (!bossDefeated) return;

    this.rewardGiven = true;
    addScore(this, 250);
    this.spawnCoinCache(this.bossSpawnPoint.x, this.bossSpawnPoint.y, 20, 4);
    this.showObjective('¡Coloso de Piedra derrotado! Recogé las 80 monedas y entrá al portal.');
    this.createPortal(() => this.completeLevel(() => {
      this.scene.start('AbilityScene', {
        levelCompleted: 5,
        nextScene: 'AbilityScene',
        nextLevelScene: 'Level6Scene'
      });
    }), this.portalPosition);
  }
}
