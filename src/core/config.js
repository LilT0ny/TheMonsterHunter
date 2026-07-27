export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const ABILITIES = [
  {
    id: 'double',
    name: 'Flecha doble',
    description: 'Dispara 2 flechas simultáneas con separación angular.'
  },
  {
    id: 'fire',
    name: 'Flecha de fuego',
    description: 'Aplica quemadura: daño continuo por 3 segundos.'
  },
  {
    id: 'ice',
    name: 'Flecha de hielo',
    description: 'Ralentiza al enemigo un 50% durante 2 segundos.'
  },
  {
    id: 'piercing',
    name: 'Flecha perforante',
    description: 'Atraviesa hasta 3 enemigos en línea recta.'
  },
  {
    id: 'rain',
    name: 'Lluvia de flechas',
    description: 'Dispara 5 flechas en abanico.'
  },
  {
    id: 'explosive',
    name: 'Flecha explosiva',
    description: 'Hace daño en radio de 64 px al impactar.'
  },
  {
    id: 'rapid',
    name: 'Disparo rápido',
    description: '+50% de velocidad de disparo durante la partida.'
  },
  {
    id: 'boomerang',
    name: 'Flecha bumerán',
    description: 'La flecha regresa y golpea enemigos en ambos sentidos.'
  },
  {
    id: 'electric',
    name: 'Flecha eléctrica',
    description: 'Encadena daño a 2 enemigos cercanos al impactar.'
  },
  {
    id: 'homing',
    name: 'Flecha teleguiada',
    description: 'Corrige su trayectoria hacia el enemigo más cercano.'
  }
];

export const UPGRADES = [
  {
    id: 'health',
    name: 'Salud máxima',
    cost: 20,
    description: '+20 HP máximo por nivel.'
  },
  {
    id: 'luck',
    name: 'Suerte',
    cost: 15,
    description: '+15% de monedas por nivel.'
  },
  {
    id: 'armor',
    name: 'Armadura',
    cost: 25,
    description: 'Reduce 5% del daño recibido por nivel.'
  },
  {
    id: 'speed',
    name: 'Velocidad',
    cost: 18,
    description: '+10% de velocidad por nivel.'
  },
  {
    id: 'damage',
    name: 'Daño base',
    cost: 30,
    description: '+5 de daño por nivel.'
  }
];

export const ENEMY_SCORE = {
  spider: 10,
  scorpion: 18,
  scorpion_elite: 40,
  mummy: 22,
  serpent: 26,
  mummy_giant: 45,
  slime_green: 14,
  boss_golem: 200,
  golem_fragment: 60,
  sand_spirit: 35,
  guardian: 55,
  boss_king_scorpion: 300
};

// Orden canonico de la campana. Lo consumen el menu, el perfil persistido y la
// pantalla de estrellas, para que exista una sola fuente de verdad del recorrido.
export const LEVEL_SEQUENCE = [
  { level: 1, sceneKey: 'Level1Scene', label: 'Nivel 1' },
  { level: 2, sceneKey: 'Level2Scene', label: 'Nivel 2' },
  { level: 3, sceneKey: 'Level3Scene', label: 'Nivel 3' },
  { level: 4, sceneKey: 'Level4Scene', label: 'Nivel 4' },
  { level: 5, sceneKey: 'Boss5Scene', label: 'Boss 5' },
  { level: 6, sceneKey: 'Level6Scene', label: 'Nivel 6' },
  { level: 7, sceneKey: 'Level7Scene', label: 'Nivel 7' },
  { level: 8, sceneKey: 'Level8Scene', label: 'Nivel 8' },
  { level: 9, sceneKey: 'Level9Scene', label: 'Nivel 9' },
  { level: 10, sceneKey: 'Boss10Scene', label: 'Boss 10' }
];

export const TOTAL_LEVELS = LEVEL_SEQUENCE.length;
export const STARS_PER_LEVEL = 3;

export function sceneKeyForLevel(level) {
  return LEVEL_SEQUENCE.find((entry) => entry.level === level)?.sceneKey || 'Level1Scene';
}

export function labelForLevel(level) {
  return LEVEL_SEQUENCE.find((entry) => entry.level === level)?.label || `Nivel ${level}`;
}

// Criterios de las 3 estrellas. Se evaluan al completar el nivel.
export const STAR_GOALS = [
  { id: 'clear', label: 'Completar el nivel' },
  { id: 'health', label: 'Terminar con más del 50% de vida' },
  { id: 'full', label: 'Eliminar a todos los enemigos' }
];

// Un perfil por jugador. El indice es la posicion dentro de run.players.
// J1 conserva los controles historicos; J2 usa el bloque de flechas para que
// las dos personas entren comodas en el mismo teclado.
export const PLAYER_PROFILES = [
  {
    index: 0,
    label: 'J1',
    texture: 'archer',
    accent: 0xffd27f,
    keys: { up: 'W', down: 'S', left: 'A', right: 'D', shoot: 'SPACE', dash: 'SHIFT' },
    usesPointer: true,
    hint: 'J1: WASD · Click/ESPACIO disparar · SHIFT dash'
  },
  {
    index: 1,
    label: 'J2',
    texture: 'archer2',
    accent: 0x8fd6ff,
    keys: { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', shoot: 'ENTER', dash: 'CTRL' },
    usesPointer: false,
    hint: 'J2: Flechas · ENTER disparar · CTRL dash'
  }
];

export const MAX_PLAYERS = PLAYER_PROFILES.length;

// Reanimacion cooperativa: un jugador caido vuelve si su companero se queda
// cerca el tiempo suficiente. Sin esto, el co-op se corta al primer error.
export const REVIVE_RADIUS = 62;
export const REVIVE_DURATION = 2400;
export const REVIVE_HP_RATIO = 0.5;

// Corazon de emergencia: aparece cada vez que un jugador cruza el 50% de vida.
export const HEART_HEAL_RATIO = 0.3;
