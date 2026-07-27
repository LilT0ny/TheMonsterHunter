# The Monster Hunter — Informe técnico de mejoras

**Materia:** Juegos Interactivos · **Equipo:** Anthony Gomez, Anael Molina
**Repositorio:** `LilT0ny/TheMonsterHunter` · **Motor:** Phaser 3.80.1 + Tiled

Este documento alimenta la sección *"Bitácora e Informe de Playtesting"* del GDD.
Contiene el catálogo de mejoras implementadas, con el problema que resolvió cada
una y cómo se solucionó técnicamente.

> **Pendiente del equipo:** completar la columna *Asignado* con 3 mejoras por
> integrante, y adjuntar las bitácoras individuales de las 3 corridas.
>
> **Pendiente de confirmar con el profesor:** la guía define 9 mejoras para
> equipos de 3 y 12 para equipos de 4, pero no menciona equipos de 2. La
> extensión lógica son **6 mejoras** (3 por integrante). Confirmarlo antes de
> la entrega.

---

## 1. Matriz de asignación

| #  | Mejora | Categoría | Archivos principales | Asignado |
|----|--------|-----------|----------------------|----------|
| 1  | Progreso persistente y "Continuar partida" | Interfaz (UI/UX) | `core/profile.js`, `core/runState.js`, `scenes/MenuScene.js` | |
| 2  | Sistema de 3 estrellas por nivel | Interfaz (UI/UX) | `core/profile.js`, `core/config.js`, `scenes/BaseLevelScene.js` | |
| 3  | Barra de progreso de enemigos en el HUD | Interfaz (UI/UX) | `scenes/UIScene.js` | |
| 4  | Pantalla de introducción | Interfaz (UI/UX) | `scenes/IntroScene.js` | |
| 5  | Menú de pausa | Interfaz (UI/UX) | `scenes/PauseScene.js`, `scenes/UIScene.js` | |
| 6  | Remezcla de la mezcla de audio | Efectos de Sonido | `core/audio.js` | |
| 7  | Banco de SFX ampliado | Efectos de Sonido | `core/audio.js` | |
| 8  | Arma visible que apunta al objetivo | Animaciones | `scenes/PreloadScene.js`, `scenes/BaseLevelScene.js` | |
| 9  | Flechas legibles con estela y fogonazo | Animaciones | `scenes/PreloadScene.js`, `scenes/BaseLevelScene.js` | |
| 10 | Animación de caminata del arquero | Animaciones | `scenes/PreloadScene.js`, `scenes/BaseLevelScene.js` | |
| 11 | Rediseño de todas las texturas de enemigos | Animaciones | `scenes/PreloadScene.js` | |
| 12 | Rediseño de proyectiles enemigos | Animaciones | `scenes/PreloadScene.js` | |
| 13 | Efectos elementales (fuego, hielo, rayo) | Animaciones | `scenes/PreloadScene.js`, `scenes/BaseLevelScene.js` | |
| 14 | Textura de moneda | Animaciones | `scenes/PreloadScene.js` | |
| 15 | Autodisparo activable con tecla | Jugabilidad (Game Feel) | `core/config.js`, `scenes/BaseLevelScene.js` | |
| 16 | Flechas que no atraviesan muros | Jugabilidad (Game Feel) | `scenes/BaseLevelScene.js` | |
| 17 | Corazón de emergencia al bajar del 50% | Jugabilidad (Game Feel) | `scenes/BaseLevelScene.js`, `core/config.js` | |
| 18 | Cooperativo local de 2 jugadores | Jugabilidad (Game Feel) | `core/runState.js`, `scenes/BaseLevelScene.js` | |
| 19 | Control del último jugador en pie | Jugabilidad (Game Feel) | `scenes/BaseLevelScene.js` | |
| 20 | Cámara cooperativa corregida | Jugabilidad (Game Feel) | `scenes/BaseLevelScene.js` | |
| 21 | Compañero ofrecido al morir | Jugabilidad (Game Feel) | `scenes/GameOverScene.js` | |
| 22 | Arbustos de cobertura táctica | Diseño de Niveles | `scenes/BaseLevelScene.js`, `scenes/Level1Scene.js` | |
| 23 | Enemigo que se duplica con el tiempo | Diseño de Niveles | `core/config.js`, `scenes/Level2Scene.js` | |
| 24 | Curva de dificultad por cantidad | Diseño de Niveles | `core/config.js`, `scenes/BaseLevelScene.js` | |
| 25 | Arenas de jefe pobladas | Diseño de Niveles | `core/config.js`, `scenes/Boss5Scene.js`, `scenes/Boss10Scene.js` | |

