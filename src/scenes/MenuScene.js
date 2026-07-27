import { LEVEL_SEQUENCE, STARS_PER_LEVEL, labelForLevel } from '../core/config.js';
import { loadRunIntoRegistry, resetRun, setLevel } from '../core/runState.js';
import {
  getMaxTotalStars,
  getProfile,
  getStars,
  getTotalStars,
  isIntroSeen,
  isLevelUnlocked,
  readSavedRun,
  resetProfile
} from '../core/profile.js';
import { addButton, addPanel } from '../core/ui.js';
import { getAudio } from '../core/audio.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#2a160d');
    this.add.tileSprite(480, 270, 960, 540, 'desiertoTiles').setAlpha(0.15);

    const audio = getAudio(this);
    const resumeAudio = () => audio?.resume();
    this.input.once('pointerdown', resumeAudio);
    this.input.keyboard.once('keydown', resumeAudio);
    audio?.stopAllFoley();
    audio?.stopMusic();

    addPanel(this, 480, 270, 900, 512, 0x21160f, 0.9);

    const muteButton = addButton(this, 872, 32, audio?.isMuted() ? 'Sonido: OFF' : 'Sonido: ON', () => {
      const muted = audio?.toggleMute();
      muteButton.setLabel(muted ? 'Sonido: OFF' : 'Sonido: ON');
    }, { width: 114, height: 28, fontSize: '12px' });

    this.add.text(480, 46, 'THE MONSTER HUNTER', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '32px',
      color: '#ffd27f',
      stroke: '#3b1708',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(480, 78, 'RPG · Roguelike · Pixel Art · Phaser 3 + Tiled', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffe6b3'
    }).setOrigin(0.5);

    this.renderStarCounter();
    this.renderMainActions();
    this.renderLevelGrid();
    this.renderFooter();
  }

  renderStarCounter() {
    const total = getTotalStars(this);
    const max = getMaxTotalStars();

    this.add.image(432, 104, 'starFull').setScale(0.8);
    this.add.text(452, 104, `${total} / ${max} estrellas`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '17px',
      color: total >= max ? '#8dffa1' : '#ffd27f'
    }).setOrigin(0, 0.5);
  }

  renderMainActions() {
    const saved = readSavedRun();

    if (saved) {
      addButton(this, 352, 148, `Continuar — ${labelForLevel(saved.run.level)}`, () => {
        loadRunIntoRegistry(this, saved.run);
        getAudio(this)?.playSfx('uiSelect');
        this.scene.start(saved.sceneKey);
      }, { width: 250, height: 42, fontSize: '16px' });

      addButton(this, 608, 148, 'Nueva partida', () => this.startNewRun(), {
        width: 250, height: 42, fontSize: '16px'
      });
    } else {
      addButton(this, 480, 148, 'Nueva partida — Nivel 1', () => this.startNewRun(), {
        width: 320, height: 42
      });
    }

    addButton(this, 480, 196, 'Cómo se juega', () => {
      getAudio(this)?.playSfx('uiSelect');
      this.scene.start('IntroScene', { returnToMenu: true });
    }, { width: 240, height: 34, fontSize: '15px' });
  }

  startNewRun() {
    resetRun(this);
    getAudio(this)?.playSfx('uiSelect');
    // La primera vez explicamos el juego; despues arranca directo.
    this.scene.start(isIntroSeen(this) ? 'Level1Scene' : 'IntroScene', { nextScene: 'Level1Scene' });
  }

  renderLevelGrid() {
    const maxUnlocked = getProfile(this).maxLevelUnlocked;

    this.add.text(480, 234, `Niveles desbloqueados: ${maxUnlocked} de ${LEVEL_SEQUENCE.length}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffe6b3'
    }).setOrigin(0.5);

    LEVEL_SEQUENCE.forEach(({ level, sceneKey, label }, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      const x = 480 + (col - 2) * 104;
      const y = 274 + row * 74;
      const unlocked = isLevelUnlocked(this, level);

      const button = addButton(this, x, y, unlocked ? label : `${label} 🔒`, () => {
        if (!unlocked) {
          this.flashLockedMessage(level);
          return;
        }
        resetRun(this);
        setLevel(this, level);
        getAudio(this)?.playSfx('uiSelect');
        this.scene.start(sceneKey);
      }, { width: 94, height: 30, fontSize: '12px' });

      if (!unlocked) {
        button.bg.setFillStyle(0x3a2a1c, 0.9);
        button.text.setColor('#8d7a63');
      }

      this.renderLevelStars(x, y + 24, getStars(this, level));
    });
  }

  renderLevelStars(x, y, earned) {
    for (let i = 0; i < STARS_PER_LEVEL; i += 1) {
      this.add.image(x + (i - 1) * 17, y, i < earned ? 'starFull' : 'starEmpty').setScale(0.52);
    }
  }

  flashLockedMessage(level) {
    if (this.lockedMessage) this.lockedMessage.destroy();
    this.lockedMessage = this.add.text(480, 424, `El ${labelForLevel(level)} todavía está bloqueado. Completá los niveles anteriores.`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#ffb3a7'
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: this.lockedMessage,
      alpha: 0,
      delay: 1800,
      duration: 500,
      onComplete: () => {
        this.lockedMessage?.destroy();
        this.lockedMessage = null;
      }
    });
  }

  renderFooter() {
    this.add.text(480, 452,
      'Si morís perdés habilidades y mejoras, pero las estrellas y los niveles desbloqueados quedan guardados.',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#fff7df',
        align: 'center'
      }).setOrigin(0.5);

    addButton(this, 480, 492, 'Borrar progreso guardado', () => this.confirmReset(), {
      width: 260, height: 30, fontSize: '13px'
    });
  }

  confirmReset() {
    if (this.resetPending) {
      resetProfile(this);
      resetRun(this);
      this.resetPending = false;
      this.scene.restart();
      return;
    }

    this.resetPending = true;
    this.flashResetWarning();
  }

  flashResetWarning() {
    if (this.resetWarning) this.resetWarning.destroy();
    this.resetWarning = this.add.text(480, 424, 'Esto borra estrellas y partida guardada. Tocá de nuevo para confirmar.', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '14px',
      color: '#ffb3a7'
    }).setOrigin(0.5).setDepth(30);

    this.time.delayedCall(3000, () => {
      this.resetPending = false;
      this.resetWarning?.destroy();
      this.resetWarning = null;
    });
  }
}
