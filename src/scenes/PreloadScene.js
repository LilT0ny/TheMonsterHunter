import AudioManager from '../core/audio.js';

// Paletas del arquero. Cada jugador usa la suya, pero el dibujo es el mismo:
// una sola funcion genera los dos, asi no hay dos artes que mantener.
const ARCHER_PALETTES = {
  archer: {
    cloak: 0x7a4a22,
    dark: 0x4f2d13,
    light: 0xa06a35,
    scarf: 0xe8b968,
    boot: 0x2b1a11,
    quiver: 0x4a2d14,
    fletch: 0xe8563f,
    eye: 0xffe9a8
  },
  archer2: {
    cloak: 0x2b5c7a,
    dark: 0x173b52,
    light: 0x3f83a8,
    scarf: 0x8fd6ff,
    boot: 0x101f2b,
    quiver: 0x1d3a4a,
    fletch: 0x9fe8ff,
    eye: 0xd8f4ff
  }
};

// Fotograma 0 = quieto. Del 1 al 4, ciclo de caminata: las piernas alternan y
// el cuerpo sube un pixel en los pasos, que es lo que vende el movimiento.
const ARCHER_FRAMES = [
  { leg: 0, bob: 0 },
  { leg: -3, bob: -1 },
  { leg: 0, bob: 0 },
  { leg: 3, bob: -1 },
  { leg: 0, bob: 0 }
];

