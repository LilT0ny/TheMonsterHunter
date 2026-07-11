import { resetRun, setLevel } from '../core/runState.js';
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

    addPanel(this, 480, 270, 740, 510, 0x21160f, 0.88);

    const muteButton = addButton(this, 792, 34, audio?.isMuted() ? 'Sonido: OFF' : 'Sonido: ON', () => {
      const muted = audio?.toggleMute();
      muteButton.setLabel(muted ? 'Sonido: OFF' : 'Sonido: ON');
    }, { width: 114, height: 30, fontSize: '12px' });

    this.add.text(480, 56, 'THE MONSTER HUNTER', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '32px',
      color: '#ffd27f',
      stroke: '#3b1708',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(480, 90, 'RPG · Roguelike · Pixel Art · Phaser 3 + Tiled', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffe6b3'
    }).setOrigin(0.5);

    this.add.text(480, 120,
      'Sobrevive, dispara flechas, recoge monedas y mejora tus stats.\nSi mueres, pierdes todo y vuelves a nivel 1.',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        align: 'center',
        color: '#fff7df',
        lineSpacing: 4
      }).setOrigin(0.5);

    addButton(this, 480, 168, 'Nueva partida — Nivel 1', () => {
      resetRun(this);
      this.scene.start('Level1Scene');
    }, { width: 320, height: 40 });

    this.add.text(480, 202, 'Probar nivel directamente:', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffe6b3'
    }).setOrigin(0.5);

    const testLevels = [
      { levelNumber: 2, sceneKey: 'Level2Scene', label: 'Nivel 2' },
      { levelNumber: 3, sceneKey: 'Level3Scene', label: 'Nivel 3' },
      { levelNumber: 4, sceneKey: 'Level4Scene', label: 'Nivel 4' },
      { levelNumber: 5, sceneKey: 'Boss5Scene', label: 'Boss 5' },
      { levelNumber: 6, sceneKey: 'Level6Scene', label: 'Nivel 6' },
      { levelNumber: 7, sceneKey: 'Level7Scene', label: 'Nivel 7' },
      { levelNumber: 8, sceneKey: 'Level8Scene', label: 'Nivel 8' },
      { levelNumber: 9, sceneKey: 'Level9Scene', label: 'Nivel 9' },
      { levelNumber: 10, sceneKey: 'Boss10Scene', label: 'Boss 10' }
    ];

    testLevels.forEach(({ levelNumber, sceneKey, label }, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = 480 + (col - 1) * 110;
      const y = 232 + row * 36;
      addButton(this, x, y, label, () => {
        resetRun(this);
        setLevel(this, levelNumber);
        this.scene.start(sceneKey);
      }, { width: 100, height: 32, fontSize: '13px' });
    });

    addButton(this, 480, 350, 'Controles', () => this.showControls(), { width: 320, height: 40 });
  }

  showControls() {
    const panel = addPanel(this, 480, 270, 620, 260, 0x160f0a, 0.96).setDepth(20);
    const text = this.add.text(480, 250,
      'CONTROLES\n\nWASD o flechas: mover al arquero\nClick izquierdo: disparar hacia el cursor\nESPACIO: disparar hacia la última dirección\nESC: volver al menú desde un nivel',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#fff2cc',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5).setDepth(21);

    const close = addButton(this, 480, 385, 'Cerrar', () => {
      panel.destroy();
      text.destroy();
      close.bg.destroy();
      close.text.destroy();
    }, { width: 180 });
    close.bg.setDepth(21);
    close.text.setDepth(22);
  }
}
