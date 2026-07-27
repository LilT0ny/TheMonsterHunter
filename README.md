# The Monster Hunter — MVP funcional en Phaser 3 + Tiled

Este proyecto implementa una versión jugable y entregable del diseño de **The Monster Hunter** usando **Phaser 3**, escenas modulares y mapas JSON compatibles con **Tiled**.

## Cómo ejecutar

No abras `index.html` con doble clic, porque los módulos ES y los mapas JSON necesitan un servidor local. El proyecto corre desde la **raíz de este repo** (no existe una carpeta `monster-hunter-phaser/`).

```bash
python3 -m http.server 8080
```

Luego abre:

```text
http://localhost:8080
```

En Windows, si tienes Python instalado:

```bash
py -m http.server 8080
```

## Controles

### Jugador 1

- **WASD** o **flechas** (las flechas solo cuando juegas solo): mover al arquero.
- **Mouse**: el arco apunta siempre hacia el cursor.
- **Click izquierdo** o **ESPACIO**: disparar. Se puede mantener apretado para disparar en ráfaga.
- **SHIFT**: salto/dash — cruza muros bajos (`lowwalls`) y otorga inmunidad breve al daño.

### Jugador 2 (co-op)

- **Flechas**: mover.
- **ENTER**: disparar (apunta hacia donde se está desplazando).
- **CTRL**: salto/dash.

### Generales

- **F**: activa o desactiva el **autodisparo**. Con él encendido el arco apunta solo al enemigo más cercano dentro de 430 px y dispara sin que toques nada. La preferencia queda guardada en el perfil y el HUD muestra un distintivo `AUTO` mientras está activo.
- **ESC** o **P**: pausa. Desde el menú de pausa se reanuda, se reinicia el nivel o se vuelve al menú principal.
- **Botón PAUSA** en la esquina superior derecha del HUD: lo mismo, con el mouse.
- **Último en pie**: cuando queda un solo jugador activo — porque juegas solo, o porque tu compañero cayó — ese jugador responde a **los dos esquemas de teclas** (WASD *y* flechas, ESPACIO *y* ENTER, SHIFT *y* CTRL) y al mouse. Si no, al caer J1 el sobreviviente se quedaba sin WASD y parecía que el juego había dejado de responder.

## Progreso guardado

Hay **dos estados distintos** y viven en módulos distintos porque tienen ciclos de vida distintos:

| Estado | Módulo | Qué contiene | Cuándo se pierde |
| --- | --- | --- | --- |
| `run` | `src/core/runState.js` | Vida de cada jugador, monedas, score, habilidades, mejoras | Al morir (es un roguelike) |
| `profile` | `src/core/profile.js` | Estrellas por nivel, niveles desbloqueados, mejor score, si ya viste la intro | Nunca, salvo que lo borres a mano |

Ambos se persisten en `localStorage`:

- `tmh_profile_v1` — el perfil permanente.
- `tmh_save_v1` — la partida en curso. Se escribe **al entrar a cada nivel**, así que "Continuar" del menú te devuelve al comienzo del nivel donde estabas, incluso si cerraste el navegador.
- `tmh_audio_muted` — preferencia de sonido.

Morir borra `tmh_save_v1` (la run terminó) pero **no toca el perfil**: las estrellas y los niveles desbloqueados quedan. El botón *Borrar progreso guardado* del menú limpia todo, y pide confirmación tocándolo dos veces.

## Estrellas

Cada nivel otorga hasta 3 estrellas (30 en total). Las estrellas **nunca bajan**: si ya sacaste 3 y vuelves a pasar con 1, conservas las 3.

1. ⭐ Completar el nivel.
2. ⭐ Terminar con más del 50% de vida de equipo.
3. ⭐ No dejar ningún enemigo vivo.

La tercera se mide por **enemigos vivos** y no por "kills == apariciones", porque hay enemigos que desaparecen sin morir: el limo verde se parte en dos y el Coloso se fragmenta. Contando kills, esa estrella sería inalcanzable en cuanto un limo se duplicara.

