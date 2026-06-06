import { resetRun, setLevel } from '../core/runState.js';
import { addButton, addPanel } from '../core/ui.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#2a160d');
    this.add.tileSprite(480, 270, 960, 540, 'desiertoTiles').setAlpha(0.15);

    addPanel(this, 480, 270, 720, 430, 0x21160f, 0.88);

    this.add.text(480, 98, 'THE MONSTER HUNTER', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px',
      color: '#ffd27f',
      stroke: '#3b1708',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(480, 148, 'RPG · Roguelike · Pixel Art · Phaser 3 + Tiled', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffe6b3'
    }).setOrigin(0.5);

    this.add.text(480, 198,
      'Sobrevive, dispara flechas, recoge monedas y mejora tus stats.\nSi mueres, pierdes todo y vuelves a nivel 1.',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        align: 'center',
        color: '#fff7df',
        lineSpacing: 8
      }).setOrigin(0.5);

    addButton(this, 480, 282, 'Nueva partida — Nivel 1', () => {
      resetRun(this);
      this.scene.start('Level1Scene');
    }, { width: 310 });

    addButton(this, 480, 342, 'Probar Nivel 2', () => {
      resetRun(this);
      setLevel(this, 2);
      this.scene.start('Level2Scene');
    }, { width: 310 });

    addButton(this, 480, 402, 'Controles', () => this.showControls(), { width: 310 });
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
