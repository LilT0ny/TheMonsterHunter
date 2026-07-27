# Bitácora de Playtesting — Corrida 1 de 3

**Integrante:** Anael Molina
**Materia:** Juegos Interactivos · **Juego:** The Monster Hunter (Phaser 3 + Tiled)

| Campo | Valor |
|---|---|
| Fecha | _(completar)_ |
| Hora de inicio | _(completar)_ |
| Hora de fin | _(completar)_ |
| Duración total | _(completar)_ |
| Commit / versión jugada | _(completar)_ |
| Modo | ☑ Solo · ☐ Cooperativo |
| ¿Llegaste al Boss 10? | ☐ Sí · ☑ No — hasta el **Nivel 1** |
| ¿Cuántas veces moriste? | _(completar)_ |

> **Declaración de aislamiento.** Esta corrida se realizó de forma individual,
> sin contacto ni comentarios con el otro integrante del equipo, tal como exige
> la guía del examen.
>
> Firma / iniciales: ____________

**Contexto de la corrida.** Primera pasada sobre la build actual, entrando como
jugador nuevo. El recorrido cubrió el flujo de entrada completo —menú principal,
pantalla "Cómo se juega", inicio del Nivel 1— y terminó en Game Over dentro del
Nivel 1.

> ⚠️ **Corrida parcial.** La guía pide recorrer el juego completo. Esta corrida
> se cortó en el Nivel 1 por derrota temprana, que es en sí mismo el hallazgo
> principal (observación #2). Corresponde completar el recorrido en la corrida 2.

---

## Observaciones de la corrida

**Pilares:** `GF` Game Feel · `DN` Diseño de Niveles · `MUS` Música ·
`SFX` Efectos de Sonido · `ANI` Animaciones · `UI` Interfaz
**Gravedad:** `A` rompe la experiencia · `M` molesta o confunde · `B` detalle estético

| #  | Nivel | ¿Qué estaba haciendo? | Qué observé | Pilar | Grav. |
|----|-------|------------------------|-------------|-------|-------|
| 1 | Nivel 1 | Jugando en partida: moviéndome y tratando de leer el HUD al mismo tiempo | Hay bastante texto simultáneo en pantalla (objetivo, controles, score, vida, habilidades). En resolución de navegador algunas líneas se sienten pequeñas y saturadas para leer rápido mientras te movés | UI | M |
| 2 | Nivel 1 | Primera partida como jugador nuevo, sin habilidades ni mejoras acumuladas | La derrota llegó muy rápido. La dificultad inicial se percibe alta para un arranque: no hay margen para adaptarse a los controles antes de recibir presión | GF | M |
| 3 | General | Recorriendo el flujo menú → "Cómo se juega" → Nivel 1 → Game Over | Verificado sin defectos: las transiciones entre escenas se ven estables, sin cortes ni errores visibles | UI | B |

---

## Propuestas de mejora derivadas

Formuladas por quien realizó la corrida, antes de la consolidación de equipo.

| Observación | Propuesta |
|---|---|
| #1 Saturación del HUD | Reducir la cantidad de texto simultáneo y aumentar el tamaño de la información crítica. Ocultar automáticamente lo que solo hace falta al principio —el recordatorio de controles— una vez que el jugador ya está jugando. |
| #2 Dificultad inicial alta | Dar una ventana de seguridad corta al comenzar: invulnerabilidad breve al aparecer y menos presión inicial en el Nivel 1, para que un jugador nuevo se adapte antes de recibir daño. |

---

## Recorrido nivel por nivel

_Completar con la sensación de esta corrida._

| Nivel | ¿Lo pasaste? | Intentos | ¿Se entendía qué hacer? | Sensación (1-5) | Nota rápida |
|-------|--------------|----------|-------------------------|-----------------|-------------|
| Nivel 1 — El paso de arena | ☐ Sí ☑ No |  | ☐ Sí ☐ No |  | Derrota temprana |
| Nivel 2 — Dunas errantes | — no alcanzado | — | — | — | — |
| Nivel 3 — Ruinas del oasis | — no alcanzado | — | — | — | — |
| Nivel 4 — Tormenta de arena | — no alcanzado | — | — | — | — |
| Boss 5 — El Coloso de Piedra | — no alcanzado | — | — | — | — |
| Nivel 6 — Catacumbas ardientes | — no alcanzado | — | — | — | — |
| Nivel 7 — Laberinto de huesos | — no alcanzado | — | — | — | — |
| Nivel 8 — Fortaleza olvidada | — no alcanzado | — | — | — | — |
| Nivel 9 — El corazón del desierto | — no alcanzado | — | — | — | — |
| Boss 10 — El Rey Escorpión | — no alcanzado | — | — | — | — |

---

## Cierre de la corrida

**Las 3 cosas que más me molestaron, en orden:**

1. La derrota llegó demasiado rápido en el Nivel 1: un jugador nuevo no alcanza
   a adaptarse a los controles antes de que lo alcancen.
2. El HUD tiene demasiada información simultánea y con tipografía chica: cuesta
   leerlo de un vistazo mientras te movés.
3. _(pendiente de las corridas 2 y 3)_

**Lo que mejor funcionó (para no romperlo después):**

1. El flujo principal de navegación: menú → "Cómo se juega" → Nivel 1 → Game
   Over funciona correctamente y sin errores visibles.
2. Las transiciones entre escenas se ven estables, sin cortes ni parpadeos.

**¿Volvería a jugarlo por gusto?** _(completar)_

---

## Pendiente para las corridas 2 y 3

- Completar el recorrido hasta el Boss 10 (esta corrida se cortó en el Nivel 1).
- **Música**: es el pilar sin ninguna mejora registrada en todo el equipo.
  ¿Corta al reiniciar un nivel? ¿Se superpone al cambiar de escena?
- Niveles 6, 7 y 8: el tramo menos auditado.
- Modo cooperativo de punta a punta.
