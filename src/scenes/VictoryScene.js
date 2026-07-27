import { getRun, resetRun } from '../core/runState.js';
import { clearSavedRun, getMaxTotalStars, getTotalStars, markRunCompleted } from '../core/profile.js';
import { addButton, addPanel } from '../core/ui.js';
import { getAudio } from '../core/audio.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    const run = getRun(this);
    const audio = getAudio(this);
    audio?.stopAllFoley();
    audio?.stopMusic();
    this.cameras.main.setBackgroundColor('#191107');
    addPanel(this, 480, 270, 720, 400, 0x21160f, 0.94);

    this.add.text(480, 105, 'VICTORIA', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '44px',
      color: '#ffd27f',
      stroke: '#341304',
      strokeThickness: 6
    }).setOrigin(0.5);

    markRunCompleted(this, run.score);
    clearSavedRun();

    const skills = run.skills.length > 0 ? run.skills.join(', ') : 'Ninguna';
    const hp = run.players.map((player) => `${player.hp}/${run.hpMax}`).join(' · ');
    const stars = `${getTotalStars(this)} / ${getMaxTotalStars()}`;
    this.add.text(480, 215,
      `Derrotaste al Rey Escorpión y completaste los 10 niveles de The Monster Hunter.\n\nScore: ${run.score}\nMonedas restantes: ${run.coins}\nHP final: ${hp}\nHabilidades: ${skills}\nEstrellas totales: ${stars}`,
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
