import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

const KING_MAX_HP = 1400;
const PHASE2_THRESHOLD = KING_MAX_HP * 0.66;
const PHASE3_THRESHOLD = KING_MAX_HP * 0.33;

const HOLD_DISTANCE = 220;
const HOLD_DURATION = 2200;
const TELEGRAPH_DURATION = 800;
const COOLDOWN_DURATION = 1500;
const ARC_RADIUS = 210;
const ARC_HALF_ANGLE = 1.05;
const TAIL_DAMAGE_BASE = 35;

const RAGE_SPEED_MULT = 2;
const RAGE_DAMAGE_MULT = 1.5;

const SUMMON_INTERVAL = 15000;
const INVULN_INTERVAL = 10000;
const INVULN_DURATION = 2000;

export default class Boss10Scene extends BaseLevelScene {
  constructor() {
    super('Boss10Scene');
    this.boss = null;
    this.portalPosition = null;
    this.phase = 1;
    this.bossState = 'holding';
    this.bossStateUntil = 0;
    this.tailDamage = TAIL_DAMAGE_BASE;
    this.summonEvent = null;
    this.invulnEvent = null;
    this.victoryTriggered = false;
  }

  create() {
    this.boss = null;
    this.phase = 1;
    this.bossState = 'holding';
    this.bossStateUntil = 0;
    this.tailDamage = TAIL_DAMAGE_BASE;
    this.summonEvent = null;
    this.invulnEvent = null;
    this.victoryTriggered = false;

    this.createLevel({
      levelNumber: 10,
      title: 'Nivel 10 — El Rey Escorpión',
      mapKey: 'nivel10',
      tilesetName: 'desierto',
      tilesetImageKey: 'desiertoTiles',
      levelMusicMood: 'desierto',
      musicMood: 'boss'
    });

    this.portalPosition = this.findObject('portal');
    this.spawnBoss();
    this.showObjective('Objetivo: derrota al Rey Escorpión. Su cola golpea en arco — posicionate al costado.', { backgroundColor: 'rgba(54, 12, 12, 0.8)' });
  }

  spawnBoss() {
    const spawn = this.findObject('boss_king_scorpion') || { x: this.map.widthInPixels - 200, y: this.map.heightInPixels / 2 };
    this.boss = this.spawnEnemy('boss_king_scorpion', spawn.x, spawn.y);
    this.bossState = 'holding';
    this.bossStateUntil = this.time.now + HOLD_DURATION;
  }

  update(time, delta) {
    super.update(time, delta);
    if (this.levelFinished) return;

    if (this.boss && this.boss.active) {
      this.updateBoss(time);
      this.checkPhaseTransitions();
    }

    this.checkLevelCompletion();
  }

