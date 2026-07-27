import { resetRun } from '../core/runState.js';
import { clearSavedRun, getMaxTotalStars, getTotalStars } from '../core/profile.js';
import { addButton, addPanel } from '../core/ui.js';
import { getAudio } from '../core/audio.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    const run = data.run || { score: 0, coins: 0, skills: [] };

    // Morir cierra la partida guardada: es un roguelike, la run no se continua.
    // Las estrellas y los niveles desbloqueados viven en el perfil y sobreviven.
    clearSavedRun();

    const audio = getAudio(this);
    audio?.stopAllFoley();
    audio?.startMusic('gameover');
    this.cameras.main.setBackgroundColor('#180806');
    // El panel y las posiciones estan calculadas para un bloque de 7 lineas:
    // el titulo termina en ~135 y el texto arranca en ~146.
    addPanel(this, 480, 272, 700, 430, 0x210c08, 0.95);

    this.add.text(480, 104, 'GAME OVER', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '54px',
      color: '#ff6b5a',
      stroke: '#330000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(480, 244,
      `Perdiste las habilidades y las mejoras, y vuelves al Nivel 1.\n\nScore final: ${run.score}\nMonedas al morir: ${run.coins}\nHabilidades obtenidas: ${run.skills?.length || 0}\n\nTus estrellas siguen a salvo: ${getTotalStars(this)} / ${getMaxTotalStars()}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#fff2cc',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5);

    addButton(this, 480, 390, 'Reintentar desde Nivel 1', () => {
      resetRun(this);
      this.scene.start('Level1Scene');
    }, { width: 300, height: 44 });

    addButton(this, 480, 446, 'Volver al menú', () => {
      resetRun(this);
      this.scene.start('MenuScene');
    }, { width: 300, height: 44 });
  }
}
