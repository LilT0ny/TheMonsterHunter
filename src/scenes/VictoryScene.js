import { getRun, resetRun } from '../core/runState.js';
import { addButton, addPanel } from '../core/ui.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    const run = getRun(this);
    this.cameras.main.setBackgroundColor('#191107');
    addPanel(this, 480, 270, 720, 400, 0x21160f, 0.94);

    this.add.text(480, 105, 'VICTORIA DEL MVP', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px',
      color: '#ffd27f',
      stroke: '#341304',
      strokeThickness: 6
    }).setOrigin(0.5);

    const skills = run.skills.length > 0 ? run.skills.join(', ') : 'Ninguna';
    this.add.text(480, 215,
      `Completaste los 2 niveles implementados.\n\nScore: ${run.score}\nMonedas restantes: ${run.coins}\nHP final: ${run.hp}/${run.hpMax}\nHabilidades: ${skills}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#fff2cc',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 600 }
      }).setOrigin(0.5);

    addButton(this, 480, 370, 'Nueva run', () => {
      resetRun(this);
      this.scene.start('Level1Scene');
    }, { width: 250 });

    addButton(this, 480, 430, 'Menú', () => {
      resetRun(this);
      this.scene.start('MenuScene');
    }, { width: 250 });
  }
}
