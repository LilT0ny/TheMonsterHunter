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

- **WASD** o **flechas**: mover al arquero.
- **Click izquierdo**: disparar hacia el cursor.
- **ESPACIO**: disparar hacia la última dirección de movimiento.
- **SHIFT**: salto/dash — cruza muros bajos (`lowwalls`) y otorga inmunidad breve al daño.
- **ESC**: volver al menú desde un nivel.

## Sonido

El juego no usa ningún archivo de audio — **todo el sonido es procedural**, sintetizado en el momento con la Web Audio API (`src/core/audio.js`, clase `AudioManager`), misma filosofía que ya usan los sprites en `PreloadScene.js` (dibujados por código en vez de cargados desde PNG). Esto significa que el audio suena a síntesis tipo chiptune, no a una banda sonora grabada.

- **Música**: un mood distinto por tramo — `calm` (Niveles 1-4), `tense` (Niveles 6-9) y `boss` (Boss 5 y Boss 10, que sube de intensidad al entrar en cada fase nueva) — más `gameover` al morir. `VictoryScene` no tiene música propia (el GDD no la pide) y hace fade-out.
- **SFX**: disparo, impacto, daño recibido, moneda, muerte, subir de nivel, activar habilidad y entrada de fase de boss, centralizados en `BaseLevelScene`/`AbilityScene` para que ningún nivel tenga que repetir la lógica.
- **Foley**: viento constante de fondo en todo nivel, pasos al moverse, tormenta de arena en el Nivel 4, crujido de piedra en los slams del Boss 5 y rugido del Boss 10 en sus cambios de fase.
- Los navegadores bloquean el audio hasta el primer click/tecla — el `AudioContext` se resume automáticamente al primer gesto en `MenuScene`.
- Hay un botón de mute persistente (`localStorage`) arriba a la derecha del menú, y un punto de color en la esquina del HUD durante el juego (verde = sonido activo, rojo = mute) que hace lo mismo.

## Qué incluye

- `MenuScene`: menú principal, nueva partida, prueba directa de los niveles 2-9 y Boss 10 (grilla 3×3) y controles.
- `Level1Scene`: desierto exterior, arañas, disparo de flechas, monedas, HP y Game Over.
- `AbilityScene`: elección de 1 de 3 habilidades aleatorias.
- `TiendaScene`: mejoras de salud, suerte, armadura, velocidad y daño.
- `Level2Scene`: dunas errantes, escorpiones centinela (disparo a distancia predecible) y un escorpión de élite como hito.
- `Level3Scene`: ruinas del oasis, muros bajos que solo se cruzan con el dash (SHIFT) y una momia gigante como hito.
- `Level4Scene`: tormenta de arena, 3 oleadas seguidas sin pausa entre ellas y viñeta de visibilidad reducida.
- `Boss5Scene`: El Coloso de Piedra. Fase 1 (aproxima → telegrafía en rojo → aplasta en área → retrocede) hasta el 50% de HP; fase 2 lo fragmenta en 3 `golem_fragment` que deambulan al azar + 2 `sand_spirit` (solo dañables con flecha eléctrica o explosiva). Recompensa: 80 monedas + 2 elecciones de habilidad seguidas antes de la tienda.
- `Level6Scene`: catacumbas ardientes, lava con daño cada 500 ms, plataformas móviles y oleadas cronometradas.
- `Level7Scene`: laberinto de huesos, mapa tallado a mano (no área abierta) con un corredor angosto donde se dispara una emboscada de serpientes por ambos extremos.
- `Level8Scene`: fortaleza olvidada, 2 `guardian` estacionarios con escudo frontal direccional (solo dañables desde el costado/atrás) + escorpiones de élite como arqueros.
- `Level9Scene`: el corazón del desierto, combina todo el bestiario construido hasta ahora + zonas de trampa (más duras que la lava del Nivel 6) + una oleada final mezclada antes del portal.
- `Boss10Scene`: El Rey Escorpión (boss final). Fase 1: golpe de cola telegrafiado en arco (posicionarse al costado durante el telegrafío lo esquiva por completo). Fase 2 (HP < 66%): invoca 3 `scorpion` cada 15 s, sin dejar de pelear. Fase 3 (HP < 33%): modo furia (velocidad ×2, daño ×1.5) + ventanas de invulnerabilidad de 2 s cada 10 s. Derrotarlo lleva directo a `VictoryScene` — es el cierre real del GDD.
- `UIScene`: HUD paralelo con score, monedas, HP, habilidades y daño.
- `GameOverScene`: reinicio total de la run al morir.
- `VictoryScene`: pantalla de resumen final tras derrotar al Rey Escorpión.

## Progresión actual

