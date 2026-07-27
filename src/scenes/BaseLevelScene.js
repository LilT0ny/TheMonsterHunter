import {
  ENEMY_SCORE,
  GAME_WIDTH,
  HEART_HEAL_RATIO,
  MAX_PLAYERS,
  PLAYER_PROFILES,
  REVIVE_DURATION,
  REVIVE_RADIUS
} from '../core/config.js';
import {
  addCoins,
  addScore,
  checkpointRun,
  damagePlayer,
  enableCoop,
  getDerivedStats,
  getPartyHealthRatio,
  getRun,
  healPlayer,
  isPartyWiped,
  revivePlayer,
  setLevel
} from '../core/runState.js';
import { recordLevelResult } from '../core/profile.js';
import { addButton, addKeyboardHint } from '../core/ui.js';
import { getAudio } from '../core/audio.js';

const ELITE_VISUALS = {
  mummy_giant: { scale: 1.6, tint: 0x8a6f45 },
  scorpion_elite: { scale: 1.4, tint: 0xffb347 },
  golem_fragment: { scale: 0.6 },
  sand_spirit: { scale: 1, alpha: 0.55 }
};

export default class BaseLevelScene extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.levelFinished = false;
    this.enemyKills = 0;
    this.totalEnemiesSpawned = 0;
    this.players = [];
    this.coopPromptShown = false;
  }

  createLevel({
    levelNumber,
    title,
    mapKey,
    tilesetName,
    tilesetImageKey,
    levelMusicMood = 'desierto',
    musicMood = 'calm'
  }) {
    this.levelFinished = false;
    this.enemyKills = 0;
    this.totalEnemiesSpawned = 0;
    this.coopPromptShown = false;
    this.levelTitle = title;
    this.levelNumber = levelNumber;
    setLevel(this, levelNumber);

    // Punto de guardado: al entrar a un nivel la partida queda persistida, asi
    // "Continuar" del menu reanuda exactamente en este nivel aunque el jugador
    // cierre el navegador.
    checkpointRun(this, this.scene.key);

    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.createMap(mapKey, tilesetName, tilesetImageKey);
    this.createGroups();
    this.createPlayersFromMap();
    this.createCollisions();
    this.createLevelTexts();
    this.createInputs();
    this.scene.launch('UIScene', {
      levelName: title,
      levelSceneKey: this.scene.key,
      levelNumber
    });

    const audio = getAudio(this);
    audio?.startMusic(musicMood);
    audio?.startFoley('wind');
  }

  createMap(mapKey, tilesetName, tilesetImageKey) {
    this.map = this.make.tilemap({ key: mapKey });
    this.tileset = this.map.addTilesetImage(tilesetName, tilesetImageKey);
    this.groundLayer = this.map.createLayer('ground', this.tileset, 0, 0).setDepth(0);
    this.wallsLayer = this.map.createLayer('walls', this.tileset, 0, 0).setDepth(5);

    if (this.wallsLayer) {
      this.wallsLayer.setCollisionByExclusion([-1]);
    }

    const danger = this.map.getLayer('danger');
    if (danger) {
      this.dangerLayer = this.map.createLayer('danger', this.tileset, 0, 0).setDepth(3).setAlpha(0.9);
      this.dangerLayer.setCollisionByExclusion([-1]);
    }

    const lowWalls = this.map.getLayer('lowwalls');
    if (lowWalls) {
      this.lowWallsLayer = this.map.createLayer('lowwalls', this.tileset, 0, 0).setDepth(4);
      this.lowWallsLayer.setCollisionByExclusion([-1]);
    }

    this.objects = this.map.getObjectLayer('objects')?.objects || [];

    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
  }

  createGroups() {
    this.playerGroup = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.arrows = this.physics.add.group({ maxSize: 90 });
    this.enemyProjectiles = this.physics.add.group({ maxSize: 90 });
    this.coins = this.physics.add.group({ maxSize: 160 });
    this.hearts = this.physics.add.group({ maxSize: 12 });
    this.platforms = this.physics.add.group();
    this.bushes = this.physics.add.staticGroup();
  }

  // --- Jugadores --------------------------------------------------------

  createPlayersFromMap() {
    const spawn = this.findObject('player') || { x: 96, y: 480 };
    const run = getRun(this);

    this.players = [];
    run.players.forEach((_, index) => {
      const offsetX = index === 0 ? 0 : 40;
      this.createPlayer(index, spawn.x + offsetX, spawn.y);
    });

    // Alias historico: muchos niveles y ambos jefes usan this.player. Sigue
    // apuntando al jugador 1, asi el co-op no rompe nada de lo ya escrito.
    this.player = this.players[0];

    this.cameraFocus = this.add.zone(this.player.x, this.player.y, 1, 1);
    this.cameraTarget = null;   // updateCameraFocus decide a quien seguir.
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);
  }

  createPlayer(index, x, y) {
    const profile = PLAYER_PROFILES[index];
    const player = this.physics.add.sprite(x, y, profile.texture).setDepth(20);

    // El alta en el grupo va ANTES de configurar el cuerpo: al agregar un hijo,
    // el grupo de fisicas reaplica sus defaults sobre el body.
    this.playerGroup.add(player);
    player.setCollideWorldBounds(true);
    player.body.setSize(22, 24).setOffset(5, 6);

    const bow = this.add.image(x, y, index === 0 ? 'bow' : 'bow2').setDepth(21).setOrigin(0.5);

    player.setDataEnabled();
    player.setData({
      playerIndex: index,
      aimAngle: 0,
      bow,
      down: false,
      dashingUntil: 0,
      nextShotAt: 0,
      nextDashAt: 0,
      nextFootstepAt: 0,
      nextDamageAt: 0,
      cursedUntil: 0,
      curseFactor: 0.55,
      reviveProgress: 0
    });

    // Etiqueta J1/J2 solo cuando hay dos: en solitario seria ruido visual.
    const tag = this.add.text(x, y - 26, profile.label, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '11px',
      color: '#fff2cc',
      stroke: '#2a160d',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(22).setVisible(false);
    player.setData('tag', tag);

    const reviveBar = this.add.rectangle(x, y - 34, 34, 5, 0x63c46a)
      .setOrigin(0.5)
      .setDepth(23)
      .setVisible(false);
    player.setData('reviveBar', reviveBar);

    this.players[index] = player;
    return player;
  }

  /** Suma al jugador 2 en caliente, sin reiniciar el nivel. */
  joinPlayerTwo() {
    const run = getRun(this);
    if (run.players.length >= MAX_PLAYERS) return null;

    const { added, index } = enableCoop(this);
    if (!added) return null;

    const anchor = this.getAnyPlayer() || { x: 96, y: 480 };
    const spawn = this.findSpotNear(anchor.x, anchor.y);
    const player = this.createPlayer(index, spawn.x, spawn.y);

    // Dos segundos de gracia al entrar: sin esto J2 aparece al lado de J1, que
    // suele estar en pleno combate, y come dano antes de tocar una tecla.
    player.setData('nextDamageAt', this.time.now + 2000);
    this.tweens.add({ targets: player, alpha: 0.35, yoyo: true, repeat: 3, duration: 250 });

    // Las colisiones estan registradas contra playerGroup, no contra sprites
    // sueltos: por eso el jugador nuevo queda operativo sin registrar nada mas.
    this.cameras.main.flash(220, 140, 210, 255);
    getAudio(this)?.playSfx('playerJoin');
    this.refreshPlayerTags();
    this.showObjective(`Se suma el Jugador 2. ${PLAYER_PROFILES[1].hint}`, { delay: 6000 });

    return player;
  }

  refreshPlayerTags() {
    const showTags = this.players.length > 1;
    this.players.forEach((player) => player.getData('tag')?.setVisible(showTags));
  }

  /**
   * Ofrece sumar un segundo jugador. Congela la fisica mientras se decide para
   * que nadie coma dano leyendo el cartel, pero mantiene la escena viva porque
   * los botones necesitan recibir el puntero.
   */
  promptCoopJoin(message = '¿Necesitas ayuda? Puede entrar un segundo jugador.') {
    const run = getRun(this);
    if (this.coopPromptShown || run.coop || run.players.length >= MAX_PLAYERS) return false;

    this.coopPromptShown = true;
    this.overlayActive = true;
    this.physics.pause();
    getAudio(this)?.playSfx('pause');

    const created = [];
    const track = (...items) => { created.push(...items); return items[0]; };

    track(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.55).setScrollFactor(0).setDepth(1290));
    track(this.add.rectangle(480, 270, 640, 250, 0x21160f, 0.97)
      .setScrollFactor(0).setDepth(1300).setStrokeStyle(2, 0xf1c27d, 1));

    track(this.add.text(480, 192, message, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      color: '#ffd27f',
      align: 'center',
      wordWrap: { width: 560 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1301));

    track(this.add.text(480, 248, `${PLAYER_PROFILES[1].hint}\nComparten score, monedas y mejoras. Si uno cae, el otro lo reanima.`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#fff7df',
      align: 'center',
      lineSpacing: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1301));

    const close = () => {
      created.forEach((item) => item.destroy());
      this.overlayActive = false;
      this.physics.resume();
      getAudio(this)?.playSfx('unpause');
    };

    const yes = addButton(this, 360, 330, 'Sí, que entre J2', () => {
      close();
      this.joinPlayerTwo();
    }, { width: 220, height: 44, fontSize: '16px' });

    const no = addButton(this, 600, 330, 'No, puedo solo', () => {
      close();
      this.showObjective('Seguís en solitario. Suerte ahí afuera.', { delay: 2200 });
    }, { width: 220, height: 44, fontSize: '16px' });

    [yes, no].forEach(({ bg, text }) => {
      bg.setScrollFactor(0).setDepth(1302);
      text.setScrollFactor(0).setDepth(1303);
      track(bg, text);
    });

    return true;
  }

  /** Primer punto transitable en anillos crecientes alrededor de (x, y). */
  findSpotNear(x, y, maxRadius = 120) {
    for (let radius = 36; radius <= maxRadius; radius += 28) {
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        const candidateX = Phaser.Math.Clamp(x + Math.cos(angle) * radius, 24, this.map.widthInPixels - 24);
        const candidateY = Phaser.Math.Clamp(y + Math.sin(angle) * radius, 24, this.map.heightInPixels - 24);
        if (this.isPointSafe(candidateX, candidateY)) {
          return { x: candidateX, y: candidateY };
        }
      }
    }
    return { x, y };
  }

  getActivePlayers() {
    return this.players.filter((player) => player && player.active && !player.getData('down'));
  }

  getAnyPlayer() {
    return this.getActivePlayers()[0] || this.players[0] || null;
  }

  /** Objetivo para enemigos y jefes: el jugador vivo mas cercano. */
  getNearestPlayer(x, y) {
    const candidates = this.getActivePlayers();
    if (candidates.length === 0) return null;

    let nearest = candidates[0];
    let nearestDistance = Phaser.Math.Distance.Between(x, y, nearest.x, nearest.y);
    candidates.forEach((player) => {
      const distance = Phaser.Math.Distance.Between(x, y, player.x, player.y);
      if (distance < nearestDistance) {
        nearest = player;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  getPlayerIndex(player) {
    return player?.getData('playerIndex') ?? 0;
  }

  // --- Colisiones -------------------------------------------------------

  createCollisions() {
    if (this.wallsLayer) {
      this.physics.add.collider(this.playerGroup, this.wallsLayer);
      this.physics.add.collider(this.enemies, this.wallsLayer);
      this.physics.add.collider(this.enemyProjectiles, this.wallsLayer, (bolt) => bolt.destroy());
    }

    if (this.lowWallsLayer) {
      this.physics.add.collider(this.enemies, this.lowWallsLayer);
      this.physics.add.collider(
        this.playerGroup,
        this.lowWallsLayer,
        null,
        (player) => !this.isPlayerDashing(player),
        this
      );
    }

    // Arbustos: frenan al enemigo y matan sus proyectiles, pero dejan pasar al
    // jugador y a sus flechas. Asi funcionan como cobertura y no como pared.
    this.physics.add.collider(this.enemies, this.bushes);
    this.physics.add.collider(this.enemyProjectiles, this.bushes, (bolt) => this.disableSprite(bolt));

    // Las flechas del jugador se clavan en los muros. Faltaba desde siempre:
    // atravesaban paredes y se notó recién ahora que dejan estela y se ven.
    // Ojo: solo contra `walls`. Sobre `lowwalls` tienen que seguir pasando.
    if (this.wallsLayer) {
      this.physics.add.collider(this.arrows, this.wallsLayer, (arrow) => this.stickArrowToWall(arrow));
    }

    this.physics.add.overlap(this.arrows, this.enemies, this.handleArrowEnemy, null, this);
    this.physics.add.overlap(this.playerGroup, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.playerGroup, this.hearts, this.collectHeart, null, this);
    this.physics.add.overlap(this.playerGroup, this.enemies, this.handlePlayerEnemy, null, this);
    this.physics.add.overlap(this.playerGroup, this.enemyProjectiles, this.handlePlayerProjectile, null, this);
  }

  createLevelTexts() {
    // Ya no dibujamos el nombre del nivel en grande sobre el mapa: UIScene lo
    // muestra de forma permanente en la barra superior, y el duplicado se
    // superponia con el HUD y con el cartel de objetivo.
    addKeyboardHint(this, this.players.length > 1
      ? `${PLAYER_PROFILES[0].hint}  |  ${PLAYER_PROFILES[1].hint}`
      : undefined);

    this.refreshPlayerTags();
  }

  showObjective(text, options = {}) {
    const {
      backgroundColor = 'rgba(54, 29, 12, 0.78)',
      delay = 4500,
      duration = 700,
      wordWrapWidth = 620
    } = options;

    // Un solo mensaje a la vez: dos avisos seguidos se dibujaban superpuestos y
    // quedaban ilegibles (por ejemplo "entro J2" y "J2 cayo").
    this.activeObjective?.destroy();

    const objective = this.add.text(480, 78, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#fff2cc',
      backgroundColor,
      padding: { left: 12, right: 12, top: 8, bottom: 8 },
      wordWrap: { width: wordWrapWidth }
    }).setScrollFactor(0).setOrigin(0.5).setDepth(1100);

    this.activeObjective = objective;
    this.tweens.add({
      targets: objective,
      alpha: 0,
      delay,
      duration,
      onComplete: () => {
        if (this.activeObjective === objective) this.activeObjective = null;
        objective.destroy();
      }
    });

    return objective;
  }

  fadeOutAndDestroy(gameObject, duration) {
    this.tweens.add({
      targets: gameObject,
      alpha: 0,
      duration,
      onComplete: () => gameObject.destroy()
    });
  }

  announceBossPhase(intensity, extraSfx = null) {
    const audio = getAudio(this);
    audio?.playSfx('bossPhase');
    if (extraSfx) audio?.playSfx(extraSfx);
    audio?.setMusicIntensity(intensity);
  }

  // --- Entrada ----------------------------------------------------------

  createInputs() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,ESC,SHIFT,P');

    this.playerKeys = PLAYER_PROFILES.map((profile, index) => {
      const map = this.input.keyboard.addKeys(Object.values(profile.keys).join(','));

      // El sondeo con isDown en update() permite mantener apretado para disparar
      // en rafaga, pero un toque muy corto puede empezar y terminar entre dos
      // frames y no verse nunca. El evento 'down' cubre ese caso; el cooldown de
      // tryShoot evita que ambos caminos disparen dos veces.
      map[profile.keys.shoot].on('down', () => {
        const own = this.players[index];
        if (own && own.active && !own.getData('down')) {
          this.tryShoot(own);
          return;
        }
        // Si el dueño de esa tecla esta caido, dispara el que quede en pie.
        const active = this.getActivePlayers();
        if (active.length === 1) this.tryShoot(active[0]);
      });
      return map;
    });

    this.pointerEverMoved = false;
    this.input.on('pointermove', () => { this.pointerEverMoved = true; });
    this.input.on('pointerdown', () => {
      this.pointerEverMoved = true;
      const player = this.players[0];
      if (player && !player.getData('down')) this.tryShoot(player);
    });

    // ESC y P abren la pausa. Volver al menu ahora vive dentro del menu de
    // pausa, para no perder una partida por apretar ESC sin querer.
    this.keys.ESC.on('down', () => this.pauseLevel());
    this.keys.P.on('down', () => this.pauseLevel());
  }

  pauseLevel() {
    if (this.levelFinished || this.scene.isPaused() || this.overlayActive) return;
    // PauseScene empuja esta marca al reanudar: sin ella, la misma pulsacion de
    // ESC que cierra la pausa la volveria a abrir.
    if (this.time.now < (this.nextPauseAllowedAt || 0)) return;
    getAudio(this)?.playSfx('pause');
    this.scene.pause();
    this.scene.launch('PauseScene', {
      levelSceneKey: this.scene.key,
      levelTitle: this.levelTitle,
      levelNumber: this.levelNumber
    });
  }

  // --- Bucle principal --------------------------------------------------

  update(time, delta) {
    if (!this.player || this.levelFinished || this.overlayActive) return;

    this.updatePlayers(time, delta);
    this.updateRevives(time, delta);
    this.updateCameraFocus();
    this.updateArrows(time, delta);
    this.updateEnemies(time, delta);
    this.updateProjectiles(time);
  }

  updatePlayers(time, delta) {
    // Se calculan una vez por frame y no una vez por jugador: getRun() clona la
    // partida entera en cada llamada.
    const stats = getDerivedStats(getRun(this));
    const lastOneStanding = this.getActivePlayers().length <= 1;

    this.players.forEach((player) => {
      if (!player || !player.active) return;
      this.updatePlayerOverlays(player);
      if (player.getData('down')) {
        player.setVelocity(0, 0);
        return;
      }
      this.updatePlayerMovement(player, time, stats, lastOneStanding);
      this.updatePlayerAim(player);
      this.updatePlayerActions(player, lastOneStanding);
      this.updateBow(player);
    });
  }

  /**
   * Una tecla cuenta si pertenece al esquema del propio jugador. Ademas, cuando
   * queda UN SOLO jugador en pie, ese jugador acepta TODOS los esquemas.
   *
   * Sin esto, si en co-op cae J1 el que sigue vivo se queda sin WASD y parece
   * que el juego dejo de responder. Tambien cubre el caso de jugar solo: J1 es
   * el unico en pie, asi que le sirven WASD y las flechas indistintamente.
   */
  isActionPressed(index, action, acceptAllSchemes) {
    if (this.playerKeys[index]?.[PLAYER_PROFILES[index].keys[action]]?.isDown) return true;
    if (!acceptAllSchemes) return false;

    return PLAYER_PROFILES.some((other, i) =>
      i !== index && this.playerKeys[i]?.[other.keys[action]]?.isDown === true);
  }

  isActionJustPressed(index, action, acceptAllSchemes) {
    const own = this.playerKeys[index]?.[PLAYER_PROFILES[index].keys[action]];
    if (own && Phaser.Input.Keyboard.JustDown(own)) return true;
    if (!acceptAllSchemes) return false;

    return PLAYER_PROFILES.some((other, i) => {
      if (i === index) return false;
      const key = this.playerKeys[i]?.[other.keys[action]];
      return key ? Phaser.Input.Keyboard.JustDown(key) : false;
    });
  }

  updatePlayerMovement(player, time, stats, lastOneStanding) {
    if (this.isPlayerDashing(player)) return;

    const index = this.getPlayerIndex(player);
    const cursedUntil = player.getData('cursedUntil') || 0;
    const curseFactor = player.getData('curseFactor') ?? 0.55;
    const speed = time < cursedUntil ? stats.moveSpeed * curseFactor : stats.moveSpeed;

    let vx = 0;
    let vy = 0;
    if (this.isActionPressed(index, 'left', lastOneStanding)) vx -= 1;
    if (this.isActionPressed(index, 'right', lastOneStanding)) vx += 1;
    if (this.isActionPressed(index, 'up', lastOneStanding)) vy -= 1;
    if (this.isActionPressed(index, 'down', lastOneStanding)) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const vector = new Phaser.Math.Vector2(vx, vy).normalize().scale(speed);
      player.setVelocity(vector.x, vector.y);
      player.setData('moveAngle', Math.atan2(vector.y, vector.x));

      if (time > (player.getData('nextFootstepAt') || 0)) {
        player.setData('nextFootstepAt', time + 300);
        getAudio(this)?.playSfx('footstep');
      }
    } else {
      player.setVelocity(0, 0);
    }
  }

  updatePlayerAim(player) {
    const index = this.getPlayerIndex(player);
    const profile = PLAYER_PROFILES[index];

    // J1 apunta con el mouse en cuanto lo mueve; hasta entonces (y siempre para
    // J2) apunta hacia donde se esta desplazando.
    if (profile.usesPointer && this.pointerEverMoved) {
      const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
      player.setData('aimAngle', Phaser.Math.Angle.Between(player.x, player.y, worldPoint.x, worldPoint.y));
      return;
    }

    const moveAngle = player.getData('moveAngle');
    if (moveAngle !== undefined) {
      player.setData('aimAngle', moveAngle);
    }
  }

  updatePlayerActions(player, lastOneStanding) {
    const index = this.getPlayerIndex(player);
    const profile = PLAYER_PROFILES[index];

    // El mouse siempre dispara por el jugador 1, salvo que J1 este caido: ahi
    // pasa a manejar al que quede en pie.
    const pointerShoots = (profile.usesPointer || lastOneStanding) && this.input.activePointer.isDown;
    if (pointerShoots || this.isActionPressed(index, 'shoot', lastOneStanding)) {
      this.tryShoot(player);
    }

    if (this.isActionJustPressed(index, 'dash', lastOneStanding)) {
      this.tryDash(player);
    }
  }

  updatePlayerOverlays(player) {
    const tag = player.getData('tag');
    if (tag) tag.setPosition(player.x, player.y - 26);

    const bar = player.getData('reviveBar');
    if (bar) bar.setPosition(player.x, player.y - 34);
  }

  updateBow(player) {
    const bow = player.getData('bow');
    if (!bow) return;
    const angle = player.getData('aimAngle') || 0;
    bow.setPosition(player.x + Math.cos(angle) * 15, player.y + Math.sin(angle) * 15);
    bow.setRotation(angle);
    bow.setVisible(true);
  }

  updateCameraFocus() {
    if (!this.cameraFocus) return;
    const active = this.getActivePlayers();
    const list = active.length > 0 ? active : this.players;
    if (list.length === 0) return;

    // Con un solo jugador en pie la camara lo sigue DIRECTAMENTE. Seguir un
    // objeto intermedio que se reposiciona en update() agrega un frame de
    // retraso sobre el suavizado, y el movimiento se siente pastoso.
    const target = list.length === 1 ? list[0] : this.cameraFocus;
    if (target !== this.cameraTarget) {
      this.cameraTarget = target;
      this.cameras.main.startFollow(target, true, 0.12, 0.12);
    }

    if (list.length < 2) {
      // Vuelve al zoom normal: si un companero cae, la camara no puede quedar
      // abierta por la distancia hasta un cuerpo que ya no se mueve.
      const zoom = this.cameras.main.zoom;
      this.cameras.main.setZoom(Math.abs(zoom - 1) < 0.003 ? 1 : Phaser.Math.Linear(zoom, 1, 0.08));
      return;
    }

    const sum = list.reduce((acc, player) => ({ x: acc.x + player.x, y: acc.y + player.y }), { x: 0, y: 0 });
    this.cameraFocus.setPosition(sum.x / list.length, sum.y / list.length);

    // La apertura se mide solo entre jugadores EN PIE, nunca contra un caido.
    let spread = 0;
    list.forEach((a) => list.forEach((b) => {
      spread = Math.max(spread, Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y));
    }));

    const targetZoom = Phaser.Math.Clamp(GAME_WIDTH / (spread + 560), 0.64, 1);
    this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom, targetZoom, 0.05));
  }

  // --- Caida y reanimacion ----------------------------------------------

  updateRevives(time, delta) {
    if (this.players.length < 2) return;

    this.players.forEach((downed, index) => {
      const bar = downed.getData('reviveBar');
      if (!downed.getData('down')) {
        bar?.setVisible(false);
        return;
      }

      const helper = this.players.find((other, otherIndex) =>
        otherIndex !== index && !other.getData('down') && other.active);

      let progress = downed.getData('reviveProgress') || 0;
      if (helper && Phaser.Math.Distance.Between(helper.x, helper.y, downed.x, downed.y) <= REVIVE_RADIUS) {
        progress += delta;
      } else {
        progress = Math.max(0, progress - delta * 1.6);
      }

      if (progress >= REVIVE_DURATION) {
        this.revivePlayerSprite(downed);
        return;
      }

      downed.setData('reviveProgress', progress);
      if (bar) {
        bar.setVisible(progress > 0);
        bar.displayWidth = 34 * (progress / REVIVE_DURATION);
      }
    });
  }

  downPlayer(player) {
    if (player.getData('down')) return;
    player.setData('down', true);
    player.setData('reviveProgress', 0);
    player.setVelocity(0, 0);
    player.setTint(0x4c4c4c).setAlpha(0.55);
    player.getData('bow')?.setVisible(false);
    getAudio(this)?.playSfx('down');

    if (isPartyWiped(getRun(this))) {
      this.gameOver();
      return;
    }

    this.showObjective(
      `${PLAYER_PROFILES[this.getPlayerIndex(player)].label} cayo. Acercate y quedate al lado para reanimarlo.`,
      { delay: 3200 }
    );
  }

  revivePlayerSprite(player) {
    const index = this.getPlayerIndex(player);
    const { revived } = revivePlayer(this, index);
    if (!revived) return;

    player.setData('down', false);
    player.setData('reviveProgress', 0);
    player.setData('nextDamageAt', this.time.now + 1200);
    player.clearTint().setAlpha(1);
    player.getData('reviveBar')?.setVisible(false);
    getAudio(this)?.playSfx('revive');

    const ring = this.add.image(player.x, player.y, 'explosionRing').setDepth(30).setTint(0x9fe8ff);
    this.tweens.add({ targets: ring, scale: 1.5, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
  }

  isPlayerDashing(player) {
    return this.time.now < (player?.getData('dashingUntil') || 0);
  }

  /** Compatibilidad: el jugador 1 sigue respondiendo a isDashing(). */
  isDashing() {
    return this.isPlayerDashing(this.players[0]);
  }

  tryDash(player) {
    const now = this.time.now;
    if (!player || this.levelFinished || player.getData('down')) return;
    if (now < (player.getData('nextDashAt') || 0) || this.isPlayerDashing(player)) return;

    const DASH_SPEED = 620;
    const DASH_DURATION = 180;
    const DASH_COOLDOWN = 1200;

    const angle = player.getData('moveAngle') ?? player.getData('aimAngle') ?? 0;
    this.physics.velocityFromRotation(angle, DASH_SPEED, player.body.velocity);
    player.setData('dashingUntil', now + DASH_DURATION);
    player.setData('nextDashAt', now + DASH_COOLDOWN);
  }

  // --- Disparo ----------------------------------------------------------

  tryShoot(player) {
    if (!player || this.levelFinished || this.overlayActive || player.getData('down')) return;

    const now = this.time.now;
    if (now < (player.getData('nextShotAt') || 0)) return;

    const run = getRun(this);
    const stats = getDerivedStats(run);
    const angle = player.getData('aimAngle') || 0;

    getAudio(this)?.playSfx('shoot');
    this.spawnMuzzleFlash(player, angle);

    const skills = run.skills;
    if (skills.includes('rain')) {
      [-0.45, -0.22, 0, 0.22, 0.45].forEach((offset) => this.spawnArrow(player, angle + offset));
    } else if (skills.includes('double')) {
      this.spawnArrow(player, angle - 0.13);
      this.spawnArrow(player, angle + 0.13);
    } else {
      this.spawnArrow(player, angle);
    }

    player.setData('nextShotAt', now + stats.shootCooldown);
  }

  /** Impacto contra muro: la flecha se apaga y deja una chispa breve. */
  stickArrowToWall(arrow) {
    if (!arrow.active) return;
    const puff = this.add.image(arrow.x, arrow.y, 'arrowTrail').setDepth(19).setScale(0.9);
    this.tweens.add({
      targets: puff,
      alpha: 0,
      scale: 0.2,
      duration: 180,
      onComplete: () => puff.destroy()
    });
    this.disableSprite(arrow);
  }

  spawnMuzzleFlash(player, angle) {
    const flash = this.add.image(
      player.x + Math.cos(angle) * 24,
      player.y + Math.sin(angle) * 24,
      'muzzleFlash'
    ).setDepth(24).setRotation(angle).setScale(0.7);

    this.tweens.add({
      targets: flash,
      scale: 1.25,
      alpha: 0,
      duration: 110,
      onComplete: () => flash.destroy()
    });
  }

  spawnArrow(player, angle) {
    const run = getRun(this);
    const stats = getDerivedStats(run);
    const originX = player.x + Math.cos(angle) * 18;
    const originY = player.y + Math.sin(angle) * 18;
    const arrow = this.arrows.get(originX, originY, 'arrow');
    if (!arrow) return;

    arrow.setActive(true).setVisible(true).setDepth(18).setAlpha(1);
    arrow.body.enable = true;
    arrow.body.setAllowGravity(false);
    arrow.body.setSize(24, 7);
    arrow.setRotation(angle);
    arrow.setDataEnabled();
    arrow.setData({
      bornAt: this.time.now,
      ttl: run.skills.includes('boomerang') ? 1450 : 1050,
      damage: stats.arrowDamage,
      returned: false,
      hits: 0,
      nextTrailAt: 0
    });
    this.physics.velocityFromRotation(angle, 500, arrow.body.velocity);
  }

  updateArrows(time) {
    // Una sola lectura para todas las flechas: getRun() clona la partida entera,
    // y llamarla por flecha y por frame era basura generada de mas.
    const skills = getRun(this).skills;

    this.arrows.children.each((arrow) => {
      if (!arrow.active) return;
      const bornAt = arrow.getData('bornAt') || time;
      const ttl = arrow.getData('ttl') || 1000;

      if (time - bornAt > ttl) {
        this.disableSprite(arrow);
        return;
      }

      // Estela: hace que el disparo se lea en pantalla incluso a alta velocidad.
      if (time > (arrow.getData('nextTrailAt') || 0)) {
        arrow.setData('nextTrailAt', time + 32);
        const trail = this.add.image(arrow.x, arrow.y, 'arrowTrail').setDepth(17);
        this.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.25,
          duration: 210,
          onComplete: () => trail.destroy()
        });
      }

      if (skills.includes('boomerang') && !arrow.getData('returned') && time - bornAt > 520) {
        arrow.setData('returned', true);
        arrow.body.velocity.x *= -1;
        arrow.body.velocity.y *= -1;
        arrow.rotation += Math.PI;
      }

      if (skills.includes('homing')) {
        const target = this.findNearestEnemy(arrow.x, arrow.y, 280);
        if (target) {
          const angle = Phaser.Math.Angle.Between(arrow.x, arrow.y, target.x, target.y);
          arrow.rotation = Phaser.Math.Angle.RotateTo(arrow.rotation, angle, 0.045);
          this.physics.velocityFromRotation(arrow.rotation, 500, arrow.body.velocity);
        }
      }
    });
  }

  // --- Enemigos ---------------------------------------------------------

  updateEnemies(time) {
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;

      const target = this.getNearestPlayer(enemy.x, enemy.y);
      if (!target) {
        enemy.setVelocity(0, 0);
        return;
      }

      const type = enemy.getData('type');
      const baseSpeed = enemy.getData('speed') || 70;
      const slowUntil = enemy.getData('slowUntil') || 0;
      const speed = time < slowUntil ? baseSpeed * 0.5 : baseSpeed;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);

      if (type === 'spider') {
        const wobble = Math.sin(time / 180 + (enemy.getData('phase') || 0)) * 0.7;
        this.physics.velocityFromRotation(angle + wobble, speed, enemy.body.velocity);
      }

      if (type === 'scorpion' || type === 'scorpion_elite') {
        if (distance > 180) {
          this.physics.velocityFromRotation(angle, speed * 0.55, enemy.body.velocity);
        } else {
          enemy.setVelocity(0, 0);
        }

        if (type === 'scorpion_elite') {
          this.enemyShoot(enemy, target, 'enemyBolt', 300, 16, 950);
        } else {
          this.enemyShoot(enemy, target, 'enemyBolt', 260, 11, 1450);
        }
      }

      if (type === 'mummy' || type === 'mummy_giant') {
        this.physics.velocityFromRotation(angle, speed * 0.65, enemy.body.velocity);
      }

      if (type === 'serpent') {
        const orbit = Math.sin(time / 350 + (enemy.getData('phase') || 0)) * 1.2;
        this.physics.velocityFromRotation(angle + orbit, speed * 0.8, enemy.body.velocity);
        this.enemyShoot(enemy, target, 'venom', 230, 13, 1650);
      }

      if (type === 'slime_green') {
        this.physics.velocityFromRotation(angle, speed * 0.7, enemy.body.velocity);
        this.updateSlimeSplit(enemy, time);
      }

      if (type === 'golem_fragment') {
        let wanderAngle = enemy.getData('wanderAngle');
        const wanderUntil = enemy.getData('wanderUntil') || 0;
        if (wanderAngle === undefined || time > wanderUntil) {
          wanderAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          enemy.setData('wanderAngle', wanderAngle);
          enemy.setData('wanderUntil', time + Phaser.Math.Between(800, 1800));
        }
        this.physics.velocityFromRotation(wanderAngle, speed * 0.6, enemy.body.velocity);
      }

      if (type === 'sand_spirit') {
        this.physics.velocityFromRotation(angle, speed * 0.5, enemy.body.velocity);
      }

      if (type === 'guardian') {
        enemy.setVelocity(0, 0);
      }
    });
  }

  /**
   * El limo verde se parte en dos si lo dejas vivo. Cada generacion es mas
   * chica y mas debil, pero el conteo crece: la presion es el reloj, no el dano.
   */
  updateSlimeSplit(enemy, time) {
    const splitAt = enemy.getData('splitAt') || 0;
    if (splitAt === 0 || time < splitAt) return;

    const generation = enemy.getData('generation') || 0;
    const maxGeneration = enemy.getData('maxGeneration') ?? 2;

    if (generation >= maxGeneration) {
      enemy.setData('splitAt', 0);
      return;
    }

    enemy.setData('splitAt', 0);
    getAudio(this)?.playSfx('split');

    const childScale = Math.max(0.45, 1 - (generation + 1) * 0.25);
    [-1, 1].forEach((direction) => {
      const child = this.spawnEnemy('slime_green', enemy.x + direction * 18, enemy.y, {
        hp: Math.max(14, Math.round((enemy.getData('maxHp') || 45) * 0.55)),
        generation: generation + 1,
        maxGeneration,
        coinDrop: 1
      });
      child.setScale(childScale);
      child.body.setSize(child.body.width * childScale, child.body.height * childScale);
      this.physics.velocityFromRotation(direction > 0 ? 0 : Math.PI, 120, child.body.velocity);
    });

    const puff = this.add.image(enemy.x, enemy.y, 'explosionRing').setDepth(25).setTint(0x63c46a);
    this.tweens.add({ targets: puff, scale: 1.3, alpha: 0, duration: 300, onComplete: () => puff.destroy() });

    this.disableSprite(enemy);
  }

  enemyShoot(enemy, target, texture, projectileSpeed, damage, cooldown) {
    const now = this.time.now;
    const nextShot = enemy.getData('nextShotAt') || 0;
    if (now < nextShot || !target) return;

    enemy.setData('nextShotAt', now + cooldown + Phaser.Math.Between(-250, 350));

    const projectile = this.enemyProjectiles.get(enemy.x, enemy.y, texture);
    if (!projectile) return;

    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
    projectile.setActive(true).setVisible(true).setDepth(16);
    projectile.body.enable = true;
    projectile.body.setAllowGravity(false);
    projectile.setData({ bornAt: now, ttl: 2400, damage });
    this.physics.velocityFromRotation(angle, projectileSpeed, projectile.body.velocity);
  }

  updateProjectiles(time) {
    this.enemyProjectiles.children.each((projectile) => {
      if (!projectile.active) return;
      const bornAt = projectile.getData('bornAt') || time;
      const ttl = projectile.getData('ttl') || 2000;
      if (time - bornAt > ttl) {
        this.disableSprite(projectile);
      }
    });
  }

  handleArrowEnemy(arrow, enemy) {
    if (!arrow.active || !enemy.active) return;

    const shieldFacing = enemy.getData('shieldFacing');
    if (shieldFacing !== undefined) {
      const shieldArc = enemy.getData('shieldArc') || 1.1;
      const originAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, arrow.x, arrow.y);
      const blocked = Math.abs(Phaser.Math.Angle.Wrap(originAngle - shieldFacing)) < shieldArc;
      if (blocked) {
        this.disableSprite(arrow);
        return;
      }
    }

    const run = getRun(this);
    const damage = arrow.getData('damage') || 20;
    const vulnerableSkills = enemy.getData('vulnerableSkills');
    const immune = vulnerableSkills && !vulnerableSkills.some((skill) => run.skills.includes(skill));

    if (!immune) {
      this.damageEnemy(enemy, damage);
    }

    const canBurn = !vulnerableSkills || vulnerableSkills.includes('fire');
    if (canBurn && run.skills.includes('fire')) {
      this.applyBurn(enemy, 3, Math.max(4, Math.round(damage * 0.22)));
    }

    const canSlow = !vulnerableSkills || vulnerableSkills.includes('ice');
    if (canSlow && run.skills.includes('ice')) {
      enemy.setData('slowUntil', this.time.now + 2000);
    }

    if (run.skills.includes('explosive')) {
      this.explodeAt(enemy.x, enemy.y, Math.max(8, Math.round(damage * 0.55)));
    }

    if (run.skills.includes('electric')) {
      this.chainLightning(enemy, Math.max(7, Math.round(damage * 0.45)));
    }

    if (run.skills.includes('piercing')) {
      const hits = (arrow.getData('hits') || 0) + 1;
      arrow.setData('hits', hits);
      if (hits >= 3) this.disableSprite(arrow);
    } else {
      this.disableSprite(arrow);
    }
  }

  canDamageEnemy(enemy, originX, originY) {
    const shieldFacing = enemy.getData('shieldFacing');
    if (shieldFacing !== undefined) {
      const shieldArc = enemy.getData('shieldArc') || 1.1;
      const originAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, originX, originY);
      if (Math.abs(Phaser.Math.Angle.Wrap(originAngle - shieldFacing)) < shieldArc) {
        return false;
      }
    }

    const vulnerableSkills = enemy.getData('vulnerableSkills');
    if (vulnerableSkills) {
      const run = getRun(this);
      if (!vulnerableSkills.some((skill) => run.skills.includes(skill))) {
        return false;
      }
    }

    return true;
  }

  damageEnemy(enemy, amount) {
    if (!enemy.active) return;
    const invulnerableUntil = enemy.getData('invulnerableUntil') || 0;
    if (this.time.now < invulnerableUntil) return;

    const minHp = enemy.getData('minHp') || 0;
    const rawHp = (enemy.getData('hp') || 1) - amount;
    const hp = minHp > 0 ? Math.max(rawHp, minHp) : rawHp;
    enemy.setData('hp', hp);
    enemy.setTint(0xfff2a8);
    this.time.delayedCall(80, () => enemy.active && this.resetEnemyTint(enemy));
    getAudio(this)?.playSfx('hit');

    if (minHp > 0 && rawHp <= minHp) {
      this.events.emit('enemyHpFloor', enemy);
      return;
    }

    if (hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  resetEnemyTint(enemy) {
    const baseTint = enemy.getData('baseTint');
    if (baseTint) {
      enemy.setTint(baseTint);
    } else {
      enemy.clearTint();
    }
  }

  applyBurn(enemy, ticks, tickDamage) {
    for (let i = 1; i <= ticks; i += 1) {
      this.time.delayedCall(i * 1000, () => {
        if (enemy.active) {
          enemy.setTint(0xff5d2a);
          this.damageEnemy(enemy, tickDamage);
          this.time.delayedCall(90, () => enemy.active && this.resetEnemyTint(enemy));
        }
      });
    }
  }

  explodeAt(x, y, damage) {
    const ring = this.add.image(x, y, 'explosionRing').setDepth(25).setAlpha(0.9);
    this.tweens.add({
      targets: ring,
      scale: 1.6,
      alpha: 0,
      duration: 260,
      onComplete: () => ring.destroy()
    });

    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= 64 && this.canDamageEnemy(enemy, x, y)) {
        this.damageEnemy(enemy, damage);
      }
    });
  }

  chainLightning(originEnemy, damage) {
    const chained = this.enemies.children.entries
      .filter((enemy) => enemy.active && enemy !== originEnemy)
      .map((enemy) => ({ enemy, d: Phaser.Math.Distance.Between(originEnemy.x, originEnemy.y, enemy.x, enemy.y) }))
      .filter((item) => item.d <= 180)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);

    chained.forEach(({ enemy }) => {
      if (!this.canDamageEnemy(enemy, originEnemy.x, originEnemy.y)) return;
      const line = this.add.line(0, 0, originEnemy.x, originEnemy.y, enemy.x, enemy.y, 0x9fe8ff, 0.9)
        .setOrigin(0, 0)
        .setDepth(30);
      this.tweens.add({ targets: line, alpha: 0, duration: 160, onComplete: () => line.destroy() });
      this.damageEnemy(enemy, damage);
    });
  }

  killEnemy(enemy) {
    const type = enemy.getData('type') || 'spider';
    const run = getRun(this);
    const stats = getDerivedStats(run);
    const score = ENEMY_SCORE[type] || 10;
    const coinDrop = enemy.getData('coinDrop');
    const effectiveDrop = coinDrop === undefined ? 1 : coinDrop;

    if (effectiveDrop > 0) {
      const coinCount = Math.max(1, Math.round(effectiveDrop * stats.luckMultiplier));
      this.spawnCoins(enemy.x, enemy.y, coinCount);
    }

    addScore(this, score);
    this.enemyKills += 1;
    this.disableSprite(enemy);
    this.checkLevelCompletion();
  }

  // --- Recolectables ----------------------------------------------------

  spawnCoins(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      const coin = this.coins.get(x + Phaser.Math.Between(-14, 14), y + Phaser.Math.Between(-14, 14), 'coin');
      if (!coin) return;
      coin.setActive(true).setVisible(true).setDepth(14);
      coin.body.enable = true;
      coin.body.setAllowGravity(false);
      coin.setData('value', 1);
      coin.setBounce(0.4);
      coin.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(-40, 40));
      this.time.delayedCall(280, () => coin.active && coin.setVelocity(0, 0));
    }
  }

  spawnCoinCache(x, y, count = 5, value = 1) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const radius = Phaser.Math.Between(10, 28);
      const coin = this.coins.get(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 'coin');
      if (!coin) return;
      coin.setActive(true).setVisible(true).setDepth(14);
      coin.body.enable = true;
      coin.body.setAllowGravity(false);
      coin.setData('value', value);
      coin.setVelocity(0, 0);
    }
  }

  collectCoin(player, coin) {
    if (!coin.active || player.getData('down')) return;
    const value = coin.getData('value') || 1;
    addCoins(this, value);
    addScore(this, value);
    this.disableSprite(coin);
    getAudio(this)?.playSfx('coin');
  }

  /** Corazon de emergencia: aparece cuando un jugador cruza el 50% de vida. */
  spawnHeart(x, y) {
    const heart = this.hearts.get(x, y, 'heart');
    if (!heart) return null;

    heart.setActive(true).setVisible(true).setDepth(19).setAlpha(1);
    heart.body.enable = true;
    heart.body.setAllowGravity(false);
    heart.setVelocity(0, 0);

    this.tweens.add({ targets: heart, y: y - 6, yoyo: true, repeat: -1, duration: 620 });
    this.tweens.add({ targets: heart, scale: 1.18, yoyo: true, repeat: -1, duration: 420 });

    return heart;
  }

  collectHeart(player, heart) {
    if (!heart.active || player.getData('down')) return;

    const run = getRun(this);
    const amount = Math.round(run.hpMax * HEART_HEAL_RATIO);
    const { healed } = healPlayer(this, amount, this.getPlayerIndex(player));

    this.tweens.killTweensOf(heart);
    this.disableSprite(heart);
    getAudio(this)?.playSfx('heart');

    const floating = this.add.text(player.x, player.y - 30, `+${healed}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#8dffa1',
      stroke: '#0d3313',
      strokeThickness: 3
    }).setDepth(80).setOrigin(0.5);
    this.tweens.add({ targets: floating, y: floating.y - 26, alpha: 0, duration: 620, onComplete: () => floating.destroy() });
  }

  /** Arbustos de cobertura repartidos por zonas transitables del mapa. */
  spawnBushes(count, options = {}) {
    const points = this.getRandomSafePoints(count, {
      margin: 120,
      minDistanceFromPlayer: 130,
      minDistanceBetween: 78,
      ...options
    });

    points.forEach(({ x, y }) => {
      const bush = this.bushes.create(x, y, 'bush').setDepth(11);
      bush.body.setSize(24, 16);
    });

    return points.length;
  }

  // --- Dano al jugador --------------------------------------------------

  handlePlayerEnemy(player, enemy) {
    if (!enemy.active || player.getData('down')) return;
    const type = enemy.getData('type');
    this.applyDamageToPlayer(enemy.getData('touchDamage') || 10, player);

    if (type === 'mummy') {
      player.setData('cursedUntil', this.time.now + 2000);
      player.setData('curseFactor', 0.55);
    }
    if (type === 'mummy_giant') {
      player.setData('cursedUntil', this.time.now + 3200);
      player.setData('curseFactor', 0.4);
    }
  }

  handlePlayerProjectile(player, projectile) {
    if (player.getData('down')) return;
    const damage = projectile.getData('damage') || 10;
    this.applyDamageToPlayer(damage, player);
    this.disableSprite(projectile);
  }

  /**
   * @param {number} amount dano crudo, antes de armadura.
   * @param {Phaser.GameObjects.Sprite} [player] por defecto el jugador 1, para
   *        que el codigo de jefes escrito antes del co-op siga funcionando.
   */
  applyDamageToPlayer(amount, player = this.players[0]) {
    if (!player || this.levelFinished || player.getData('down')) return;

    const now = this.time.now;
    if (now < (player.getData('nextDamageAt') || 0) || this.isPlayerDashing(player)) return;

    const index = this.getPlayerIndex(player);
    const { finalDamage, justDowned, crossedHalf } = damagePlayer(this, amount, index);
    if (finalDamage <= 0) return;

    player.setData('nextDamageAt', now + 650);
    player.setTint(0xff5b5b);
    this.cameras.main.shake(120, 0.006);
    this.time.delayedCall(120, () => {
      if (player.active && !player.getData('down')) player.clearTint();
    });
    getAudio(this)?.playSfx('damage');

    const floating = this.add.text(player.x, player.y - 28, `-${finalDamage}`, {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffdddd',
      stroke: '#3b0000',
      strokeThickness: 3
    }).setDepth(80).setOrigin(0.5);
    this.tweens.add({ targets: floating, y: floating.y - 24, alpha: 0, duration: 500, onComplete: () => floating.destroy() });

    // Cada vez que la vida cruza el 50% hacia abajo aparece un corazon cerca.
    if (crossedHalf) {
      const drop = this.getRandomSafePoint({ margin: 90, minDistanceFromPlayer: 0, attempts: 40 })
        || { x: player.x + 60, y: player.y };
      const near = Phaser.Math.Distance.Between(drop.x, drop.y, player.x, player.y) > 320
        ? { x: player.x + Phaser.Math.Between(-70, 70), y: player.y + Phaser.Math.Between(-70, 70) }
        : drop;
      this.spawnHeart(near.x, near.y);
      this.showObjective('Vida por debajo del 50%: apareció un corazón cerca tuyo.', { delay: 2600 });
    }

    if (justDowned) {
      this.downPlayer(player);
    }
  }

  /** Dano en area que alcanza a todos los jugadores dentro del radio. */
  damagePlayersInRadius(x, y, radius, amount) {
    this.getActivePlayers().forEach((player) => {
      if (Phaser.Math.Distance.Between(x, y, player.x, player.y) <= radius) {
        this.applyDamageToPlayer(amount, player);
      }
    });
  }

  // --- Enemigos: creacion ----------------------------------------------

  spawnEnemy(type, x, y, extraData = {}) {
    const texture = {
      spider: 'spider',
      scorpion: 'scorpion',
      scorpion_elite: 'scorpion',
      mummy: 'mummy',
      serpent: 'serpent',
      mummy_giant: 'mummy',
      slime_green: 'slime',
      boss_golem: 'golem',
      golem_fragment: 'golem',
      sand_spirit: 'spirit',
      guardian: 'guardian',
      boss_king_scorpion: 'kingScorpion'
    }[type] || 'spider';

    const data = {
      spider: { hp: 35, speed: 95, touchDamage: 8, coinDrop: 1 },
      scorpion: { hp: 55, speed: 70, touchDamage: 10, coinDrop: 2 },
      scorpion_elite: { hp: 110, speed: 75, touchDamage: 14, coinDrop: 4 },
      mummy: { hp: 80, speed: 70, touchDamage: 12, coinDrop: 2 },
      serpent: { hp: 62, speed: 105, touchDamage: 10, coinDrop: 2 },
      mummy_giant: { hp: 200, speed: 55, touchDamage: 16, coinDrop: 5 },
      slime_green: { hp: 45, speed: 78, touchDamage: 9, coinDrop: 2, splitDelay: 7000, generation: 0, maxGeneration: 2 },
      boss_golem: { hp: 900, speed: 60, touchDamage: 14, coinDrop: 0 },
      golem_fragment: { hp: 150, speed: 65, touchDamage: 12, coinDrop: 0 },
      sand_spirit: { hp: 40, speed: 55, touchDamage: 10, coinDrop: 0, vulnerableSkills: ['electric', 'explosive'] },
      guardian: { hp: 300, speed: 0, touchDamage: 18, coinDrop: 4, shieldArc: 1.1 },
      boss_king_scorpion: { hp: 1400, speed: 50, touchDamage: 20, coinDrop: 0 }
    }[type] || { hp: 35, speed: 85, touchDamage: 8, coinDrop: 1 };

    const enemy = this.enemies.create(x, y, texture)
      .setDepth(15)
      .setCollideWorldBounds(true);
    enemy.body.setAllowGravity(false);

    const merged = { ...data, ...extraData };
    enemy.setData({
      type,
      ...merged,
      maxHp: merged.hp,
      phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      slowUntil: 0,
      nextShotAt: this.time.now + Phaser.Math.Between(600, 1600)
    });

    if (type === 'slime_green') {
      enemy.setData('splitAt', this.time.now + (merged.splitDelay || 7000));
    }

    const visual = ELITE_VISUALS[type];
    if (visual) {
      enemy.setScale(visual.scale);
      enemy.body.setSize(enemy.body.width * visual.scale, enemy.body.height * visual.scale);
      if (visual.tint) {
        enemy.setData('baseTint', visual.tint);
        enemy.setTint(visual.tint);
      }
      if (visual.alpha !== undefined) {
        enemy.setAlpha(visual.alpha);
      }
    }

    if (type === 'guardian' && enemy.getData('shieldFacing') !== undefined) {
      enemy.setRotation(enemy.getData('shieldFacing'));
    }

    this.totalEnemiesSpawned += 1;
    return enemy;
  }

  spawnEnemiesFromMap(types = []) {
    const allowed = new Set(types);
    this.objects.forEach((object) => {
      const type = object.type || object.name;
      if (allowed.has(type)) {
        this.spawnEnemy(type, object.x, object.y);
      }
    });
  }

  spawnGuardiansFromMap() {
    this.findObjects('guardian').forEach((object) => {
      this.spawnEnemy('guardian', object.x, object.y, {
        shieldFacing: Phaser.Math.DegToRad(object.rotation || 0)
      });
    });
  }

  // --- Consultas del mapa ----------------------------------------------

  findObject(name) {
    return this.objects.find((object) => object.name === name || object.type === name);
  }

  findObjects(nameOrType) {
    return this.objects.filter((object) => object.name === nameOrType || object.type === nameOrType);
  }

  findNearestEnemy(x, y, maxDistance) {
    let nearest = null;
    let nearestDistance = maxDistance;
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = enemy;
      }
    });
    return nearest;
  }

  getRandomSafePoint(options = {}) {
    const {
      margin = 96,
      minDistanceFromPlayer = 160,
      attempts = 80,
      avoidDanger = true
    } = options;

    for (let i = 0; i < attempts; i += 1) {
      const x = Phaser.Math.Between(margin, this.map.widthInPixels - margin);
      const y = Phaser.Math.Between(margin, this.map.heightInPixels - margin);
      if (this.isPointSafe(x, y, avoidDanger) && this.isFarEnoughFromPlayer(x, y, minDistanceFromPlayer)) {
        return { x, y };
      }
    }

    return null;
  }

  getRandomSafePoints(count, options = {}) {
    const points = [];
    const minDistanceBetween = options.minDistanceBetween || 120;
    const attempts = options.attempts || count * 90;

    for (let i = 0; i < attempts && points.length < count; i += 1) {
      const point = this.getRandomSafePoint({ ...options, attempts: 1 });
      if (!point) continue;
      const tooClose = points.some((other) => Phaser.Math.Distance.Between(point.x, point.y, other.x, other.y) < minDistanceBetween);
      if (!tooClose) {
        points.push(point);
      }
    }

    return points;
  }

  /** Distancia minima respecto de TODOS los jugadores presentes. */
  isFarEnoughFromPlayer(x, y, minDistance) {
    if (minDistance <= 0) return true;
    const list = this.players.filter((player) => player && player.active);
    if (list.length === 0) return true;
    return list.every((player) => Phaser.Math.Distance.Between(x, y, player.x, player.y) >= minDistance);
  }

  isPointSafe(x, y, avoidDanger = true) {
    const tileX = Math.floor(x / this.map.tileWidth);
    const tileY = Math.floor(y / this.map.tileHeight);
    return !this.hasSolidTile(this.wallsLayer, tileX, tileY) &&
      (!avoidDanger || !this.hasSolidTile(this.dangerLayer, tileX, tileY));
  }

  hasSolidTile(layer, tileX, tileY) {
    if (!layer || tileX < 0 || tileY < 0 || tileX >= this.map.width || tileY >= this.map.height) {
      return false;
    }

    const tile = layer.getTileAt(tileX, tileY);
    return Boolean(tile && tile.index > 0);
  }

  // --- Zonas de peligro -------------------------------------------------

  createDangerZoneDamage(damage, cooldown, warningText) {
    if (!this.dangerLayer) return;
    this.dangerLayer.setCollisionByExclusion([-1, 0]);
    this.dangerZoneDamage = damage;
    this.dangerZoneCooldown = cooldown;
    this.dangerZoneWarningMessage = warningText;
    this.dangerZoneWarningText = this.add.text(480, 156, '', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '20px',
      color: '#ffcf8a',
      stroke: '#4f1008',
      strokeThickness: 4
    }).setScrollFactor(0).setOrigin(0.5).setDepth(1100).setAlpha(0);
  }

  updateDangerZoneDamage(time) {
    if (!this.dangerLayer || this.levelFinished) return;

    let anyNear = false;
    this.getActivePlayers().forEach((player) => {
      if (!this.isPlayerNearDangerZone(player)) return;
      anyNear = true;
      const nextAt = player.getData('nextDangerAt') || 0;
      if (time < nextAt) return;
      player.setData('nextDangerAt', time + this.dangerZoneCooldown);
      this.applyDamageToPlayer(this.dangerZoneDamage, player);
    });

    if (this.dangerZoneWarningText) {
      this.dangerZoneWarningText.setText(anyNear ? this.dangerZoneWarningMessage : '');
      this.dangerZoneWarningText.setAlpha(anyNear ? 1 : 0);
    }
  }

  isPlayerNearDangerZone(player = this.players[0], proximity = 10) {
    if (!player || !this.dangerLayer) return false;
    const body = player.body;
    const tileWidth = this.map.tileWidth;
    const tileHeight = this.map.tileHeight;
    const bounds = {
      left: body.x - proximity,
      right: body.x + body.width + proximity,
      top: body.y - proximity,
      bottom: body.y + body.height + proximity
    };

    const minTileX = Math.max(0, Math.floor(bounds.left / tileWidth));
    const maxTileX = Math.min(this.map.width - 1, Math.floor(bounds.right / tileWidth));
    const minTileY = Math.max(0, Math.floor(bounds.top / tileHeight));
    const maxTileY = Math.min(this.map.height - 1, Math.floor(bounds.bottom / tileHeight));

    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
        const tile = this.dangerLayer.getTileAt(tileX, tileY);
        if (tile && tile.index > 0 && this.isBodyNearTile(body, tileX, tileY, proximity)) {
          return true;
        }
      }
    }

    return false;
  }

  isBodyNearTile(body, tileX, tileY, proximity = 10) {
    const tileLeft = tileX * this.map.tileWidth;
    const tileRight = tileLeft + this.map.tileWidth;
    const tileTop = tileY * this.map.tileHeight;
    const tileBottom = tileTop + this.map.tileHeight;
    const bodyRight = body.x + body.width;
    const bodyBottom = body.y + body.height;
    const dx = Math.max(tileLeft - bodyRight, body.x - tileRight, 0);
    const dy = Math.max(tileTop - bodyBottom, body.y - tileBottom, 0);

    return Math.hypot(dx, dy) <= proximity;
  }

  // --- Cierre del nivel -------------------------------------------------

  createPortal(nextCallback, position = null) {
    if (this.portal) return;
    const portalObj = position || this.findObject('portal') || { x: this.map.widthInPixels - 100, y: this.map.heightInPixels / 2 };
    this.portal = this.physics.add.sprite(portalObj.x, portalObj.y, 'portal')
      .setDepth(12)
      .setAlpha(0.88);
    this.portal.body.setAllowGravity(false);
    this.portal.body.setImmovable(true);

    this.tweens.add({
      targets: this.portal,
      alpha: 0.45,
      scale: 1.08,
      yoyo: true,
      repeat: -1,
      duration: 550
    });

    this.add.text(portalObj.x, portalObj.y - 58, 'Salida', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#fff2a6',
      stroke: '#2a160d',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(40);

    this.physics.add.overlap(this.playerGroup, this.portal, (player) => {
      if (!this.levelFinished && !player.getData('down')) nextCallback();
    });
  }

  /**
   * Estrella 1: completar el nivel.
   * Estrella 2: terminar con mas del 50% de vida de equipo.
   * Estrella 3: no dejar ningun enemigo vivo.
   *
   * La tercera se mide por enemigos VIVOS y no por "kills == spawns" porque hay
   * enemigos que desaparecen sin morir: el limo verde se parte en dos, y el
   * Coloso se fragmenta. Contando kills, esa estrella seria inalcanzable en
   * cuanto un limo se duplicara.
   */
  hasClearedAllEnemies() {
    return this.totalEnemiesSpawned > 0 && this.enemies.countActive(true) === 0;
  }

  computeStars() {
    const run = getRun(this);
    let stars = 1;
    if (getPartyHealthRatio(run) > 0.5) stars += 1;
    if (this.hasClearedAllEnemies()) stars += 1;
    return stars;
  }

  showStarResult(stars) {
    const panel = this.add.rectangle(480, 250, 300, 120, 0x21160f, 0.92)
      .setScrollFactor(0).setDepth(1200).setStrokeStyle(2, 0xf1c27d, 0.95);

    const label = this.add.text(480, 214, 'NIVEL COMPLETADO', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffd27f'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1201);

    const icons = [0, 1, 2].map((i) => this.add.image(
      440 + i * 40,
      262,
      i < stars ? 'starFull' : 'starEmpty'
    ).setScrollFactor(0).setDepth(1201).setScale(0));

    icons.forEach((icon, i) => {
      this.tweens.add({
        targets: icon,
        scale: 1.4,
        delay: 120 + i * 130,
        duration: 200,
        yoyo: true,
        hold: 60,
        onStart: () => { if (i < stars) getAudio(this)?.playSfx('star'); },
        onComplete: () => icon.setScale(1.15)
      });
    });

    return [panel, label, ...icons];
  }

  completeLevel(callback) {
    if (this.levelFinished) return;
    this.levelFinished = true;

    const run = getRun(this);
    const stars = this.computeStars();
    recordLevelResult(this, this.levelNumber, stars, run.score);

    getAudio(this)?.playSfx('levelup');
    this.showStarResult(stars);

    this.time.delayedCall(1250, () => {
      this.scene.stop('UIScene');
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(360, callback);
    });
  }

  gameOver() {
    if (this.levelFinished) return;
    this.levelFinished = true;
    const run = getRun(this);
    this.scene.stop('UIScene');
    this.cameras.main.fadeOut(350, 80, 0, 0);
    getAudio(this)?.playSfx('death');
    this.time.delayedCall(360, () => this.scene.start('GameOverScene', { run }));
  }

  disableSprite(sprite) {
    sprite.setActive(false).setVisible(false);
    if (sprite.body) {
      sprite.body.stop();
      sprite.body.enable = false;
    }
  }

  checkLevelCompletion() {
    // Lo implementa cada nivel concreto.
  }
}