El HUD muestra las tres estrellas en vivo, así que en todo momento sabes cuáles sigues cumpliendo. El menú de pausa las lista con su descripción.

## Co-op de 2 jugadores

- El compañero se ofrece **al morir**, en la pantalla de Game Over: el botón *"Reintentar con un compañero (2 jugadores)"* arranca la nueva partida con los dos arqueros desde el Nivel 1. Es el momento en que la ayuda realmente hace falta.
- Los dos comparten score, monedas, habilidades y mejoras: la run es una sola. Lo que **no** comparten es la vida — cada uno tiene su barra.
- La cámara sigue el punto medio entre ambos y se abre (zoom hasta 0.64) cuando se separan, para que ninguno quede fuera de cuadro. La apertura se mide **solo entre jugadores en pie**: si uno cae, la cámara vuelve a zoom 1 y sigue directamente al que queda, en vez de estirarse hasta un cuerpo que ya no se mueve.
- Los enemigos y los dos jefes apuntan al **jugador vivo más cercano**, no siempre a J1.
- Si un jugador cae, el otro lo **reanima** quedándose a su lado ~2,4 s (vuelve con el 50% de vida). El Game Over solo llega cuando caen los dos.
- El jugador que entra tiene 2 s de invulnerabilidad, porque aparece al lado de su compañero y ese suele estar en pleno combate.

Detalle de implementación: las colisiones están registradas contra un **grupo de físicas** (`this.playerGroup`), no contra sprites sueltos. Por eso un jugador que entra a mitad de nivel queda operativo sin registrar nada nuevo. `this.player` sigue existiendo como alias del jugador 1, así el código escrito antes del co-op no se rompió.

## Sonido

El juego no usa ningún archivo de audio — **todo el sonido es procedural**, sintetizado en el momento con la Web Audio API (`src/core/audio.js`, clase `AudioManager`), misma filosofía que ya usan los sprites en `PreloadScene.js` (dibujados por código en vez de cargados desde PNG).

- **Música**: un mood distinto por tramo — `calm` (Niveles 1-4), `tense` (Niveles 6-9) y `boss` (Boss 5 y Boss 10, que sube de intensidad al entrar en cada fase nueva) — más `gameover` al morir. `VictoryScene` no tiene música propia y hace fade-out.
- **SFX**: disparo, impacto, daño recibido, moneda, muerte, subir de nivel, activar habilidad, entrada de fase de boss, corazón, caída y reanimación de un jugador, división del limo, estrella conseguida, entrada del jugador 2, pausa y despausa.
- **Foley**: viento constante de fondo en todo nivel, pasos al moverse (alternando pie izquierdo/derecho), tormenta de arena en el Nivel 4, crujido de piedra en los slams del Boss 5 y rugido del Boss 10 en sus cambios de fase.
- El bus de SFX está en **0.72** y el disparo se armó en cuatro capas (chasquido de cuerda, cuerpo tonal, golpe y silbido). Antes el bus estaba en 0.5 con el disparo a 0.16 y el paso a 0.05, o sea 0.08 y 0.025 de volumen real: técnicamente sonaban, en la práctica eran inaudibles.
- Los navegadores bloquean el audio hasta el primer click/tecla — el `AudioContext` se resume automáticamente al primer gesto en `MenuScene`.
- Hay un botón de mute persistente (`localStorage`) en el menú, y un punto de color en el HUD durante el juego (verde = sonido activo, rojo = mute).

## Curva de dificultad

A medida que avanzás acumulás habilidades y mejoras, así que matar deja de costar. Por eso la presión **no** viene del aguante de cada enemigo sino de cuántos hay (`DIFFICULTY` en `config.js`):

- **Cantidad**: cada nivel suma refuerzos proporcionales a los enemigos que él mismo define, más un extra fijo, con techo de 10 para que la pantalla siga siendo legible. Nivel 1 no suma nada; el Nivel 9 llega a ~22 enemigos.
- **Vida**: sube apenas un 8% por nivel. No queremos esponjas de daño, queremos multitud. **Los jefes quedan afuera** de este escalado: ya tienen fases diseñadas y multiplicar su HP solo alargaría la pelea.
- Los refuerzos también suben `requiredKills`: si no, el portal se abriría sin haber tocado a ninguno.
- Cada nivel tiene su propia fauna de refuerzos en `REINFORCEMENT_POOLS` — nada de serpientes voladoras en el desierto inicial.