---

## 2. Fichas técnicas

### Interfaz (UI / UX)

#### 1. Progreso persistente y "Continuar partida"

**Problema encontrado.** Al recargar el navegador se perdía absolutamente todo.
No existía forma de retomar una partida ni de ver que el jugador había avanzado.

**Diagnóstico.** El estado vivía en `scene.registry`, que es memoria RAM del
motor. No era un bug: la persistencia nunca se había implementado.

**Solución técnica.** Se separaron dos estados con ciclos de vida distintos:

| Estado | Módulo | Contenido | Se pierde |
|---|---|---|---|
| `run` | `core/runState.js` | Vida, monedas, score, habilidades, mejoras | Al morir |
| `profile` | `core/profile.js` | Estrellas, niveles desbloqueados, mejor score | Nunca |

Ambos se serializan a `localStorage` (`tmh_profile_v1`, `tmh_save_v1`). La
partida se vuelca al **entrar a cada nivel** (`checkpointRun`), de modo que
"Continuar" reanuda en el nivel donde estaba el jugador. `normalizeRun` repara
guardados corruptos o de versiones anteriores.

**Por qué la separación importa.** Si las estrellas vivieran dentro de `run`, se
perderían al morir — justo cuando más falta hace el incentivo para volver.

---

#### 2. Sistema de 3 estrellas por nivel

**Problema encontrado.** Terminar un nivel no daba ninguna medida de calidad: se
pasaba o no se pasaba. No había motivo para rejugar.

**Solución técnica.** Tres objetivos por nivel, 30 estrellas en total:

1. Completar el nivel.
2. Terminar con más del 50% de vida de equipo.
3. No dejar ningún enemigo vivo.

Se guardan en `profile.stars` y **nunca bajan** (`recordLevelResult` usa
`Math.max`). El HUD las muestra en vivo y el menú de pausa las lista.

**Detalle no obvio.** La tercera estrella se mide por *enemigos vivos*
(`hasClearedAllEnemies`) y no por `kills == apariciones`. Hay enemigos que
desaparecen sin morir — el limo se parte en dos, el Coloso se fragmenta — y
contando bajas esa estrella era matemáticamente inalcanzable.

---

#### 3. Barra de progreso de enemigos en el HUD

**Problema encontrado.** El jugador no sabía cuánto le faltaba para abrir el
portal. Mataba a ciegas.

**Solución técnica.** `UIScene` lee `enemyKills` y `requiredKills` de la escena
del nivel y dibuja una barra con el conteo. Los niveles por oleadas (4 y 9) y
los de jefe no fijan `requiredKills` porque su final depende de listas de
enemigos concretas; ahí la barra cae en `totalEnemiesSpawned`, así nunca queda
muda. Si llega una oleada nueva la barra retrocede, que es exactamente la
información que el jugador necesita.

---

#### 4. Pantalla de introducción

**Problema encontrado.** El juego arrancaba sin explicar de qué se trataba, cómo
se jugaba ni que perder implicaba volver al Nivel 1.

**Solución técnica.** `IntroScene` con cuatro bloques (premisa, mecánicas,
naturaleza roguelike, objetivos de estrella) más los controles de ambos
jugadores. Aparece automáticamente la primera vez (`profile.introSeen`) y queda
accesible desde el menú.

---

#### 5. Menú de pausa

**Problema encontrado.** No se podía pausar. ESC salía directo al menú y hacía
perder la partida por una pulsación accidental.