  updateBoss(time) {
    // El Rey Escorpion encara al jugador vivo mas cercano.
    const target = this.getNearestPlayer(this.boss.x, this.boss.y);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, target.x, target.y);
    const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, target.x, target.y);
    const speed = this.boss.getData('speed');

    if (this.bossState === 'holding') {
      if (distance > HOLD_DISTANCE + 20) {
        this.physics.velocityFromRotation(angle, speed, this.boss.body.velocity);
      } else if (distance < HOLD_DISTANCE - 20) {
        this.physics.velocityFromRotation(angle + Math.PI, speed, this.boss.body.velocity);
      } else {
        this.boss.setVelocity(0, 0);
      }

      if (time > this.bossStateUntil) {
        this.enterTelegraph(time, angle);
      }
    } else if (this.bossState === 'telegraph') {
      this.boss.setVelocity(0, 0);
      if (time > this.bossStateUntil) {
        this.performSwipe(time);
      }
    } else if (this.bossState === 'cooldown') {
      this.boss.setVelocity(0, 0);
      if (time > this.bossStateUntil) {
        this.bossState = 'holding';
        this.bossStateUntil = time + HOLD_DURATION;
      }
    }
  }

  enterTelegraph(time, angle) {
    this.bossState = 'telegraph';
    this.bossStateUntil = time + TELEGRAPH_DURATION;
    this.boss.setData('facingAngle', angle);

    const cone = this.add.graphics().setDepth(25);
    cone.fillStyle(0xff5555, 0.35);
    cone.slice(this.boss.x, this.boss.y, ARC_RADIUS, angle - ARC_HALF_ANGLE, angle + ARC_HALF_ANGLE, false);
    cone.fillPath();
    this.fadeOutAndDestroy(cone, TELEGRAPH_DURATION);
  }

  performSwipe(time) {
    if (this.boss.active) {
      const facingAngle = this.boss.getData('facingAngle') || 0;

      // El golpe de cola barre un arco: cada jugador se evalua por separado, asi
      // uno puede esquivar poniendose al costado aunque el otro coma el golpe.
      let hitSomeone = false;
      this.getActivePlayers().forEach((player) => {
        const originAngle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, player.x, player.y);
        const distance = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, player.x, player.y);
        const withinArc = Math.abs(Phaser.Math.Angle.Wrap(originAngle - facingAngle)) < ARC_HALF_ANGLE;

        if (distance <= ARC_RADIUS && withinArc) {
          this.applyDamageToPlayer(this.tailDamage, player);
          hitSomeone = true;
        }
      });

      if (hitSomeone) {
        this.cameras.main.shake(200, 0.01);
      }
    }

    this.bossState = 'cooldown';
    this.bossStateUntil = time + COOLDOWN_DURATION;
  }

  checkPhaseTransitions() {
    const hp = this.boss.getData('hp');

    if (this.phase < 2 && hp <= PHASE2_THRESHOLD) {
      this.phase = 2;
      this.showObjective('¡El Rey Escorpión invoca refuerzos! Escorpiones centinela cada 15 segundos.', { backgroundColor: 'rgba(54, 12, 12, 0.8)' });
      this.announceBossPhase(1.5, 'scorpionRoar');
      this.summonEvent = this.time.addEvent({
        delay: SUMMON_INTERVAL,
        loop: true,
        callback: () => this.summonScorpions()
      });
    }

    if (this.phase < 3 && hp <= PHASE3_THRESHOLD) {
      this.phase = 3;
      this.enterRageMode();
    }
  }

  enterRageMode() {
    this.showObjective('¡Modo furia! Más rápido, más daño, e invulnerable un par de segundos cada tanto.', { backgroundColor: 'rgba(54, 12, 12, 0.8)' });
    this.boss.setData('speed', this.boss.getData('speed') * RAGE_SPEED_MULT);
    this.boss.setData('touchDamage', Math.round(this.boss.getData('touchDamage') * RAGE_DAMAGE_MULT));
    this.boss.setData('baseTint', 0xff2222);
    this.boss.setTint(0xff2222);
    this.tailDamage = Math.round(this.tailDamage * RAGE_DAMAGE_MULT);
    this.announceBossPhase(2.2, 'scorpionRoar');

    this.invulnEvent = this.time.addEvent({
      delay: INVULN_INTERVAL,
      loop: true,
      callback: () => this.activateInvulnWindow()
    });
  }

  activateInvulnWindow() {
    if (!this.boss || !this.boss.active) return;
    const now = this.time.now;
    this.boss.setData('invulnerableUntil', now + INVULN_DURATION);
    this.boss.setAlpha(0.5);
    this.time.delayedCall(INVULN_DURATION, () => {
      if (this.boss?.active) this.boss.setAlpha(1);
    });
  }

  summonScorpions() {
    if (!this.boss || !this.boss.active) return;
    const points = this.getRandomSafePoints(3, {
      margin: 140,
      minDistanceFromPlayer: 150,
      minDistanceBetween: 90
    });

    for (let i = 0; i < 3; i += 1) {
      const point = points[i] || {
        x: this.boss.x + Phaser.Math.Between(-140, 140),
        y: this.boss.y + Phaser.Math.Between(-140, 140)
      };
      this.spawnEnemy('scorpion', point.x, point.y);
    }
  }

  checkLevelCompletion() {
    if (this.levelFinished || this.victoryTriggered) return;
    if (!this.boss || this.boss.active) return;

    this.victoryTriggered = true;
    this.summonEvent?.remove();
    this.invulnEvent?.remove();

    addScore(this, 400);
    this.showObjective('¡Rey Escorpión derrotado! Entra al portal para tu victoria.', { backgroundColor: 'rgba(54, 12, 12, 0.8)' });
    this.createPortal(() => this.completeLevel(() => {
      this.scene.start('VictoryScene');
    }), this.portalPosition);
  }
}