`Level1 → Level2 → Level3 → Level4 → Boss5 → Level6 → Level7 → Level8 → Level9 → Boss10 → VictoryScene` — la progresión completa del GDD está implementada de punta a punta. La dificultad escala en cada nivel; los niveles de boss son un salto claro por encima de los niveles que los rodean (Boss 10 supera a Boss 5 en HP, daño y presión sostenida).

## Mapas y assets

Los mapas ya están en:

```text
assets/tilemaps/nivel1.json
assets/tilemaps/nivel2.json
assets/tilemaps/nivel3.json
assets/tilemaps/nivel4.json
assets/tilemaps/nivel5.json
assets/tilemaps/nivel6.json
assets/tilemaps/nivel7.json
assets/tilemaps/nivel8.json
assets/tilemaps/nivel9.json
assets/tilemaps/nivel10.json
```

Los tilesets están en:

```text
assets/tilesets/desierto.png
assets/tilesets/catacumbas.png
```

Los sprites del arquero, enemigos, flechas, monedas, portal y proyectiles se generan por código en `PreloadScene.js`, para que el proyecto funcione sin depender de imágenes externas. Lo mismo pasa con el audio: no hay carpeta `assets/audio/` con archivos, todo se sintetiza en `src/core/audio.js` (ver sección "Sonido" más arriba).

## Estructura

```text
TheMonsterHunter/               (raíz del repo, acá se levanta el servidor)
├── index.html
├── assets/
│   ├── tilemaps/
│   │   ├── nivel1.json
│   │   ├── nivel2.json
│   │   ├── nivel3.json
│   │   ├── nivel4.json
│   │   ├── nivel5.json
│   │   ├── nivel6.json
│   │   ├── nivel7.json
│   │   ├── nivel8.json
│   │   ├── nivel9.json
│   │   └── nivel10.json
│   ├── tilesets/
│   │   ├── desierto.png
│   │   └── catacumbas.png
│   ├── sprites/
│   └── audio/
└── src/
    ├── core/
    │   ├── audio.js
    │   ├── config.js
    │   ├── runState.js
    │   └── ui.js
    ├── scenes/
    │   ├── PreloadScene.js
    │   ├── MenuScene.js
    │   ├── BaseLevelScene.js
    │   ├── Level1Scene.js
    │   ├── AbilityScene.js
    │   ├── TiendaScene.js
    │   ├── Level2Scene.js
    │   ├── Level3Scene.js
    │   ├── Level4Scene.js
    │   ├── Boss5Scene.js
    │   ├── Level6Scene.js
    │   ├── Level7Scene.js
    │   ├── Level8Scene.js
    │   ├── Level9Scene.js
    │   ├── Boss10Scene.js
    │   ├── UIScene.js
    │   ├── GameOverScene.js
    │   └── VictoryScene.js
    └── main.js
```

## Notas para ajustar en clase

- Si quieren cambiar los mapas en Tiled, editen cualquiera de `nivel1.json` a `nivel10.json`.
- Las capas que usa el código son: `ground`, `walls`, `danger` (Nivel 6 y 9, daño por proximidad genérico vía `BaseLevelScene.createDangerZoneDamage`), `lowwalls` (solo Nivel 3) y `objects`.
- `lowwalls` bloquea a los enemigos terrestres y al jugador (salvo mientras hace dash con SHIFT); las flechas siempre pasan por encima.
- Los objetos importantes del mapa son: `player`, `portal`, enemigos (`spider`, `scorpion`, `scorpion_elite`, `mummy`, `mummy_giant`, `serpent`, `sand_spirit`, `guardian`, `boss_golem`, `boss_king_scorpion`), `wave_spawner`, `platform` y puntos de disparador (`ambush_trigger`/`ambush_left`/`ambush_right` en `nivel7.json`, `final_wave_point` en `nivel9.json`).
- `boss_golem` es el único objeto de `nivel5.json` y `boss_king_scorpion` el único de `nivel10.json`; sus refuerzos/fragmentos se generan por código, no desde el mapa.
- Cualquier enemigo puede declarar `vulnerableSkills: ['electric','explosive']` en `BaseLevelScene.spawnEnemy` para volverse inmune a daño normal/fuego/hielo (usado por `sand_spirit`).
- `guardian` usa `shieldFacing` (radianes, leído del campo `rotation` del objeto en Tiled) + `shieldArc` para bloquear flechas frontales — solo se le hace daño desde el costado o atrás.
- Cualquier enemigo puede declarar `invulnerableUntil` (timestamp de `this.time.now`) en `BaseLevelScene.damageEnemy` para ignorar todo daño temporalmente (usado por el Rey Escorpión en su modo furia).
- Si ya tienen sprites reales, pueden reemplazar las texturas generadas en `PreloadScene.js` por `this.load.spritesheet(...)` o `this.load.image(...)`.