**Solución técnica.** `PauseScene` se lanza como escena superpuesta con
`this.scene.pause()`. Ofrece reanudar, reiniciar el nivel y volver al menú, y
muestra el estado en vivo de los tres objetivos de estrella. Se abre con ESC, P
o el botón `PAUSA` del HUD.

**Detalle no obvio.** Al reanudar, `PauseScene` escribe
`level.nextPauseAllowedAt = level.time.now + 320`. Sin esa marca, la misma
pulsación de ESC que cierra la pausa la volvía a abrir. Y *"Reiniciar nivel"*
recarga desde el checkpoint y no desde el estado actual: si no, morir a
propósito y reiniciar sería una forma de farmear monedas.

---

### Efectos de Sonido

#### 6. Remezcla de la mezcla de audio

**Problema encontrado.** No se escuchaba el disparo ni los pasos.

**Diagnóstico — el hallazgo más importante de esta categoría.** Ambos sonidos
**ya estaban implementados y se estaban ejecutando**. El problema era la mezcla:

| SFX | Ganancia propia | × bus de SFX (0.5) | Volumen real |
|---|---|---|---|
| `shoot` | 0.16 | ×0.5 | **0.08** |
| `footstep` | 0.05 | ×0.5 | **0.025** |

El paso sonaba al 2.5% de volumen. Técnicamente sonaba; en la práctica era
inaudible.

**Solución técnica.** El bus de SFX subió de 0.5 a 0.72 y el disparo se rearmó
en cuatro capas (chasquido de cuerda, cuerpo tonal, golpe grave y silbido de
salida). Los pasos alternan pie izquierdo y derecho cambiando el filtro, para
que caminar suene a caminar y no a un click repetido.

**Aprendizaje.** El diagnóstico correcto cambió por completo el trabajo: no
había que escribir SFX nuevos, había que remezclar. Diez veces más rápido.

---

#### 7. Banco de SFX ampliado

**Problema encontrado.** Acciones importantes ocurrían en silencio: recoger un
corazón, caer, reanimar a un compañero, dividirse un enemigo, ganar una estrella.

**Solución técnica.** Nueve sonidos nuevos sintetizados en `audio.js`: `heart`,
`down`, `revive`, `split`, `star`, `playerJoin`, `pause`, `unpause`,
`uiSelect`. Todo el audio del juego es **procedural** (Web Audio API), sin un
solo archivo de sonido en el repositorio.

---

### Animaciones

#### 8. Arma visible que apunta al objetivo

**Problema encontrado.** No se notaba con qué ni hacia dónde se disparaba.

**Diagnóstico.** El arco estaba **pintado sobre el cuerpo del arquero**. Un arma
dibujada dentro del sprite del personaje no puede rotar hacia ningún lado.

**Solución técnica.** El arco pasó a ser su propia textura (`bow`, `bow2`) que
orbita al jugador y rota hacia el ángulo de puntería. Rotación 0 apunta a la
derecha, con la curva hacia el objetivo y la cuerda del lado del jugador.

---

#### 9. Flechas legibles con estela y fogonazo

**Problema encontrado.** El disparo no se leía en pantalla.

**Diagnóstico.** La flecha era `makeRect('arrow', 22, 5, ...)` — un rectángulo
plano de 22×5 píxeles viajando a 500 px/s.

**Solución técnica.** Flecha dibujada con punta brillante, astil y plumas
(30×11). Cada disparo genera un **fogonazo** en la punta del arco y cada flecha
deja una **estela** que se desvanece cada 32 ms.

---

#### 10. Animación de caminata del arquero

**Problema encontrado.** El personaje se deslizaba por el suelo: un sprite
estático moviéndose por el mapa.

**Solución técnica.** `PreloadScene` genera una hoja de 5 fotogramas de 32×32
(uno quieto y un ciclo de caminata de 4) dibujando cada frame con un
desplazamiento de piernas y un rebote de un píxel. Como `generateTexture` deja
un único frame con la hoja entera, los recortes se registran a mano:

```js
const texture = this.textures.get(key);
ARCHER_FRAMES.forEach((_, i) => texture.add(i, 0, i * 32, 0, 32, 32));
```

