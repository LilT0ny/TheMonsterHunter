import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

const TRAP_DAMAGE = 9;
const TRAP_DAMAGE_COOLDOWN = 450;
const FINAL_WAVE_ROSTER = ['spider', 'scorpion_elite', 'mummy', 'serpent', 'sand_spirit', 'guardian'];

export default class Level9Scene extends BaseLevelScene {
  constructor() {
    super('Level9Scene');
    this.portalPosition = null;
    this.roamRequiredEnemies = [];
    this.finalWaveRequiredEnemies = [];
    this.finalWaveSpawned = false;
  }

  create() {
    this.createLevel({
      levelNumber: 9,
      title: 'Nivel 9 — El corazón del desierto',
      mapKey: 'nivel9',
      tilesetName: 'desierto',
      tilesetImageKey: 'desiertoTiles',
      levelMusicMood: 'desierto',
      musicMood: 'tense'
    });

    this.finalWaveSpawned = false;
    this.portalPosition = this.findObject('portal');

    this.spawnGuardiansFromMap();
    this.spawnEnemiesFromMap(['spider', 'scorpion_elite', 'mummy_giant', 'serpent', 'sand_spirit']);
    // sand_spirit solo se puede matar con electric/explosive: si el jugador no tiene
    // ninguna de las dos, no debe contar para la cuota o el nivel queda imposible.
    this.roamRequiredEnemies = this.enemies.children.entries.filter((enemy) => !enemy.getData('vulnerableSkills'));

    this.createDangerZoneDamage(TRAP_DAMAGE, TRAP_DAMAGE_COOLDOWN, 'Trampa de arena: pierdes HP si te quedas ahi');
    this.showObjective('Objetivo: sobrevive a todo el bestiario combinado y a la oleada final antes de escapar.');
  }

  update(time, delta) {
    super.update(time, delta);
    if (!this.levelFinished) {
      this.updateDangerZoneDamage(time);
    }
  }

  triggerFinalWave() {
    this.finalWaveSpawned = true;
    this.cameras.main.shake(260, 0.015);
    this.showObjective('¡Oleada final! Todo el bestiario del desierto viene por vos.');

    const points = this.findObjects('final_wave_point');
    this.finalWaveRequiredEnemies = [];
    points.forEach((point, index) => {
      const type = FINAL_WAVE_ROSTER[index % FINAL_WAVE_ROSTER.length];
      let enemy;
      if (type === 'guardian') {
        enemy = this.spawnEnemy('guardian', point.x, point.y, { shieldFacing: Phaser.Math.Angle.Between(point.x, point.y, this.player.x, this.player.y) });
      } else {
        enemy = this.spawnEnemy(type, point.x, point.y);
      }
      // mismo criterio que en la fase de roam: sand_spirit no puede gatear la finalización.
      if (!enemy.getData('vulnerableSkills')) {
        this.finalWaveRequiredEnemies.push(enemy);
      }
    });
  }

  checkLevelCompletion() {
    if (this.levelFinished || this.portal) return;

    if (!this.finalWaveSpawned) {
      const roamCleared = this.roamRequiredEnemies.length > 0
        && this.roamRequiredEnemies.every((enemy) => !enemy.active);
      if (roamCleared) {
        this.triggerFinalWave();
      }
      return;
    }

    const finalWaveCleared = this.finalWaveRequiredEnemies.every((enemy) => !enemy.active);
    if (finalWaveCleared) {
      addScore(this, 180);
      this.showObjective('¡Corazón del desierto despejado! Entra al portal.');
      this.createPortal(() => this.completeLevel(() => {
        this.scene.start('AbilityScene', {
          levelCompleted: 9,
          nextScene: 'TiendaScene',
          nextLevelScene: 'Boss10Scene'
        });
      }), this.portalPosition);
    }
  }
}