const ARCHER_FRAME_SIZE = 32;

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.tilemapTiledJSON('nivel1', 'assets/tilemaps/nivel1.json');
    this.load.tilemapTiledJSON('nivel2', 'assets/tilemaps/nivel2.json');
    this.load.tilemapTiledJSON('nivel3', 'assets/tilemaps/nivel3.json');
    this.load.tilemapTiledJSON('nivel4', 'assets/tilemaps/nivel4.json');
    this.load.tilemapTiledJSON('nivel5', 'assets/tilemaps/nivel5.json');
    this.load.tilemapTiledJSON('nivel6', 'assets/tilemaps/nivel6.json');
    this.load.tilemapTiledJSON('nivel7', 'assets/tilemaps/nivel7.json');
    this.load.tilemapTiledJSON('nivel8', 'assets/tilemaps/nivel8.json');
    this.load.tilemapTiledJSON('nivel9', 'assets/tilemaps/nivel9.json');
    this.load.tilemapTiledJSON('nivel10', 'assets/tilemaps/nivel10.json');
    this.load.image('desiertoTiles', 'assets/tilesets/desierto.png');
    this.load.image('catacumbasTiles', 'assets/tilesets/catacumbas.png');

    const loading = this.add.text(480, 270, 'Cargando The Monster Hunter...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffe6a7'
    }).setOrigin(0.5);

    this.load.on('complete', () => loading.destroy());
  }

  create() {
    this.createRuntimeTextures();
    this.createAnimations();
    if (!this.registry.get('audio')) {
      this.registry.set('audio', new AudioManager());
    }
    this.scene.start('MenuScene');
  }

  createAnimations() {
    Object.keys(ARCHER_PALETTES).forEach((key) => {
      if (!this.anims.exists(`${key}-idle`)) {
        this.anims.create({
          key: `${key}-idle`,
          frames: [{ key, frame: 0 }],
          frameRate: 1,
          repeat: -1
        });
      }

      if (!this.anims.exists(`${key}-walk`)) {
        this.anims.create({
          key: `${key}-walk`,
          frames: [1, 2, 3, 4].map((frame) => ({ key, frame })),
          frameRate: 11,
          repeat: -1
        });
      }
    });
  }

  createRuntimeTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const makeRect = (key, width, height, fill, stroke = null) => {
      g.clear();
      g.fillStyle(fill, 1);
      g.fillRect(0, 0, width, height);
      if (stroke !== null) {
        g.lineStyle(2, stroke, 1);
        g.strokeRect(1, 1, width - 2, height - 2);
      }
      g.generateTexture(key, width, height);
    };

    this.createArcherSheets(g);
    this.createWeaponTextures(g);
    this.createEnemyTextures(g);
    this.createProjectileTextures(g);
    this.createEffectTextures(g);
    this.createWorldTextures(g, makeRect);
  }

  // --- Arquero animado ---------------------------------------------------

  createArcherSheets(g) {
    Object.entries(ARCHER_PALETTES).forEach(([key, palette]) => {
      g.clear();
      ARCHER_FRAMES.forEach((frame, index) => {
        this.drawArcherFrame(g, index * ARCHER_FRAME_SIZE, palette, frame.leg, frame.bob);
      });
      g.generateTexture(key, ARCHER_FRAME_SIZE * ARCHER_FRAMES.length, ARCHER_FRAME_SIZE);

      // generateTexture deja un unico frame '__BASE' con la hoja entera. Hay que
      // recortar los fotogramas a mano para poder animarlos.
      const texture = this.textures.get(key);
      ARCHER_FRAMES.forEach((_, index) => {
        texture.add(index, 0, index * ARCHER_FRAME_SIZE, 0, ARCHER_FRAME_SIZE, ARCHER_FRAME_SIZE);
      });
    });
  }

  drawArcherFrame(g, ox, palette, leg, bob) {
    const y = bob;

    // Sombra en el suelo: ancla la figura y no se mueve con el rebote.
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(ox + 16, 30, 17, 5);

    // Piernas alternando.
    g.fillStyle(palette.boot, 1);
    g.fillRect(ox + 10, 24 + y + leg, 5, 7);
    g.fillRect(ox + 17, 24 + y - leg, 5, 7);

    // Carcaj y flechas asomando por el hombro.
    g.fillStyle(palette.quiver, 1);
    g.fillRect(ox + 22, 11 + y, 5, 11);
    g.fillStyle(palette.fletch, 1);
    g.fillRect(ox + 23, 7 + y, 1, 5);
    g.fillRect(ox + 25, 6 + y, 1, 6);

    // Cuerpo y capucha.
    g.fillStyle(palette.cloak, 1);
    g.fillRect(ox + 8, 8 + y, 16, 18);
    g.fillTriangle(ox + 7, 9 + y, ox + 25, 9 + y, ox + 16, 1 + y);

    // Volumen: luz a la izquierda, sombra a la derecha.
    g.fillStyle(palette.light, 1);
    g.fillRect(ox + 8, 8 + y, 3, 18);
    g.fillStyle(palette.dark, 1);
    g.fillRect(ox + 20, 8 + y, 4, 18);
    g.fillTriangle(ox + 16, 1 + y, ox + 25, 9 + y, ox + 20, 9 + y);

    // Cara en sombra bajo la capucha, con los ojos brillando.
    g.fillStyle(0x120a06, 1);
    g.fillRect(ox + 11, 7 + y, 10, 6);
    g.fillStyle(palette.eye, 1);
    g.fillRect(ox + 12, 9 + y, 2, 2);
    g.fillRect(ox + 18, 9 + y, 2, 2);

    // Bufanda con la punta al viento.
    g.fillStyle(palette.scarf, 1);
    g.fillRect(ox + 8, 13 + y, 16, 4);
    g.fillRect(ox + 5, 15 + y, 4, 3);
    g.fillRect(ox + 3, 17 + y, 3, 2);

    // Cinturon.
    g.fillStyle(0x241609, 1);
    g.fillRect(ox + 8, 21 + y, 16, 3);
    g.fillStyle(palette.scarf, 1);
    g.fillRect(ox + 14, 21 + y, 4, 3);
  }

  // --- Arco, fogonazo y flechas -----------------------------------------

  createWeaponTextures(g) {
    // Arco suelto: rotacion 0 apunta a la derecha, la curva mira al objetivo y
    // la cuerda queda del lado del jugador.
    const makeBow = (key, wood, woodDark, string) => {
      g.clear();
      g.lineStyle(4, woodDark, 1);
      g.beginPath();
      g.arc(6, 13, 11, Phaser.Math.DegToRad(-75), Phaser.Math.DegToRad(75), false);
      g.strokePath();
      g.lineStyle(2, wood, 1);
      g.beginPath();
      g.arc(6, 13, 11, Phaser.Math.DegToRad(-70), Phaser.Math.DegToRad(20), false);
      g.strokePath();
      g.lineStyle(1, string, 1);
      g.lineBetween(8.8, 2.4, 8.8, 23.6);
      g.fillStyle(string, 1);
      g.fillCircle(17, 13, 1.8);
      g.fillCircle(8.8, 13, 1.4);
      g.generateTexture(key, 24, 26);
    };

    makeBow('bow', 0x8a5a2a, 0x4a2f14, 0xffd26f);
    makeBow('bow2', 0x4a7a96, 0x1f3d4f, 0xbfe9ff);

    // Fogonazo del disparo, en la punta del arco.
    g.clear();
    g.fillStyle(0xfff6d0, 0.95);
    g.fillTriangle(0, 11, 16, 6, 16, 16);
    g.fillStyle(0xffd452, 0.85);
    g.fillCircle(6, 11, 6);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(4, 11, 3);
    g.generateTexture('muzzleFlash', 22, 22);

    // Una flecha por elemento. Mismo dibujo, distinta paleta: asi el jugador ve
    // de un vistazo con que esta disparando.
    const makeArrow = (key, { shaft, headEdge, headCore, fletch, aura }) => {
      g.clear();
      if (aura !== undefined) {
        // Resplandor SOLO en la punta. Un aura sobre todo el cuerpo tapaba el
        // astil y las flechas elementales dejaban de parecer flechas.
        g.fillStyle(aura, 0.32);
        g.fillCircle(26, 5.5, 6.5);
      }
      g.fillStyle(shaft, 1);
      g.fillRect(5, 4, 18, 3);
      g.fillStyle(0x000000, 0.25);
      g.fillRect(5, 6, 18, 1);
      g.fillStyle(headEdge, 1);
      g.fillTriangle(21, 0, 30, 5.5, 21, 11);
      g.fillStyle(headCore, 1);
      g.fillTriangle(22, 2, 27, 5.5, 22, 9);
      g.fillStyle(fletch, 1);
      g.fillTriangle(0, 0, 8, 4, 0, 5);
      g.fillTriangle(0, 11, 8, 7, 0, 6);
      g.generateTexture(key, 30, 11);
    };

    makeArrow('arrow', { shaft: 0x8a6a3a, headEdge: 0xfff0b8, headCore: 0xffd452, fletch: 0xe8563f });
    makeArrow('arrowFire', { shaft: 0x6b3a1a, headEdge: 0xffd76b, headCore: 0xff5a1f, fletch: 0xffa347, aura: 0xff7a2a });
    makeArrow('arrowIce', { shaft: 0x2f5a70, headEdge: 0xeafcff, headCore: 0x6fd8ff, fletch: 0xbfe9ff, aura: 0x6fd8ff });
    makeArrow('arrowElectric', { shaft: 0x3a3a6b, headEdge: 0xffffff, headCore: 0x9fd8ff, fletch: 0xd8b6ff, aura: 0x8fb6ff });

    // Estela de la flecha. Se tinta en tiempo real segun el elemento activo.
    g.clear();
    g.fillStyle(0xffffff, 0.45);
    g.fillCircle(5, 5, 5);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(5, 5, 2.4);
    g.generateTexture('arrowTrail', 10, 10);
  }

  // --- Enemigos ----------------------------------------------------------

  createEnemyTextures(g) {
    const shadow = (cx, cy, w, h) => {
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(cx, cy, w, h);
    };

    // Arana de arena: abdomen con brillo, patas articuladas y cuatro ojos.
    g.clear();
    shadow(14, 19, 20, 5);
    g.lineStyle(2, 0x8a5a28, 1);
    [-2.5, -2.0, -1.25, -0.7, 0.7, 1.25, 2.0, 2.5].forEach((angle) => {
      const kneeX = 14 + Math.cos(angle) * 8;
      const kneeY = 11 + Math.sin(angle) * 5;
      g.lineBetween(14, 11, kneeX, kneeY);
      g.lineBetween(kneeX, kneeY, 14 + Math.cos(angle) * 13, 11 + Math.sin(angle) * 9 + 2);
    });
    g.fillStyle(0x1d120a, 1);
    g.fillEllipse(14, 13, 17, 12);
    g.fillStyle(0x35210f, 1);
    g.fillEllipse(13, 11, 12, 7);
    g.fillStyle(0x5a3a18, 0.8);
    g.fillEllipse(11, 10, 6, 3);
    g.fillStyle(0x241608, 1);
    g.fillEllipse(14, 5, 10, 7);
    g.fillStyle(0xff4d4d, 1);
    g.fillCircle(11, 4, 1.3);
    g.fillCircle(17, 4, 1.3);
    g.fillStyle(0xff8f6f, 1);
    g.fillCircle(13, 2.5, 0.9);
    g.fillCircle(15, 2.5, 0.9);
    g.fillStyle(0xd9c48f, 1);
    g.fillTriangle(11, 7, 13, 7, 12, 10);
    g.fillTriangle(16, 7, 18, 7, 17, 10);
    g.generateTexture('spider', 28, 22);

    // Escorpion centinela: cola segmentada, carapacho con placas y pinzas.
    g.clear();
    shadow(16, 21, 24, 5);
    g.fillStyle(0x4a2a12, 1);
    [[24, 13, 4.2], [28, 10, 3.8], [31, 6.5, 3.2], [33, 3.5, 2.6]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.fillStyle(0x6b3f1d, 1);
    [[24, 12, 2.4], [28, 9, 2.1], [31, 5.8, 1.7]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.fillStyle(0xffb347, 1);
    g.fillTriangle(33, 1, 36, 4, 31, 4);
    g.lineStyle(2, 0x3a2010, 1);
    [[9, 17], [13, 18], [17, 18]].forEach(([x, y]) => {
      g.lineBetween(x, 14, x - 2, y);
      g.lineBetween(x + 1, 14, x + 3, y);
    });
    g.fillStyle(0x4a2a12, 1);
    g.fillEllipse(15, 12, 22, 13);
    g.fillStyle(0x6b3f1d, 1);
    g.fillEllipse(14, 11, 18, 9);
    g.fillStyle(0x8a5528, 0.75);
    g.fillEllipse(12, 9, 10, 4);
    g.lineStyle(1, 0x2f1a0a, 1);
    g.lineBetween(11, 6, 11, 17);
    g.lineBetween(16, 6, 16, 17);
    g.fillStyle(0x6b3f1d, 1);
    g.fillTriangle(1, 6, 8, 4, 7, 11);
    g.fillTriangle(1, 19, 8, 21, 7, 14);
    g.fillStyle(0xffb347, 1);
    g.fillTriangle(0, 5, 5, 4, 4, 8);
    g.fillTriangle(0, 20, 5, 21, 4, 17);
    g.fillStyle(0xffe6b3, 1);
    g.fillCircle(10, 9, 1.3);
    g.fillCircle(10, 14, 1.3);
    g.generateTexture('scorpion', 38, 24);

    // Momia errante: vendas con relieve, tiras sueltas y ojos encendidos.
    g.clear();
    shadow(15, 33, 20, 5);
    g.fillStyle(0xbfae80, 1);
    g.fillRect(5, 4, 20, 28);
    g.fillStyle(0xe2d4a8, 1);
    g.fillRect(5, 4, 13, 28);
    g.fillStyle(0xf2e8c4, 1);
    g.fillRect(5, 4, 5, 28);
    g.fillStyle(0xc9b98a, 1);
    g.fillRect(3, 2, 24, 9);
    g.fillStyle(0xe2d4a8, 1);
    g.fillRect(3, 2, 13, 9);
    g.lineStyle(2, 0x7d6440, 1);
    g.lineBetween(5, 12, 25, 16);
    g.lineBetween(25, 12, 5, 16);
    g.lineBetween(5, 20, 25, 24);
    g.lineBetween(25, 20, 5, 24);
    g.lineBetween(5, 28, 25, 31);
    g.fillStyle(0x2a2114, 1);
    g.fillRect(8, 6, 14, 5);
    g.fillStyle(0xff5d2a, 1);
    g.fillCircle(11, 8.5, 1.7);
    g.fillCircle(19, 8.5, 1.7);
    g.fillStyle(0xffb98f, 1);
    g.fillCircle(11, 8, 0.7);
    g.fillCircle(19, 8, 0.7);
    g.fillStyle(0xd8c79a, 1);
    g.fillTriangle(6, 32, 11, 32, 8, 36);
    g.fillTriangle(17, 32, 23, 32, 20, 35);
    g.fillTriangle(0, 14, 5, 13, 3, 19);
    g.generateTexture('mummy', 30, 36);

    // Serpiente voladora: cuerpo escamado en curva, alas con membrana y lengua.
    g.clear();
    g.fillStyle(0x3a5f30, 1);
    [[10, 11, 11, 10], [18, 7, 11, 9], [26, 13, 11, 9], [33, 10, 8, 7]].forEach(([x, y, w, h]) => g.fillEllipse(x, y, w, h));
    g.fillStyle(0x4c7a3f, 1);
    [[10, 10, 9, 7], [18, 6, 9, 6], [26, 12, 9, 6], [33, 9, 6, 5]].forEach(([x, y, w, h]) => g.fillEllipse(x, y, w, h));
    g.fillStyle(0xb6e39d, 1);
    g.fillEllipse(10, 13, 7, 4);
    g.fillEllipse(26, 15, 6, 3);
    g.fillStyle(0x86bd6c, 0.9);
    [[13, 8], [21, 5], [29, 11]].forEach(([x, y]) => {
      g.fillTriangle(x - 2, y, x + 2, y, x, y - 3);
    });
    g.fillStyle(0xdff5cf, 0.7);
    g.fillTriangle(14, 4, 22, 0, 20, 8);
    g.fillTriangle(14, 17, 22, 21, 20, 13);
    g.lineStyle(1, 0x86bd6c, 0.9);
    g.lineBetween(15, 4, 21, 1);
    g.lineBetween(15, 17, 21, 20);
    g.fillStyle(0x3a5f30, 1);
    g.fillCircle(6, 10, 4.6);
    g.fillStyle(0x4c7a3f, 1);
    g.fillCircle(6, 9, 3.4);
    g.lineStyle(1, 0xff5d2a, 1);
    g.lineBetween(2, 10, 0, 8);
    g.lineBetween(2, 10, 0, 12);
    g.fillStyle(0xffe14d, 1);
    g.fillCircle(5, 8, 1.4);
    g.fillStyle(0x14200f, 1);
    g.fillCircle(5, 8, 0.7);
    g.generateTexture('serpent', 38, 22);

    // Coloso de piedra: bloques biselados, grietas encendidas y musgo.
    g.clear();
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(32, 61, 46, 6);
    g.fillStyle(0x54544e, 1);
    g.fillRect(6, 6, 52, 50);
    g.fillStyle(0x6f6f68, 1);
    g.fillRect(6, 6, 46, 44);
    g.fillStyle(0x84847a, 1);
    g.fillRect(6, 6, 40, 6);
    g.fillRect(6, 6, 6, 40);
    g.fillStyle(0x45453f, 1);
    g.fillRect(0, 18, 12, 22);
    g.fillRect(52, 18, 12, 22);
    g.fillStyle(0x5d5d56, 1);
    g.fillRect(0, 18, 12, 5);
    g.fillRect(52, 18, 12, 5);
    g.fillStyle(0x3b3b36, 1);
    g.fillRect(4, 44, 20, 18);
    g.fillRect(40, 44, 20, 18);
    g.lineStyle(2, 0x2b2b28, 1);
    g.lineBetween(6, 22, 58, 22);
    g.lineBetween(6, 38, 58, 38);
    g.lineBetween(24, 6, 20, 56);
    g.lineBetween(44, 6, 48, 56);
    g.strokeRect(1, 1, 62, 62);
    g.lineStyle(2, 0xff8a2a, 0.85);
    g.lineBetween(16, 30, 24, 34);
    g.lineBetween(24, 34, 20, 42);
    g.lineBetween(44, 28, 38, 34);
    g.lineBetween(38, 34, 43, 41);
    g.fillStyle(0x4f6b32, 1);
    g.fillCircle(12, 14, 3);
    g.fillCircle(50, 47, 3.4);
    g.fillCircle(46, 12, 2.4);
    g.fillStyle(0xffb347, 1);
    g.fillCircle(22, 19, 3.4);
    g.fillCircle(42, 19, 3.4);
    g.fillStyle(0xfff0b8, 1);
    g.fillCircle(22, 18, 1.5);
    g.fillCircle(42, 18, 1.5);
    g.generateTexture('golem', 64, 64);

    // Espiritu de arena: silueta translucida por capas y base ondulada.
    g.clear();
    g.fillStyle(0x9fdcf5, 0.28);
    g.fillCircle(11, 10, 10);
    g.fillStyle(0xbfefff, 0.62);
    g.fillCircle(11, 9, 7.5);
    g.fillPoints([
      { x: 3, y: 9 }, { x: 3, y: 17 }, { x: 6, y: 14 }, { x: 9, y: 19 },
      { x: 12, y: 14 }, { x: 15, y: 19 }, { x: 18, y: 14 }, { x: 19, y: 9 }
    ], true);
    g.fillStyle(0xeafcff, 0.55);
    g.fillEllipse(9, 7, 6, 4);
    g.fillStyle(0x3f7d92, 0.75);
    g.fillCircle(8, 8, 1.5);
    g.fillCircle(14, 8, 1.5);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(7.6, 7.6, 0.6);
    g.fillCircle(13.6, 7.6, 0.6);
    g.generateTexture('spirit', 22, 22);

    // Guardian: armadura remachada, visor encendido y franja dorada del escudo
    // (rotacion 0 = derecha, por convencion de Phaser).
    g.clear();
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(20, 48, 32, 5);
    g.fillStyle(0x4a423a, 1);
    g.fillRect(0, 0, 40, 50);
    g.fillStyle(0x5f564b, 1);
    g.fillRect(0, 0, 30, 50);
    g.fillStyle(0x736858, 1);
    g.fillRect(0, 0, 30, 5);
    g.lineStyle(2, 0x261f19, 1);
    g.strokeRect(1, 1, 38, 48);
    g.fillStyle(0x372f28, 1);
    g.fillRect(5, 5, 26, 9);
    g.fillRect(3, 30, 30, 6);
    g.fillStyle(0xff8a4d, 1);
    g.fillRect(9, 8, 18, 3);
    g.fillStyle(0x8d8172, 1);
    [[6, 20], [6, 26], [26, 20], [26, 26], [6, 42], [26, 42]].forEach(([x, y]) => g.fillCircle(x, y, 1.8));
    g.fillStyle(0xc9a227, 1);
    g.fillRect(31, 0, 9, 50);
    g.fillStyle(0xf0d264, 1);
    g.fillRect(31, 0, 4, 50);
    g.lineStyle(2, 0x7d6316, 1);
    g.strokeRect(31, 0, 9, 50);
    g.fillStyle(0x7d6316, 1);
    [8, 20, 32, 44].forEach((y) => g.fillCircle(35, y, 2));
    g.generateTexture('guardian', 40, 50);

    // Rey Escorpion: version coronada, con placas y pinzas enormes.
    g.clear();
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(28, 41, 40, 6);
    g.fillStyle(0x3a0a0a, 1);
    [[38, 22, 7], [45, 17, 6.2], [50, 11, 5.2], [53, 6, 4.2]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.fillStyle(0x6b1414, 1);
    [[38, 20, 4], [45, 15, 3.4], [50, 9.5, 2.8]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.fillStyle(0xffb347, 1);
    g.fillTriangle(53, 1, 58, 6, 49, 8);
    g.fillStyle(0xfff0b8, 1);
    g.fillTriangle(54, 3, 56.5, 6, 52, 6.6);
    g.lineStyle(3, 0x3a0a0a, 1);
    [[14, 33], [20, 35], [26, 35]].forEach(([x, y]) => {
      g.lineBetween(x, 28, x - 3, y);
      g.lineBetween(x + 2, 28, x + 5, y);
    });
    g.fillStyle(0x3a0a0a, 1);
    g.fillEllipse(25, 24, 38, 23);
    g.fillStyle(0x6b1414, 1);
    g.fillEllipse(24, 22, 32, 18);
    g.fillStyle(0x8f2020, 0.85);
    g.fillEllipse(20, 18, 16, 7);
    g.lineStyle(1.5, 0x2b0505, 1);
    g.lineBetween(17, 12, 17, 33);
    g.lineBetween(25, 11, 25, 34);
    g.lineBetween(33, 13, 33, 32);
    g.fillStyle(0xffb347, 1);
    [10, 18, 26, 34].forEach((x) => g.fillTriangle(x - 3.5, 12, x + 3.5, 12, x, 2));
    g.fillStyle(0xfff0b8, 1);
    [10, 18, 26, 34].forEach((x) => g.fillTriangle(x - 1.5, 11, x + 1.5, 11, x, 5));
    g.fillStyle(0x6b1414, 1);
    g.fillTriangle(0, 15, 12, 8, 11, 20);
    g.fillTriangle(0, 34, 12, 40, 11, 28);
    g.fillStyle(0x3a0a0a, 1);
    g.fillTriangle(0, 14, 6, 10, 6, 17);
    g.fillTriangle(0, 35, 6, 39, 6, 32);
    g.fillStyle(0xffe14d, 1);
    g.fillCircle(16, 19, 2.2);
    g.fillCircle(16, 28, 2.2);
    g.fillStyle(0xfffbe6, 1);
    g.fillCircle(15.4, 18.4, 0.9);
    g.fillCircle(15.4, 27.4, 0.9);
    g.generateTexture('kingScorpion', 60, 44);

    // Limo verde: gelatina con brillo, burbujas internas y base aplastada.
    g.clear();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(14, 25, 22, 4);
    g.fillStyle(0x2a6b30, 1);
    g.fillEllipse(14, 15, 26, 21);
    g.fillStyle(0x3f9c46, 1);
    g.fillEllipse(14, 14, 23, 18);
    g.fillStyle(0x63c46a, 0.9);
    g.fillEllipse(12, 11, 15, 10);
    g.fillStyle(0xa8e6a0, 0.55);
    g.fillEllipse(9, 8, 7, 4);
    g.fillStyle(0x2a6b30, 0.55);
    g.fillCircle(19, 17, 2.4);
    g.fillCircle(9, 19, 1.8);
    g.fillCircle(16, 20, 1.4);
    g.fillStyle(0xf4fff2, 1);
    g.fillCircle(10, 13, 3);
    g.fillCircle(18, 13, 3);
    g.fillStyle(0x14330f, 1);
    g.fillCircle(10.5, 13.5, 1.4);
    g.fillCircle(18.5, 13.5, 1.4);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(9.2, 12.2, 0.8);
    g.fillCircle(17.2, 12.2, 0.8);
    g.generateTexture('slime', 28, 28);
  }

  // --- Proyectiles enemigos ---------------------------------------------

  createProjectileTextures(g) {
    // Descarga de energia: nucleo claro, cuerpo naranja y borde ardiendo.
    g.clear();
    g.fillStyle(0x7d1f10, 0.5);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xc24b37, 1);
    g.fillCircle(8, 8, 6);
    g.fillStyle(0xff8a4d, 1);
    g.fillCircle(8, 7.4, 4);
    g.fillStyle(0xffe0b8, 1);
    g.fillCircle(7.4, 6.8, 2);
    g.fillStyle(0xff8a4d, 0.85);
    [0, 1.57, 3.14, 4.71].forEach((a) => {
      g.fillTriangle(
        8 + Math.cos(a) * 5, 8 + Math.sin(a) * 5,
        8 + Math.cos(a + 0.4) * 6.5, 8 + Math.sin(a + 0.4) * 6.5,
        8 + Math.cos(a - 0.4) * 6.5, 8 + Math.sin(a - 0.4) * 6.5
      );
    });
    g.generateTexture('enemyBolt', 16, 16);

    // Escupitajo de veneno: gota con brillo y goteo.
    g.clear();
    g.fillStyle(0x2f6b28, 0.5);
    g.fillCircle(8, 8, 7.5);
    g.fillStyle(0x4c9c3f, 1);
    g.fillCircle(8, 8.5, 6);
    g.fillStyle(0x67bf5b, 1);
    g.fillCircle(8, 8, 4.6);
    g.fillTriangle(5.5, 5, 10.5, 5, 8, 0.5);
    g.fillStyle(0xa8e69a, 0.9);
    g.fillEllipse(6.4, 6.4, 4, 2.6);
    g.fillStyle(0xcaffe1, 1);
    g.fillCircle(5.8, 6, 1.2);
    g.generateTexture('venom', 16, 16);
  }

  // --- Efectos elementales ----------------------------------------------

  createEffectTextures(g) {
    // Llama para la quemadura: gota invertida con nucleo claro.
    g.clear();
    g.fillStyle(0xff4d1a, 0.9);
    g.fillCircle(7, 12, 6);
    g.fillTriangle(1, 11, 13, 11, 7, 0);
    g.fillStyle(0xff9a2a, 1);
    g.fillCircle(7, 12.5, 4);
    g.fillTriangle(3.4, 12, 10.6, 12, 7, 3.5);
    g.fillStyle(0xffe066, 1);
    g.fillCircle(7, 13, 2.2);
    g.fillTriangle(5.2, 13, 8.8, 13, 7, 7);
    g.fillStyle(0xfff6d0, 0.95);
    g.fillCircle(7, 13.4, 1);
    g.generateTexture('flame', 14, 18);

    // Cristal de hielo para el ralentizado.
    g.clear();
    g.lineStyle(3, 0x6fd8ff, 0.9);
    [0, 1.047, 2.094].forEach((a) => {
      g.lineBetween(9 - Math.cos(a) * 8, 9 - Math.sin(a) * 8, 9 + Math.cos(a) * 8, 9 + Math.sin(a) * 8);
    });
    g.lineStyle(2, 0xeafcff, 1);
    [0, 1.047, 2.094].forEach((a) => {
      g.lineBetween(9 - Math.cos(a) * 5, 9 - Math.sin(a) * 5, 9 + Math.cos(a) * 5, 9 + Math.sin(a) * 5);
    });
    g.fillStyle(0xeafcff, 1);
    g.fillCircle(9, 9, 2.4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8.4, 8.4, 1);
    g.generateTexture('frost', 18, 18);

    // Chispa electrica: estrella de cuatro puntas.
    g.clear();
    g.fillStyle(0x8fb6ff, 0.55);
    g.fillCircle(9, 9, 8);
    g.fillStyle(0xd8ecff, 0.95);
    g.fillTriangle(9, 0, 11.6, 9, 6.4, 9);
    g.fillTriangle(9, 18, 11.6, 9, 6.4, 9);
    g.fillTriangle(0, 9, 9, 11.6, 9, 6.4);
    g.fillTriangle(18, 9, 9, 11.6, 9, 6.4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 9, 2.6);
    g.generateTexture('spark', 18, 18);

    // Anillo de explosion.
    g.clear();
    g.lineStyle(4, 0xffc04d, 1);
    g.strokeCircle(34, 34, 30);
    g.lineStyle(2, 0xfff6d0, 0.9);
    g.strokeCircle(34, 34, 26);
    g.generateTexture('explosionRing', 68, 68);
  }

  // --- Mundo y objetos ---------------------------------------------------

  createWorldTextures(g, makeRect) {
    // Arbusto de cobertura: bloquea enemigos y sus proyectiles, deja pasar al
    // jugador y a sus flechas. Eso lo convierte en refugio, no en obstaculo.
    g.clear();
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(15, 23, 24, 5);
    g.fillStyle(0x2a3d1c, 1);
    g.fillCircle(9, 17, 8.5);
    g.fillCircle(21, 18, 8.5);
    g.fillCircle(15, 11, 9.5);
    g.fillStyle(0x3f5c2a, 1);
    g.fillCircle(9, 16, 7);
    g.fillCircle(21, 17, 7);
    g.fillCircle(15, 10, 8);
    g.fillStyle(0x557a37, 1);
    g.fillCircle(11, 13, 5);
    g.fillCircle(19, 14, 4);
    g.fillStyle(0x6d9445, 1);
    g.fillCircle(13, 9, 3.4);
    g.fillCircle(18, 11, 2.2);
    g.fillStyle(0x8fb35c, 0.8);
    g.fillCircle(12, 7.5, 1.6);
    g.generateTexture('bush', 30, 26);

    // Corazon de emergencia.
    g.clear();
    g.fillStyle(0x7d1109, 1);
    g.fillCircle(6, 6.4, 5.8);
    g.fillCircle(14, 6.4, 5.8);
    g.fillTriangle(0.2, 8.4, 19.8, 8.4, 10, 19.6);
    g.fillStyle(0xd8342b, 1);
    g.fillCircle(6, 6, 5);
    g.fillCircle(14, 6, 5);
    g.fillTriangle(1.2, 8, 18.8, 8, 10, 18.4);
    g.fillStyle(0xff7d70, 1);
    g.fillCircle(5.4, 4.8, 2.2);
    g.fillStyle(0xffc4bd, 0.9);
    g.fillCircle(4.6, 4, 1);
    g.generateTexture('heart', 20, 20);

    // Estrellas de puntuacion por nivel (llena y vacia).
    const makeStar = (key, fill, stroke, shine) => {
      g.clear();
      const points = [];
      for (let i = 0; i < 10; i += 1) {
        const radius = i % 2 === 0 ? 11 : 4.6;
        const angle = -Math.PI / 2 + (Math.PI * i) / 5;
        points.push({ x: 12 + Math.cos(angle) * radius, y: 12 + Math.sin(angle) * radius });
      }
      g.fillStyle(fill, 1);
      g.fillPoints(points, true);
      g.lineStyle(1.5, stroke, 1);
      g.strokePoints(points, true);
      if (shine !== undefined) {
        g.fillStyle(shine, 0.85);
        g.fillTriangle(12, 2, 14, 9, 10, 9);
      }
      g.generateTexture(key, 24, 24);
    };

    makeStar('starFull', 0xffd452, 0x7c4a00, 0xfff6d0);
    makeStar('starEmpty', 0x4a3a24, 0x2a2015);

    // Moneda: canto oscuro, cara dorada, anillo interior y rombo en relieve.
    g.clear();
    g.fillStyle(0x7c4a00, 1);
    g.fillCircle(9, 9, 9);
    g.fillStyle(0xc98f14, 1);
    g.fillCircle(9, 9, 8);
    g.fillStyle(0xffd452, 1);
    g.fillCircle(9, 8.4, 7);
    g.lineStyle(1, 0xc98f14, 1);
    g.strokeCircle(9, 8.6, 5);
    g.fillStyle(0xc98f14, 1);
    g.fillTriangle(9, 4.8, 11.8, 8.8, 9, 12.6);
    g.fillTriangle(9, 4.8, 6.2, 8.8, 9, 12.6);
    g.fillStyle(0xffe98a, 1);
    g.fillTriangle(9, 4.2, 11.1, 8.3, 9, 11.8);
    g.fillTriangle(9, 4.2, 6.9, 8.3, 9, 11.8);
    g.fillStyle(0xfff6d0, 0.9);
    g.fillEllipse(6.2, 5.4, 4.4, 2.8);
    g.generateTexture('coin', 18, 18);

    makeRect('portal', 50, 70, 0x7b4dff, 0xffd452);
    makeRect('platform', 112, 26, 0x5e5043, 0xc6a678);
  }
}
