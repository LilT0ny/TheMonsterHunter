import { PLAYER_PROFILES, STAR_GOALS, TOTAL_LEVELS } from '../core/config.js';
import { markIntroSeen } from '../core/profile.js';
import { addButton, addPanel } from '../core/ui.js';
import { getAudio } from '../core/audio.js';

const SECTIONS = [
  {
    title: 'DE QUÉ SE TRATA',
    body: `Sos un arquero atrapado en el desierto. Diez niveles, cada uno más duro que el anterior, hasta llegar al Rey Escorpión. Limpiás la zona de enemigos, se abre el portal, y seguís.`
  },
  {
    title: 'CÓMO SE JUEGA',
    body: `Te movés, apuntás con el mouse y disparás flechas. Entre nivel y nivel elegís una habilidad nueva y gastás monedas en la tienda para mejorar vida, daño, armadura, velocidad y suerte.`
  },
  {
    title: 'ES UN ROGUELIKE',
    body: `Si morís, perdés las habilidades y las mejoras de esa partida y volvés al Nivel 1. Lo que NO perdés son las estrellas y los niveles desbloqueados: eso queda guardado para siempre.`
  }
];

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create(data) {
    this.nextScene = data?.nextScene || 'Level1Scene';
    this.returnToMenu = Boolean(data?.returnToMenu);

    this.cameras.main.setBackgroundColor('#1b110c');
    this.add.tileSprite(480, 270, 960, 540, 'desiertoTiles').setAlpha(0.12);
    addPanel(this, 480, 270, 900, 512, 0x21160f, 0.94);

    this.add.text(480, 46, 'CÓMO SE JUEGA', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '32px',
      color: '#ffd27f',
      stroke: '#341304',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.renderSections();
    this.renderStars();
    this.renderControls();

    const label = this.returnToMenu ? 'Volver al menú' : 'Empezar — Nivel 1';
    addButton(this, 480, 496, label, () => this.finish(), { width: 300, height: 40 });
  }

  renderSections() {
    SECTIONS.forEach((section, index) => {
      const x = 172 + index * 308;
      addPanel(this, x, 168, 288, 176, 0x3b2416, 0.92);

      this.add.text(x, 100, section.title, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '15px',
        color: '#ffd27f'
      }).setOrigin(0.5);

      this.add.text(x, 176, section.body, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#fff7df',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: 258 }
      }).setOrigin(0.5);
    });
  }

  renderStars() {
    this.add.text(480, 282, `LAS 3 ESTRELLAS DE CADA NIVEL (${TOTAL_LEVELS} niveles = ${TOTAL_LEVELS * 3} estrellas)`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px',
      color: '#ffd27f'
    }).setOrigin(0.5);

    // Tres columnas centradas en 175 / 480 / 785: con el layout anterior la
    // tercera etiqueta se salia del panel por la derecha.
    STAR_GOALS.forEach((goal, index) => {
      const columnCenter = 175 + index * 305;
      this.add.image(columnCenter - 108, 314, 'starFull').setScale(0.85);
      this.add.text(columnCenter - 90, 314, goal.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#fff7df',
        wordWrap: { width: 196 }
      }).setOrigin(0, 0.5);
    });
  }

  renderControls() {
    addPanel(this, 480, 400, 880, 108, 0x3b2416, 0.9);

    this.add.text(480, 362, 'CONTROLES', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '15px',
      color: '#ffd27f'
    }).setOrigin(0.5);

    this.add.text(480, 400, PLAYER_PROFILES[0].hint, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#fff7df'
    }).setOrigin(0.5);

    this.add.text(480, 424,
      `Co-op: ${PLAYER_PROFILES[1].hint} — el Nivel 3 te ofrece sumar un segundo jugador.`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#8fd6ff'
      }).setOrigin(0.5);

    this.add.text(480, 446, 'ESC o P: pausa (y desde ahí, volver al menú)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffe6b3'
    }).setOrigin(0.5);
  }

  finish() {
    markIntroSeen(this);
    getAudio(this)?.playSfx('uiSelect');
    this.scene.start(this.returnToMenu ? 'MenuScene' : this.nextScene);
  }
}
