import { getDerivedStats, getPartyHealthRatio, getRun } from '../core/runState.js';
import { PLAYER_PROFILES } from '../core/config.js';
import { getAudio } from '../core/audio.js';

const HP_BAR_WIDTH = 168;

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create(data) {
    this.levelName = data.levelName || 'Nivel';
    this.levelSceneKey = data.levelSceneKey || null;
    this.levelNumber = data.levelNumber || 1;

    this.panel = this.add.rectangle(480, 27, 930, 50, 0x1d130d, 0.8)
      .setStrokeStyle(1, 0xf1c27d, 0.85)
      .setDepth(1000);

    this.text = this.add.text(20, 7, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#fff2cc'
    }).setDepth(1001);

    // Habilidades y dano bajan a la segunda fila: en co-op la primera se cruzaba
    // con la barra de vida de J1.
    this.statsText = this.add.text(292, 32, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ffe6b3'
    }).setDepth(1001);

    this.createProgress();
    this.createStarPreview();
    this.createHealthBars();
    this.createControls();
  }

  /** Avance del nivel: cuantos enemigos faltan para abrir el portal. */
  createProgress() {
    this.progressText = this.add.text(20, 32, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '12px',
      color: '#ffd27f'
    }).setDepth(1001);

    this.progressBarBg = this.add.rectangle(56, 39, 150, 9, 0x3d2a18, 1)
      .setDepth(1001).setOrigin(0, 0.5).setStrokeStyle(1, 0x6b4a28, 1);
    this.progressBar = this.add.rectangle(56, 39, 0, 9, 0xf1c27d, 1)
      .setDepth(1002).setOrigin(0, 0.5);
  }

  /** Estrellas en vivo: el jugador ve en todo momento cuales sigue cumpliendo. */
  createStarPreview() {
    this.starIcons = [0, 1, 2].map((i) => this.add.image(224 + i * 22, 38, 'starEmpty')
      .setDepth(1002)
      .setScale(0.62));
  }

  createHealthBars() {
    const run = getRun(this);
    this.healthBars = run.players.map((_, index) => {
      const coop = run.players.length > 1;
      const y = coop ? 15 + index * 24 : 27;
      const profile = PLAYER_PROFILES[index];

      const label = this.add.text(560, y, profile.label, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '12px',
        color: '#fff2cc'
      }).setOrigin(0, 0.5).setDepth(1001).setVisible(coop);

      const barBg = this.add.rectangle(coop ? 586 : 568, y, HP_BAR_WIDTH, 14, 0x4a1b15, 1)
        .setDepth(1001).setOrigin(0, 0.5);
      const bar = this.add.rectangle(coop ? 586 : 568, y, HP_BAR_WIDTH, 14, profile.accent, 1)
        .setDepth(1002).setOrigin(0, 0.5);
      const text = this.add.text((coop ? 586 : 568) + HP_BAR_WIDTH + 8, y, '', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '11px',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(1003);

      return { label, barBg, bar, text, accent: profile.accent };
    });
  }

  createControls() {
    const audio = getAudio(this);

    this.pauseButton = this.add.rectangle(862, 27, 56, 26, 0x6b3f1d, 0.95)
      .setStrokeStyle(1, 0xffd27f, 1)
      .setDepth(1003)
      .setInteractive({ useHandCursor: true });
    this.pauseLabel = this.add.text(862, 27, 'PAUSA', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '11px',
      color: '#fff2cc'
    }).setOrigin(0.5).setDepth(1004);

    const requestPause = () => {
      const level = this.levelSceneKey ? this.scene.get(this.levelSceneKey) : null;
      level?.pauseLevel?.();
    };

    this.pauseButton.on('pointerover', () => this.pauseButton.setFillStyle(0x8f5527, 1));
    this.pauseButton.on('pointerout', () => this.pauseButton.setFillStyle(0x6b3f1d, 0.95));
    this.pauseButton.on('pointerdown', requestPause);

    this.muteDot = this.add.circle(920, 27, 7, 0x63c46a)
      .setDepth(1003)
      .setInteractive({ useHandCursor: true });
    const refreshMuteDot = () => this.muteDot.setFillStyle(audio?.isMuted() ? 0xc0392b : 0x63c46a);
    refreshMuteDot();
    this.muteDot.on('pointerdown', () => {
      audio?.toggleMute();
      refreshMuteDot();
    });
  }

  update() {
    const run = getRun(this);
    const stats = getDerivedStats(run);
    const level = this.levelSceneKey ? this.scene.get(this.levelSceneKey) : null;

    this.text.setText(`${this.levelName}  |  Score: ${run.score}  |  Monedas: ${run.coins}`);
    this.statsText.setText(`Habilidades: ${run.skills.length}  ·  Daño: ${stats.arrowDamage}`);

    this.updateProgress(level);
    this.updateStars(level, run);
    this.updateHealthBars(run);
  }

  updateProgress(level) {
    const kills = level?.enemyKills ?? 0;
    const required = level?.requiredKills ?? 0;

    if (required <= 0) {
      this.progressText.setText('Enemigos:');
      this.progressBar.displayWidth = 0;
      return;
    }

    const done = Math.min(kills, required);
    this.progressText.setText(`${done}/${required}`);
    this.progressBar.displayWidth = 150 * (done / required);
    this.progressBar.setFillStyle(done >= required ? 0x63c46a : 0xf1c27d);
  }

  updateStars(level, run) {
    const cleared = (level?.requiredKills ?? 0) > 0 && (level?.enemyKills ?? 0) >= level.requiredKills;
    const healthy = getPartyHealthRatio(run) > 0.5;
    const perfect = Boolean(level?.hasClearedAllEnemies?.());

    [cleared, healthy, perfect].forEach((earned, i) => {
      this.starIcons[i].setTexture(earned ? 'starFull' : 'starEmpty');
    });
  }

  updateHealthBars(run) {
    // Si entro el jugador 2 a mitad de nivel, el HUD se rearma para mostrarlo.
    if (run.players.length !== this.healthBars.length) {
      this.healthBars.forEach(({ label, barBg, bar, text }) => {
        label.destroy();
        barBg.destroy();
        bar.destroy();
        text.destroy();
      });
      this.createHealthBars();
    }

    run.players.forEach((player, index) => {
      const entry = this.healthBars[index];
      if (!entry) return;

      const ratio = Phaser.Math.Clamp(player.hp / run.hpMax, 0, 1);
      entry.bar.displayWidth = HP_BAR_WIDTH * ratio;
      entry.bar.setFillStyle(player.down ? 0x8a3b3b : entry.accent);
      entry.text.setText(player.down ? 'CAÍDO' : `${player.hp}/${run.hpMax}`);
      entry.text.setColor(player.down ? '#ff9a8f' : '#ffffff');
    });
  }
}