## Arenas de jefe

Los jefes ya no pelean solos (`BOSS_ARENA_WAVES` en `config.js`):

- **Boss 5**: arranca con 4 escorpiones y arañas, y llega una oleada de 3 cada 12 s, con techo de 10 vivos.
- **Boss 10**: arranca con 5 escorpiones y serpientes, oleada de 4 cada 10 s, techo de 14 — además de los refuerzos que el propio Rey invoca en su fase 2.
- El oleaje **se corta al caer el jefe**. Sin eso la arena nunca se vaciaría y la tercera estrella ("no dejar ningún enemigo vivo") sería imposible de conseguir.

## Arma y proyectiles

- El **arco es un sprite propio** (`bow` / `bow2`) que orbita al jugador y rota hacia donde apunta. Antes estaba pintado sobre el cuerpo del arquero, y un arma pintada sobre el cuerpo no puede apuntar a ningún lado.
- La **flecha** se dibuja con punta brillante, astil y plumas (30×11 px). Antes era un rectángulo plano de 22×5.
- Cada disparo produce un **fogonazo** en la punta del arco, y cada flecha deja una **estela** que se desvanece, para que el tiro se lea en pantalla incluso a 500 px/s.
- Las flechas **se clavan en los muros** (`walls`) y sueltan una chispa breve. Siguen pasando por encima de los muros bajos (`lowwalls`), que es la mecánica del Nivel 3.
- La **moneda** es un disco con canto, anillo interior y rombo en relieve. Antes era un cuadrado plano de 15×15.
- Hay **una flecha por elemento** — `arrow`, `arrowFire`, `arrowIce`, `arrowElectric` — con su propio resplandor en la punta y su estela tintada. Si tenés varias habilidades manda la más vistosa (rayo > fuego > hielo), en vez de mezclar colores y que no se lea ninguna.

## Animación y arte

- El **arquero está animado**: `PreloadScene` genera una hoja de 5 fotogramas de 32×32 (uno quieto y un ciclo de caminata de 4) y registra los recortes a mano, porque `generateTexture` deja un único frame con la hoja entera. Las piernas alternan y el cuerpo sube un píxel en los pasos, que es lo que vende el movimiento.
- El mismo dibujo genera a J1 y a J2 con paletas distintas: un solo arte que mantener, no dos.
- Todos los **enemigos** se redibujaron con volumen: sombra en el suelo, luz y sombra propias, y detalles que antes no existían — patas articuladas en la araña, cola segmentada y placas en el escorpión, vendas con relieve en la momia, escamas y membrana alar en la serpiente, grietas encendidas y musgo en el Coloso, remaches y visor en el Guardián, corona de púas en el Rey Escorpión.
- Los **proyectiles enemigos** dejaron de ser cuadrados: `enemyBolt` es una descarga con núcleo claro y púas, `venom` una gota con brillo y goteo.
- Los **efectos elementales** tienen textura propia: `flame` (quemadura), `frost` (congelamiento) y `spark` (electricidad). La quemadura suelta tres llamitas por tic, el hielo estalla en cristales, y el rayo encadenado dibuja un **trazo quebrado** en vez de la línea recta que tenía antes.

## Qué incluye

