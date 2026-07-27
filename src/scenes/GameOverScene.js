import { PLAYER_PROFILES } from '../core/config.js';
import { enableCoop, resetRun } from '../core/runState.js';
import { clearSavedRun, getMaxTotalStars, getTotalStars } from '../core/profile.js';
import { addButton, addPanel } from '../core/ui.js';
import { getAudio } from '../core/audio.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    const run = data.run || { score: 0, coins: 0, skills: [], players: [] };

    // Morir cierra la partida guardada: es un roguelike, la run no se continua.
    // Las estrellas y los niveles desbloqueados viven en el perfil y sobreviven.
    clearSavedRun();

    const audio = getAudio(this);
    audio?.stopAllFoley();
    audio?.startMusic('gameover');
    this.cameras.main.setBackgroundColor('#180806');
    addPanel(this, 480, 268, 720, 442, 0x210c08, 0.95);

    this.add.text(480, 84, 'GAME OVER', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '50px',
      color: '#ff6b5a',
      stroke: '#330000',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Cada bloque va por separado en vez de un solo texto multilinea: asi el
    // espaciado es explicito y no se descoloca al agregar o quitar una linea.
    this.add.text(480, 132, 'Perdiste las habilidades y las mejoras, y vuelves al Nivel 1.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffc9c0'
    }).setOrigin(0.5);

    this.add.text(480, 186,
      `Score final: ${run.score}\nMonedas al morir: ${run.coins}\nHabilidades obtenidas: ${run.skills?.length || 0}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#fff2cc',
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5);

    this.add.text(480, 248, `Tus estrellas siguen a salvo: ${getTotalStars(this)} / ${getMaxTotalStars()}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffd27f'
    }).setOrigin(0.5);

    this.renderRetryOptions();
  }

  /**
   * La ayuda se ofrece justo cuando hace falta: al morir. Antes esto vivia a
   * mitad del Nivel 3, que era arbitrario y ademas dejaba a un companero sin
   * nadie que lo manejara si la persona jugaba sola.
   */
  renderRetryOptions() {
    addButton(this, 480, 302, 'Reintentar solo — Nivel 1', () => this.retry(false), {
      width: 330, height: 42, fontSize: '17px'
    });

    const coop = addButton(this, 480, 356, 'Reintentar con un compañero (2 jugadores)', () => this.retry(true), {
      width: 400, height: 42, fontSize: '16px'
    });
    coop.bg.setFillStyle(0x24506b, 0.95).setStrokeStyle(2, 0x8fd6ff, 1);
    coop.text.setColor('#d8f4ff');

    this.add.text(480, 392, `Segundo jugador en el mismo teclado — ${PLAYER_PROFILES[1].hint}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#8fd6ff'
    }).setOrigin(0.5);

    addButton(this, 480, 438, 'Volver al menú', () => {
      resetRun(this);
      getAudio(this)?.playSfx('uiSelect');
      this.scene.start('MenuScene');
    }, { width: 260, height: 36, fontSize: '15px' });
  }

  retry(withCompanion) {
    resetRun(this);
    if (withCompanion) {
      // enableCoop suma el segundo jugador a la run; createPlayersFromMap crea
      // los dos sprites al arrancar el nivel, sin nada especial en la escena.
      enableCoop(this);
      getAudio(this)?.playSfx('playerJoin');
    } else {
      getAudio(this)?.playSfx('uiSelect');
    }
    this.scene.start('Level1Scene');
  }
}