`BaseLevelScene` alterna `archer-walk` y `archer-idle` según haya velocidad. El
mismo generador produce a J1 y a J2 con paletas distintas: un solo arte que
mantener.

---

#### 11. Rediseño de todas las texturas de enemigos

**Problema encontrado.** Los enemigos eran siluetas planas sin volumen.

**Solución técnica.** Los nueve enemigos se redibujaron con sombra en el suelo,
luz y sombra propias y detalle específico: patas articuladas en dos segmentos en
la araña, cola segmentada y placas de carapacho en el escorpión, vendas con
relieve y ojos encendidos en la momia, escamas y membrana alar en la serpiente,
grietas ardientes y musgo en el Coloso, remaches y visor en el Guardián, corona
de púas en el Rey Escorpión.

---

#### 12. Rediseño de proyectiles enemigos

**Problema encontrado.** Los disparos enemigos eran cuadrados de 12×12 px.

**Solución técnica.** `enemyBolt` pasó a ser una descarga con núcleo claro,
cuerpo naranja y púas radiales; `venom` una gota de veneno con brillo y goteo.

---

#### 13. Efectos elementales (fuego, hielo, rayo)

**Problema encontrado.** Las habilidades elementales no se distinguían. El fuego
era un tinte naranja, el hielo no tenía ningún efecto visual y el rayo dibujaba
una línea recta.

**Solución técnica.**

- **Una flecha por elemento** (`arrowFire`, `arrowIce`, `arrowElectric`) con
  resplandor en la punta y estela tintada. Si el jugador tiene varias
  habilidades manda la más vistosa (rayo > fuego > hielo), en vez de mezclar
  colores y que no se lea ninguna.
- **Fuego**: cada tic de quemadura suelta tres llamas que ascienden y se apagan.
- **Hielo**: `applyFrost` genera un estallido de cuatro cristales y un destello
  azul sobre el enemigo ralentizado.
- **Rayo**: `drawLightning` traza un camino **quebrado** de 6 segmentos con
  desplazamiento perpendicular aleatorio, en dos pasadas (halo ancho y núcleo
  blanco), más una chispa en cada objetivo encadenado.

---

#### 14. Textura de moneda

**Problema encontrado.** Las monedas eran cuadrados amarillos.

**Solución técnica.** Disco con canto oscuro, cara dorada, anillo interior y
rombo en relieve con base oscura y cara clara desplazada, más un brillo
especular. Las dos mitades del rombo se dibujan siempre: en una primera versión
solo se pintó la mitad derecha de la sombra y el relieve se veía torcido.

---

### Jugabilidad (Game Feel)

#### 15. Autodisparo activable con tecla

**Problema encontrado.** Apuntar y moverse a la vez con mouse y teclado resulta
exigente, sobre todo en los niveles con muchos enemigos.

**Solución técnica.** La tecla **F** alterna el autodisparo. Con él activo,
`updatePlayerAim` busca el enemigo más cercano dentro de 430 px
(`AUTO_FIRE_RANGE`), orienta el arco hacia él y `updatePlayerActions` dispara
solo. Si no hay blanco a tiro, vuelve el apuntado manual.

La preferencia se guarda en `profile.autoFire`, no en la run: es una preferencia
del jugador, no estado de la partida. El HUD muestra un distintivo `AUTO`,
porque sin él un arco apuntando solo se siente como un bug.

---

#### 16. Flechas que no atraviesan muros

**Problema encontrado.** Las flechas del jugador cruzaban las paredes.

**Diagnóstico.** No existía el colisionador. Estaban registrados jugador, enemigos
y proyectiles enemigos contra `wallsLayer`, pero **nunca las flechas del
jugador**. El defecto era anterior a estas mejoras; se hizo evidente al volver
visibles las flechas.

**Solución técnica.** Colisionador `arrows` ↔ `wallsLayer` que apaga la flecha y
suelta una chispa. Solo contra `walls`: sobre `lowwalls` deben seguir pasando,
porque esa es la mecánica del dash del Nivel 3.