- `MenuScene`: menú principal, continuar partida, nueva partida, acceso a la intro, grilla de 10 niveles con sus estrellas y candado en los bloqueados, contador de estrellas totales y borrado de progreso.
- `IntroScene`: explica de qué se trata el juego, cómo se juega, que es un roguelike, los criterios de las 3 estrellas y los controles de ambos jugadores. Se muestra sola la primera vez y queda accesible desde *Cómo se juega*.
- `PauseScene`: overlay de pausa con objetivos de estrella en vivo, reanudar, reiniciar nivel (desde el checkpoint, no desde el estado actual) y volver al menú.
- `Level1Scene`: desierto exterior, arañas, 16 **arbustos de cobertura** repartidos por el mapa, monedas, HP y Game Over.
- `AbilityScene`: elección de 1 de 3 habilidades aleatorias.
- `TiendaScene`: mejoras de salud, suerte, armadura, velocidad y daño. Al continuar cura y levanta a **todo el equipo**.
- `Level2Scene`: dunas errantes, escorpiones centinela, un escorpión de élite y 3 **limos verdes** que se parten en dos cada 7 s si los dejas vivos (hasta 2 generaciones: 1 → 2 → 4). Dejarlos vivos no te castiga con daño, te castiga con cantidad.
- `Level3Scene`: ruinas del oasis, muros bajos que solo se cruzan con el dash y una momia gigante.
- `Level4Scene`: tormenta de arena, 3 oleadas seguidas sin pausa y viñeta de visibilidad reducida.
- `Boss5Scene`: El Coloso de Piedra. Fase 1 (aproxima → telegrafía en rojo → aplasta en área → retrocede) hasta el 50% de HP; fase 2 lo fragmenta en 3 `golem_fragment` + 2 `sand_spirit` (solo dañables con flecha eléctrica o explosiva). El aplastamiento es daño en área y alcanza a los dos jugadores. Recompensa: 80 monedas + 2 elecciones de habilidad seguidas.
- `Level6Scene`: catacumbas ardientes, lava con daño cada 500 ms, plataformas móviles y oleadas cronometradas.
- `Level7Scene`: laberinto de huesos, mapa tallado a mano con un corredor angosto donde se dispara una emboscada de serpientes por ambos extremos.
- `Level8Scene`: fortaleza olvidada, 2 `guardian` estacionarios con escudo frontal direccional + escorpiones de élite como arqueros.
- `Level9Scene`: el corazón del desierto, combina todo el bestiario + zonas de trampa + una oleada final mezclada antes del portal.
- `Boss10Scene`: El Rey Escorpión. Fase 1: golpe de cola telegrafiado en arco (cada jugador se evalúa por separado, así uno puede esquivar aunque el otro coma el golpe). Fase 2 (HP < 66%): invoca 3 `scorpion` cada 15 s. Fase 3 (HP < 33%): furia (velocidad ×2, daño ×1.5) + ventanas de invulnerabilidad de 2 s cada 10 s.
- `UIScene`: HUD con score, monedas, habilidades, daño, **barra de progreso de enemigos**, **3 estrellas en vivo**, una **barra de vida por jugador**, botón de pausa y mute.
- `GameOverScene`: cierra la run, recuerda que las estrellas quedan a salvo y ofrece **reintentar con un compañero local**.
- `VictoryScene`: resumen final tras derrotar al Rey Escorpión.

## Ayudas al jugador

- **Corazón de emergencia**: cada vez que la vida de un jugador cruza el 50% hacia abajo aparece un corazón cerca suyo. Cura el 30% de la vida máxima.
- **Arbustos de cobertura** (Niveles 1 y 2): frenan a los enemigos terrestres y destruyen sus proyectiles, pero el jugador y sus flechas los atraviesan. Son refugio, no pared.
- **Barra de progreso** en el HUD: cuántos enemigos faltan para abrir el portal.

## Progresión actual

`Level1 → Level2 → Level3 → Level4 → Boss5 → Level6 → Level7 → Level8 → Level9 → Boss10 → VictoryScene` — la progresión completa del GDD está implementada de punta a punta. Los niveles se desbloquean a medida que se completan.

## Mapas y assets

Los mapas están en `assets/tilemaps/nivel1.json` … `nivel10.json`, y los tilesets en `assets/tilesets/desierto.png` y `catacumbas.png`.

Los sprites del arquero (J1 y J2), arcos, enemigos, flechas, estelas, fogonazos, arbustos, corazones, limos, estrellas, monedas, portal y proyectiles se generan **por código** en `PreloadScene.js`. Lo mismo pasa con el audio: no hay carpeta `assets/audio/` con archivos, todo se sintetiza en `src/core/audio.js`.

