# The Monster Hunter — MVP funcional en Phaser 3 + Tiled

Este proyecto implementa una versión jugable y entregable del diseño de **The Monster Hunter** usando **Phaser 3**, escenas modulares y mapas JSON compatibles con **Tiled**.

## Cómo ejecutar

No abras `index.html` con doble clic, porque los módulos ES y los mapas JSON necesitan un servidor local.

```bash
cd monster-hunter-phaser
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
- **ESC**: volver al menú desde un nivel.

## Qué incluye

- `MenuScene`: menú principal, nueva partida, prueba directa del nivel 2 y controles.
- `Level1Scene`: desierto exterior, arañas, escorpiones, disparo de flechas, monedas, HP y Game Over.
- `AbilityScene`: elección de 1 de 3 habilidades aleatorias.
- `TiendaScene`: mejoras de salud, suerte, armadura, velocidad y daño.
- `Level2Scene`: catacumbas, lava con daño cada 500 ms, plataformas móviles y oleadas cronometradas.
- `UIScene`: HUD paralelo con score, monedas, HP, habilidades y daño.
- `GameOverScene`: reinicio total de la run al morir.
- `VictoryScene`: resumen final del MVP.

## Mapas y assets

Los mapas ya están en:

```text
assets/tilemaps/nivel1.json
assets/tilemaps/nivel2.json
```

Los tilesets están en:

```text
assets/tilesets/desierto.png
assets/tilesets/catacumbas.png
```

Los sprites del arquero, enemigos, flechas, monedas, portal y proyectiles se generan por código en `PreloadScene.js`, para que el proyecto funcione sin depender de imágenes externas.

## Estructura

```text
monster-hunter-phaser/
├── index.html
├── assets/
│   ├── tilemaps/
│   │   ├── nivel1.json
│   │   └── nivel2.json
│   ├── tilesets/
│   │   ├── desierto.png
│   │   └── catacumbas.png
│   ├── sprites/
│   └── audio/
└── src/
    ├── core/
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
    │   ├── UIScene.js
    │   ├── GameOverScene.js
    │   └── VictoryScene.js
    └── main.js
```

## Notas para ajustar en clase

- Si quieren cambiar los mapas en Tiled, editen `nivel1.json` y `nivel2.json`.
- Las capas que usa el código son: `ground`, `walls`, `danger` y `objects`.
- Los objetos importantes del mapa son: `player`, `portal`, enemigos (`spider`, `scorpion`, `mummy`, `serpent`), `wave_spawner` y `platform`.
- Si ya tienen sprites reales, pueden reemplazar las texturas generadas en `PreloadScene.js` por `this.load.spritesheet(...)` o `this.load.image(...)`.