**Efecto secundario medido.** Disparando de forma sostenida, los objetos en
escena bajaron de 81 a 55: las flechas mueren contra el muro en lugar de volar
su vida entera.

---

#### 17. Corazón de emergencia al bajar del 50%

**Problema encontrado.** No había forma de recuperar vida dentro de un nivel. Un
mal tramo condenaba el resto de la partida.

**Solución técnica.** `damagePlayer` informa cuándo la vida **cruza** el 50%
hacia abajo (`crossedHalf`) y la escena genera un corazón cerca del jugador que
cura el 30% de la vida máxima. Se rearma cada vez que se vuelve a cruzar el
umbral, no una sola vez por nivel.

---

#### 18. Cooperativo local de 2 jugadores

**Problema encontrado.** El juego era estrictamente para una persona.

**Diagnóstico.** Todo el motor asumía un jugador: `this.player` singular, un
`hp` único, una cámara siguiendo a un sprite, colisiones registradas contra ese
sprite y `applyDamageToPlayer(amount)` sin destinatario.

**Solución técnica — la decisión estructural del proyecto.**

- `runState` pasó de un `hp` a un array `players[]`, cada uno con su vida y su
  estado de caído. Score, monedas, habilidades y mejoras siguen siendo
  compartidos: la run es una sola.
- Las colisiones se registran contra un **grupo de físicas** (`this.playerGroup`)
  y no contra sprites sueltos. Gracias a eso, un jugador que entra a mitad de
  nivel queda operativo sin registrar ninguna colisión nueva.
- `this.player` se conservó como alias del jugador 1, así los diez niveles y los
  dos jefes ya escritos siguieron funcionando sin tocarse.
- Enemigos y jefes apuntan al jugador vivo más cercano (`getNearestPlayer`).
- Si un jugador cae, el compañero lo **reanima** permaneciendo a su lado 2,4 s.
  El Game Over solo llega cuando caen los dos.

Para añadir un tercer jugador bastaría con agregar un perfil a
`PLAYER_PROFILES`: el motor recorre ese array, no tiene el número 2 escrito a
mano.

---

#### 19. Control del último jugador en pie

**Problema encontrado.** *"No me puedo mover con WASD pero sí con las flechas."*

**Diagnóstico.** Se probaron seis contextos y el control funcionaba en cinco. El
que fallaba: **en cooperativo, con el jugador 1 caído**. WASD no respondía
porque J1 estaba en el suelo; las flechas sí, porque J2 seguía vivo. Era el
resultado de que una sola persona aceptara el modo cooperativo y el segundo
personaje muriera desatendido.

**Solución técnica.** `isActionPressed` acepta **todos los esquemas de teclas**
cuando queda un solo jugador activo. Si tu compañero cae, seguís con WASD,
ESPACIO, SHIFT y el mouse sin cambiar de manos. El mismo mecanismo cubre el
juego en solitario.

**Aprendizaje.** El código de teclas estaba bien. Parchearlo a ciegas habría
roto el cooperativo dejando el defecto real intacto. Reproducir primero,
arreglar después.

---

#### 20. Cámara cooperativa corregida

**Problema encontrado.** *"Se ve como trabado el juego."*

**Diagnóstico.** No era rendimiento: medido a 143 FPS disparando sin parar, sin
caídas. `updateCameraFocus` calculaba la apertura con `players[0]` y
`players[1]` **sin filtrar caídos**, de modo que la cámara se estiraba hasta el
cuerpo del compañero muerto y se alejaba.

**Solución técnica.** La apertura se mide solo entre jugadores en pie. Con uno
solo activo, la cámara vuelve a zoom 1 y lo sigue **directamente**, sin el
objeto intermedio que agregaba un fotograma de retraso sobre el suavizado.

---

#### 21. Compañero ofrecido al morir

**Problema encontrado.** La oferta de cooperativo aparecía a mitad del Nivel 3,
en un momento arbitrario, y una persona jugando sola terminaba con un segundo
personaje inmóvil que moría desatendido.