## Estructura

```text
TheMonsterHunter/               (raíz del repo, acá se levanta el servidor)
├── index.html
├── assets/
│   ├── tilemaps/nivel1.json … nivel10.json
│   ├── tilesets/{desierto,catacumbas}.png
│   ├── sprites/
│   └── audio/
└── src/
    ├── core/
    │   ├── audio.js        (síntesis procedural: música, SFX, foley)
    │   ├── config.js       (constantes, secuencia de niveles, perfiles de jugador)
    │   ├── profile.js      (persistencia: estrellas, desbloqueos, partida guardada)
    │   ├── runState.js     (estado de la partida actual, multi-jugador)
    │   └── ui.js           (paneles, botones, hint de teclado)
    ├── scenes/
    │   ├── PreloadScene.js
    │   ├── MenuScene.js
    │   ├── IntroScene.js
    │   ├── BaseLevelScene.js
    │   ├── Level1Scene.js … Level9Scene.js
    │   ├── Boss5Scene.js, Boss10Scene.js
    │   ├── AbilityScene.js, TiendaScene.js
    │   ├── UIScene.js, PauseScene.js
    │   └── GameOverScene.js, VictoryScene.js
    └── main.js
```

## Notas para ajustar en clase

- Si quieren cambiar los mapas en Tiled, editen cualquiera de `nivel1.json` a `nivel10.json`.
- Las capas que usa el código son: `ground`, `walls`, `danger` (Nivel 6 y 9, daño por proximidad vía `BaseLevelScene.createDangerZoneDamage`), `lowwalls` (solo Nivel 3) y `objects`.
- `lowwalls` bloquea a los enemigos terrestres y al jugador (salvo mientras hace dash); las flechas siempre pasan por encima.
- Los objetos importantes del mapa: `player`, `portal`, enemigos (`spider`, `scorpion`, `scorpion_elite`, `mummy`, `mummy_giant`, `serpent`, `slime_green`, `sand_spirit`, `guardian`, `boss_golem`, `boss_king_scorpion`), `wave_spawner`, `platform` y disparadores (`ambush_trigger`/`ambush_left`/`ambush_right` en `nivel7.json`, `final_wave_point` en `nivel9.json`).
- Los arbustos **no** vienen del mapa: se generan por código con `spawnBushes(cantidad)` sobre puntos transitables al azar.
- Cualquier enemigo puede declarar `vulnerableSkills: ['electric','explosive']` en `BaseLevelScene.spawnEnemy` para volverse inmune a daño normal/fuego/hielo (lo usa `sand_spirit`).
- Cualquier enemigo puede declarar `invulnerableUntil` (timestamp de `this.time.now`) en `BaseLevelScene.damageEnemy` para ignorar todo daño temporalmente (lo usa el Rey Escorpión en furia).
- `guardian` usa `shieldFacing` (radianes, leído del campo `rotation` en Tiled) + `shieldArc` para bloquear flechas frontales.
- El limo verde usa `splitDelay`, `generation` y `maxGeneration`. Cualquier enemigo puede reutilizar ese patrón.
- Para agregar un tercer jugador alcanzaría con sumar un perfil a `PLAYER_PROFILES` en `config.js`: el motor recorre ese array, no tiene el número 2 escrito a mano.
- Si ya tienen sprites reales, pueden reemplazar las texturas generadas en `PreloadScene.js` por `this.load.spritesheet(...)` o `this.load.image(...)`.

## Depurar desde la consola del navegador

La instancia del juego queda expuesta en `window.__game`:

```js
__game.registry.get('run')                                  // estado de la partida
__game.scene.getScene('Level3Scene').joinPlayerTwo()         // forzar la entrada de J2
__game.scene.getScene('Level1Scene').enemies.countActive()   // enemigos vivos
localStorage.removeItem('tmh_profile_v1')                    // borrar el perfil a mano
```
