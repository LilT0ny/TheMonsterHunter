import BaseLevelScene from './BaseLevelScene.js';
import { addScore } from '../core/runState.js';

export default class Level8Scene extends BaseLevelScene {
  constructor() {
    super('Level8Scene');
    this.portalPosition = null;
  }

  create() {
    this.createLevel({
      levelNumber: 8,
      title: 'Nivel 8 — Fortaleza olvidada',
      mapKey: 'nivel8',
      tilesetName: 'desierto',
      tilesetImageKey: 'desiertoTiles',
      levelMusicMood: 'desierto',
      musicMood: 'tense'
    });

    this.portalPosition = this.findObject('portal');
    this.spawnGuardiansFromMap();
    this.spawnEnemiesFromMap(['scorpion_elite']);
    this.requiredKills = this.enemies.countActive(true);
    this.showObjective('Objetivo: los Guardianes de piedra bloquean flechas de frente. Flanqueá para dañarlos.');
  }

  checkLevelCompletion() {
    if (this.enemyKills >= this.requiredKills && !this.portal) {
      addScore(this, 130);
      this.showObjective('Fortaleza despejada. Entra al portal para elegir habilidad y visitar la tienda.');
      this.createPortal(() => this.completeLevel(() => {
        this.scene.start('AbilityScene', {
          levelCompleted: 8,
          nextScene: 'TiendaScene',
          nextLevelScene: 'Level9Scene'
        });
      }), this.portalPosition);
    }
  }
}