**Solución técnica.** La oferta se movió a `GameOverScene`: el botón *"Reintentar
con un compañero (2 jugadores)"* llama a `enableCoop` y arranca una nueva
partida con los dos arqueros desde el Nivel 1. Es el momento en que la ayuda
realmente hace falta.

---

### Diseño de Niveles

#### 22. Arbustos de cobertura táctica

**Problema encontrado.** Terreno abierto sin nada donde resguardarse de los
enemigos a distancia.

**Solución técnica.** `spawnBushes(n)` distribuye arbustos sobre puntos
transitables al azar. La regla que los vuelve **cobertura y no obstáculo**:

| Entidad | Comportamiento |
|---|---|
| Enemigos terrestres | Chocan |
| Proyectiles enemigos | Se destruyen |
| Jugador | Atraviesa |
| Flechas del jugador | Atraviesan |

Nivel 1: 16 arbustos. Nivel 2: 10.

---

#### 23. Enemigo que se duplica con el tiempo

**Problema encontrado.** Todos los enemigos castigaban igual: acercándose y
pegando. No había ninguna amenaza que castigara la lentitud.

**Solución técnica.** El limo verde (`slime_green`) se parte en dos a los 7
segundos si sigue vivo, hasta dos generaciones (1 → 2 → 4). Los hijos son más
pequeños y débiles. Dejarlo vivo no te castiga con daño, te castiga con
cantidad: el reloj es la presión.

Cualquier enemigo puede reutilizar el patrón declarando `splitDelay`,
`generation` y `maxGeneration`.

---

#### 24. Curva de dificultad por cantidad

**Problema encontrado.** Los niveles avanzados se sentían más fáciles que los
iniciales: el jugador acumula habilidades y mejoras, y matar deja de costar.

**Solución técnica.** La presión se trasladó del aguante individual a la
cantidad (`DIFFICULTY` en `config.js`):

- Cada nivel suma refuerzos proporcionales a los enemigos que él mismo define
  (14% por nivel) más un extra fijo, con **techo de 10** para que la pantalla
  siga siendo legible.
- La vida sube apenas 8% por nivel: no queremos esponjas de daño, queremos
  multitud.
- **Los jefes quedan excluidos** del escalado de vida: ya tienen fases
  diseñadas y multiplicar su HP solo alargaría la pelea.
- Los refuerzos también incrementan `requiredKills`; si no, el portal se abriría
  sin haber tocado a ninguno.
- Cada nivel tiene su fauna propia en `REINFORCEMENT_POOLS`.

Resultado medido: Nivel 1 = 8 enemigos, Nivel 2 = 11, Nivel 9 = 22.

---

#### 25. Arenas de jefe pobladas

**Problema encontrado.** Los niveles de jefe eran un duelo aislado en una arena
vacía, sin presión ambiental.

**Solución técnica.** `BOSS_ARENA_WAVES` define oleadas por arena:

| Nivel | Inicial | Oleada | Intervalo | Techo |
|---|---|---|---|---|
| Boss 5 | 4 | 3 | 12 s | 10 vivos |
| Boss 10 | 5 | 4 | 10 s | 14 vivos |

**Detalle crítico.** El oleaje **se corta al caer el jefe**
(`stopBossArenaWaves`). Sin eso la arena nunca se vaciaría y la tercera estrella
—"no dejar ningún enemigo vivo"— quedaría permanentemente fuera de alcance.

---

## 3. Metodología de verificación

El proyecto no tiene suite de tests automatizados. Cada mejora se verificó
ejecutando el juego real en Chrome mediante `playwright-core`, con:

1. **Comprobación de sintaxis** de los 22 archivos fuente (`node --check`).
2. **Validación de importaciones**: cada `import` nombrado contra los `export`
   reales del módulo destino.
3. **Ejecución dirigida en navegador**: apertura del juego, interacción por
   coordenadas sobre el canvas, aserciones sobre el estado interno del motor
   (`window.__game`) y captura de pantalla.
4. **Lectura de las capturas**, no solo del código de salida.

Ese último punto resultó decisivo: dos defectos —el disparo del jugador 2 que se
perdía entre fotogramas y varias superposiciones del HUD— solo aparecieron al
mirar las imágenes.
