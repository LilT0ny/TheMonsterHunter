import AudioManager from '../core/audio.js';

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
    if (!this.registry.get('audio')) {
      this.registry.set('audio', new AudioManager());
    }
    this.scene.start('MenuScene');
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

    // Arquero: capucha en punta, bufanda y botas. El arco ya NO se dibuja aca:
    // vive en su propia textura ('bow') para poder rotarlo hacia donde apunta
    // el jugador. Un arma pintada sobre el cuerpo nunca puede apuntar.
    const makeArcher = (key, cloakColor, scarfColor, bootColor) => {
      g.clear();
      g.fillStyle(cloakColor, 1);
      g.fillRect(8, 6, 16, 22);
      g.fillTriangle(8, 6, 24, 6, 16, 0);
      g.fillStyle(scarfColor, 1);
      g.fillRect(9, 12, 14, 4);
      g.fillStyle(bootColor, 1);
      g.fillRect(12, 7, 8, 5);
      g.fillRect(6, 24, 5, 8);
      g.fillRect(21, 24, 5, 8);
      g.generateTexture(key, 32, 32);
    };

    makeArcher('archer', 0x6b3f1d, 0xd6a85f, 0x2b1a11);
    makeArcher('archer2', 0x24506b, 0x8fd6ff, 0x101f2b);

    // Arco suelto: rotacion 0 apunta a la derecha, la curva mira al objetivo y
    // la cuerda queda del lado del jugador.
    const makeBow = (key, woodColor, stringColor) => {
      g.clear();
      g.lineStyle(3, woodColor, 1);
      g.beginPath();
      g.arc(6, 13, 11, Phaser.Math.DegToRad(-75), Phaser.Math.DegToRad(75), false);
      g.strokePath();
      g.lineStyle(1, stringColor, 1);
      g.lineBetween(8.8, 2.4, 8.8, 23.6);
      g.fillStyle(stringColor, 1);
      g.fillCircle(17, 13, 1.6);
      g.generateTexture(key, 24, 26);
    };

    makeBow('bow', 0x5a3a1a, 0xffd26f);
    makeBow('bow2', 0x2f4a5e, 0xbfe9ff);

    // Fogonazo del disparo: destello corto en la punta del arco.
    g.clear();
    g.fillStyle(0xfff6d0, 0.95);
    g.fillTriangle(0, 11, 16, 6, 16, 16);
    g.fillStyle(0xffd452, 0.85);
    g.fillCircle(6, 11, 6);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(4, 11, 3);
    g.generateTexture('muzzleFlash', 22, 22);

    // Arbusto de cobertura: bloquea enemigos y sus proyectiles, deja pasar al
    // jugador y a sus flechas. Eso lo convierte en refugio, no en obstaculo.
    g.clear();
    g.fillStyle(0x3f5c2a, 1);
    g.fillCircle(9, 16, 8);
    g.fillCircle(21, 17, 8);
    g.fillCircle(15, 10, 9);
    g.fillStyle(0x557a37, 1);
    g.fillCircle(11, 13, 5);
    g.fillCircle(19, 14, 4);
    g.fillStyle(0x6d9445, 1);
    g.fillCircle(14, 9, 3);
    g.fillStyle(0x2a3d1c, 1);
    g.fillCircle(7, 20, 2);
    g.fillCircle(23, 21, 2);
    g.generateTexture('bush', 30, 26);

    // Corazon de emergencia.
    g.clear();
    g.fillStyle(0xd8342b, 1);
    g.fillCircle(6, 6, 5.5);
    g.fillCircle(14, 6, 5.5);
    g.fillTriangle(0.6, 8, 19.4, 8, 10, 19);
    g.fillStyle(0xff7d70, 1);
    g.fillCircle(5, 5, 2);
    g.fillStyle(0x7d1109, 1);
    g.fillCircle(15, 9, 1.2);
    g.generateTexture('heart', 20, 20);

    // Limo verde: el enemigo que se duplica si lo dejas vivo.
    g.clear();
    g.fillStyle(0x3f9c46, 1);
    g.fillEllipse(13, 13, 24, 20);
    g.fillStyle(0x63c46a, 0.9);
    g.fillEllipse(11, 10, 14, 10);
    g.fillStyle(0x2a6b30, 1);
    g.fillEllipse(13, 20, 20, 7);
    g.fillStyle(0xf4fff2, 1);
    g.fillCircle(9, 12, 2.6);
    g.fillCircle(17, 12, 2.6);
    g.fillStyle(0x14330f, 1);
    g.fillCircle(9, 12, 1.2);
    g.fillCircle(17, 12, 1.2);
    g.generateTexture('slime', 26, 26);

    // Estrellas de puntuacion por nivel (llena y vacia).
    const makeStar = (key, fill, stroke) => {
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
      g.generateTexture(key, 24, 24);
    };

    makeStar('starFull', 0xffd452, 0x7c4a00);
    makeStar('starEmpty', 0x4a3a24, 0x2a2015);

    // Arana de arena: cuerpo en dos lobulos + 8 patas finas radiales.
    g.clear();
    g.lineStyle(2, 0xffb65c, 1);
    [-2.3, -1.9, -1.3, -0.9, 0.9, 1.3, 1.9, 2.3].forEach((angle) => {
      g.lineBetween(13, 10, 13 + Math.cos(angle) * 12, 10 + Math.sin(angle) * 8);
    });
    g.fillStyle(0x2b1a11, 1);
    g.fillEllipse(13, 12, 16, 11);
    g.fillEllipse(13, 5, 9, 7);
    g.fillStyle(0xff4d4d, 1);
    g.fillCircle(11, 4, 1);
    g.fillCircle(15, 4, 1);
    g.generateTexture('spider', 26, 20);

    // Escorpion centinela: cola curva con aguijon + pinzas delanteras.
    g.clear();
    g.lineStyle(4, 0x553018, 1);
    g.beginPath();
    g.arc(22, 10, 10, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
    g.strokePath();
    g.fillStyle(0xff8f4d, 1);
    g.fillTriangle(30, 2, 34, 5, 29, 7);
    g.fillStyle(0x553018, 1);
    g.fillEllipse(14, 13, 20, 12);
    g.fillStyle(0xff8f4d, 1);
    g.fillTriangle(2, 8, 7, 5, 7, 11);
    g.fillTriangle(2, 18, 7, 15, 7, 21);
    g.fillStyle(0xffe6b3, 1);
    g.fillCircle(10, 10, 1.2);
    g.fillCircle(10, 16, 1.2);
    g.generateTexture('scorpion', 34, 22);

    // Momia errante: cuerpo vendado, vendas cruzadas, tiras sueltas, ojos que brillan.
    g.clear();
    g.fillStyle(0xe0d2a4, 1);
    g.fillRect(6, 4, 18, 28);
    g.fillStyle(0xc9b98a, 1);
    g.fillRect(4, 2, 22, 8);
    g.lineStyle(2, 0x735c3b, 1);
    g.lineBetween(6, 10, 24, 14);
    g.lineBetween(24, 10, 6, 14);
    g.lineBetween(6, 18, 24, 22);
    g.lineBetween(24, 18, 6, 22);
    g.lineBetween(6, 26, 24, 30);
    g.fillStyle(0xd8c79a, 1);
    g.fillTriangle(8, 32, 12, 32, 10, 34);
    g.fillTriangle(18, 32, 22, 32, 20, 34);
    g.fillStyle(0xff5d2a, 1);
    g.fillCircle(11, 8, 1.4);
    g.fillCircle(19, 8, 1.4);
    g.generateTexture('mummy', 30, 34);

    // Serpiente voladora: cuerpo en curva, alas pequenas, lengua bifurcada.
    g.clear();
    g.fillStyle(0x4c7a3f, 1);
    g.fillEllipse(9, 10, 10, 9);
    g.fillEllipse(17, 6, 10, 8);
    g.fillEllipse(25, 12, 10, 8);
    g.fillEllipse(32, 9, 7, 6);
    g.fillStyle(0xb6e39d, 1);
    g.fillEllipse(9, 12, 7, 4);
    g.fillEllipse(25, 14, 6, 3);
    g.fillStyle(0xdff5cf, 0.85);
    g.fillTriangle(13, 4, 20, 0, 19, 8);
    g.fillTriangle(13, 16, 20, 20, 19, 12);
    g.fillStyle(0x3f6633, 1);
    g.fillCircle(6, 9, 4);
    g.lineStyle(1, 0xff5d2a, 1);
    g.lineBetween(2, 9, 0, 7);
    g.lineBetween(2, 9, 0, 11);
    g.fillStyle(0xffe6b3, 1);
    g.fillCircle(5, 7, 1);
    g.generateTexture('serpent', 36, 20);

    // Coloso de piedra: torso en bloque + brazos/piernas + grietas + ojos que arden.
    g.clear();
    g.fillStyle(0x6b6b66, 1);
    g.fillRect(8, 8, 48, 48);
    g.fillStyle(0x5a5a54, 1);
    g.fillRect(0, 20, 12, 20);
    g.fillRect(52, 20, 12, 20);
    g.fillStyle(0x4d4d47, 1);
    g.fillRect(4, 44, 20, 16);
    g.fillRect(40, 44, 20, 16);
    g.lineStyle(2, 0x2b2b28, 1);
    g.lineBetween(8, 24, 56, 24);
    g.lineBetween(8, 40, 56, 40);
    g.lineBetween(24, 8, 20, 56);
    g.lineBetween(44, 8, 48, 56);
    g.strokeRect(1, 1, 62, 62);
    g.fillStyle(0xffb347, 1);
    g.fillCircle(22, 20, 3);
    g.fillCircle(42, 20, 3);
    g.generateTexture('golem', 64, 64);

    // Espiritu de arena: silueta fantasmal con base ondulada.
    g.clear();
    g.fillStyle(0xbfefff, 0.9);
    g.fillCircle(10, 8, 8);
    g.fillPoints([
      { x: 2, y: 8 },
      { x: 2, y: 16 },
      { x: 5, y: 13 },
      { x: 8, y: 18 },
      { x: 11, y: 13 },
      { x: 14, y: 18 },
      { x: 17, y: 13 },
      { x: 18, y: 8 }
    ], true);
    g.fillStyle(0x6fb8cf, 0.6);
    g.fillCircle(10, 8, 4);
    g.fillStyle(0x1a2f38, 1);
    g.fillCircle(7, 7, 1);
    g.fillCircle(13, 7, 1);
    g.generateTexture('spirit', 20, 20);

    // Guardian de piedra: cuerpo gris + visera + cinturon + franja dorada del lado
    // donde apunta el escudo (rotacion 0 = derecha, por convencion de Phaser).
    g.clear();
    g.fillStyle(0x5a5148, 1);
    g.fillRect(0, 0, 40, 50);
    g.lineStyle(2, 0x2b261f, 1);
    g.strokeRect(1, 1, 38, 48);
    g.fillStyle(0x3f382f, 1);
    g.fillRect(6, 4, 28, 8);
    g.fillRect(4, 30, 32, 5);
    g.fillStyle(0x1a1712, 1);
    g.fillRect(10, 7, 20, 3);
    g.fillStyle(0xc9a227, 1);
    g.fillRect(32, 0, 8, 50);
    g.lineStyle(2, 0x8a6f1a, 1);
    g.strokeRect(32, 0, 8, 50);
    g.generateTexture('guardian', 40, 50);

    // Rey Escorpion: version imponente del escorpion, cresta de picos y pinzas grandes.
    g.clear();
    g.lineStyle(6, 0x4a0d0d, 1);
    g.beginPath();
    g.arc(36, 18, 16, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(345), false);
    g.strokePath();
    g.fillStyle(0xffb347, 1);
    g.fillTriangle(50, 2, 56, 7, 47, 10);
    g.fillStyle(0x4a0d0d, 1);
    g.fillEllipse(24, 24, 34, 20);
    g.fillStyle(0xffb347, 1);
    [10, 18, 26, 34].forEach((x) => g.fillTriangle(x - 3, 12, x + 3, 12, x, 4));
    g.fillStyle(0x6b1414, 1);
    g.fillTriangle(0, 14, 10, 8, 10, 18);
    g.fillTriangle(0, 32, 10, 26, 10, 36);
    g.fillStyle(0xffe6b3, 1);
    g.fillCircle(16, 18, 1.6);
    g.fillCircle(16, 30, 1.6);
    g.lineStyle(2, 0x2b0505, 1);
    g.strokeEllipse(24, 24, 34, 20);
    g.generateTexture('kingScorpion', 56, 40);

    // Flecha: punta brillante, astil de madera y plumas rojas. Antes era un
    // rectangulo plano de 22x5 px, por eso el disparo no se leia en pantalla.
    g.clear();
    g.fillStyle(0x8a6a3a, 1);
    g.fillRect(5, 4, 18, 3);
    g.fillStyle(0xfff0b8, 1);
    g.fillTriangle(21, 0, 30, 5.5, 21, 11);
    g.fillStyle(0xffd452, 1);
    g.fillTriangle(22, 2, 27, 5.5, 22, 9);
    g.fillStyle(0xe8563f, 1);
    g.fillTriangle(0, 0, 8, 4, 0, 5);
    g.fillTriangle(0, 11, 8, 7, 0, 6);
    g.generateTexture('arrow', 30, 11);

    // Estela que va dejando la flecha en vuelo.
    g.clear();
    g.fillStyle(0xffe08a, 0.5);
    g.fillCircle(5, 5, 5);
    g.fillStyle(0xfff6d0, 0.9);
    g.fillCircle(5, 5, 2.4);
    g.generateTexture('arrowTrail', 10, 10);

    // Proyectiles y objetos.
    makeRect('enemyBolt', 12, 12, 0xc24b37, 0xffd0a3);
    makeRect('venom', 12, 12, 0x67bf5b, 0xcaffe1);

    // Moneda: canto oscuro, cara dorada, anillo interior en relieve, rombo
    // central y un brillo arriba a la izquierda. Antes era un cuadrado plano.
    g.clear();
    g.fillStyle(0x7c4a00, 1);
    g.fillCircle(9, 9, 9);
    g.fillStyle(0xc98f14, 1);
    g.fillCircle(9, 9, 8);
    g.fillStyle(0xffd452, 1);
    g.fillCircle(9, 8.4, 7);
    g.lineStyle(1, 0xc98f14, 1);
    g.strokeCircle(9, 8.6, 5);
    // Rombo en relieve: base oscura y cara clara desplazada hacia arriba. Las
    // dos mitades se dibujan siempre, si no el relieve queda torcido.
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

    // Efectos.
    g.clear();
    g.lineStyle(3, 0xffc04d, 1);
    g.strokeCircle(34, 34, 30);
    g.generateTexture('explosionRing', 68, 68);
  }
}
