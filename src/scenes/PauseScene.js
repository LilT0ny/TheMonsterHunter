import { STAR_GOALS } from '../core/config.js';
import { getPartyHealthRatio, getRun, loadRunIntoRegistry } from '../core/runState.js';
import { readSavedRun } from '../core/profile.js';
import { addButton, addPanel } from '../core/ui.js';
import { getAudio } from '../core/audio.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(data) {
    this.levelSceneKey = data.levelSceneKey;
    this.levelTitle = data.levelTitle || 'Nivel';

    this.add.rectangle(480, 270, 960, 540, 0x000000, 0.62).setDepth(0);
    addPanel(this, 480, 270, 660, 440, 0x21160f, 0.97).setDepth(1);

    this.add.text(480, 92, 'PAUSA', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '42px',
      color: '#ffd27f',
      stroke: '#341304',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(2);

    this.add.text(480, 130, this.levelTitle, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#fff7df'
    }).setOrigin(0.5).setDepth(2);

    this.renderStarGoals();

    // addButton crea en depth 0, y el panel de fondo esta en depth 1: sin subir
    // los botones quedan tapados por el propio panel.
    [
      addButton(this, 480, 330, 'Reanudar', () => this.resumeLevel(), { width: 300 }),
      addButton(this, 480, 386, 'Reiniciar nivel', () => this.restartLevel(), { width: 300, height: 40, fontSize: '16px' }),
      addButton(this, 480, 436, 'Volver al menú', () => this.exitToMenu(), { width: 300, height: 40, fontSize: '16px' })
    ].forEach(({ bg, text }) => {
      bg.setDepth(3);
      text.setDepth(4);
    });

    this.add.text(480, 478, 'ESC o P para reanudar', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffe6b3'
    }).setOrigin(0.5).setDepth(2);

    this.input.keyboard.on('keydown-ESC', () => this.resumeLevel());
    this.input.keyboard.on('keydown-P', () => this.resumeLevel());
  }

  /** Muestra las 3 metas y cuales se estan cumpliendo ahora mismo. */
  renderStarGoals() {
    const level = this.scene.get(this.levelSceneKey);
    const run = getRun(this);

    const cleared = (level?.requiredKills ?? 0) > 0 && (level?.enemyKills ?? 0) >= level.requiredKills;
    const healthy = getPartyHealthRatio(run) > 0.5;
    const perfect = Boolean(level?.hasClearedAllEnemies?.());
    const status = [cleared, healthy, perfect];

    this.add.text(480, 166, 'OBJETIVOS DE ESTRELLA', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '14px',
      color: '#ffd27f'
    }).setOrigin(0.5).setDepth(2);

    STAR_GOALS.forEach((goal, index) => {
      const y = 196 + index * 30;
      this.add.image(250, y, status[index] ? 'starFull' : 'starEmpty')
        .setScale(0.75)
        .setDepth(2);
      this.add.text(276, y, goal.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: status[index] ? '#c9f5b8' : '#fff7df'
      }).setOrigin(0, 0.5).setDepth(2);
    });

    const level3Hint = level?.enemyKills ?? 0;
    this.add.text(480, 292, `Enemigos eliminados: ${level3Hint} de ${level?.requiredKills ?? '?'}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffe6b3'
    }).setOrigin(0.5).setDepth(2);
  }

  resumeLevel() {
    const level = this.scene.get(this.levelSceneKey);
    // Evita que la misma pulsacion de ESC reabra la pausa al reanudar.
    if (level) level.nextPauseAllowedAt = level.time.now + 320;

    getAudio(this)?.playSfx('unpause');
    this.scene.resume(this.levelSceneKey);
    this.scene.stop();
  }

  /**
   * Reinicia desde el checkpoint escrito al entrar al nivel, no desde el estado
   * actual: si no, morir a proposito y reiniciar seria una forma de farmear.
   */
  restartLevel() {
    const saved = readSavedRun();
    if (saved?.run) {
      loadRunIntoRegistry(this, saved.run);
    }

    getAudio(this)?.playSfx('uiSelect');
    this.scene.stop('UIScene');
    this.scene.stop(this.levelSceneKey);
    this.scene.start(this.levelSceneKey);
  }

  exitToMenu() {
    getAudio(this)?.playSfx('uiSelect');
    getAudio(this)?.stopAllFoley();
    this.scene.stop('UIScene');
    this.scene.stop(this.levelSceneKey);
    this.scene.start('MenuScene');
  }
}
