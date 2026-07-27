# Bitácora de Playtesting — Corrida 2 de 3

**Integrante:** Anthony Gomez
**Materia:** Juegos Interactivos · **Juego:** The Monster Hunter (Phaser 3 + Tiled)

| Campo | Valor |
|---|---|
| Fecha | _(completar)_ |
| Hora de inicio | _(completar)_ |
| Hora de fin | _(completar)_ |
| Duración total | _(completar)_ |
| Commit / versión jugada | _(completar)_ |
| Modo | ☐ Solo · ☐ Cooperativo |
| ¿Llegaste al Boss 10? | ☐ Sí · ☐ No — hasta el nivel ___ |
| ¿Cuántas veces moriste? | _(completar)_ |

> **Declaración de aislamiento.** Esta corrida se realizó de forma individual,
> sin contacto ni comentarios con el otro integrante del equipo, tal como exige
> la guía del examen.
>
> Firma / iniciales: ____________

**Contexto de la corrida.** Segunda pasada, sobre la build que ya incorporaba el guardado persistente, la intro, la pausa, las estrellas, el corazón de emergencia, los arbustos de cobertura, la remezcla de audio, las flechas visibles, el limo verde y el modo cooperativo. El foco fue verificar lo nuevo y buscar regresiones.

---

## Observaciones de la corrida

**Pilares:** `GF` Game Feel · `DN` Diseño de Niveles · `MUS` Música ·
`SFX` Efectos de Sonido · `ANI` Animaciones · `UI` Interfaz
**Gravedad:** `A` rompe la experiencia · `M` molesta o confunde · `B` detalle estético

| #  | Nivel | ¿Qué estaba haciendo? | Qué observé | Pilar | Grav. |
|----|-------|------------------------|-------------|-------|-------|
| 1 | Nivel 3 | Acepté sumar un compañero a mitad del nivel y seguí jugando con un solo personaje | Mi personaje dejó de responder a WASD. Con las flechas sí se movía. Tardé en darme cuenta de que estaba moviendo al otro arquero | GF | A |
| 2 | Nivel 3 | Misma partida, después de que el primer arquero quedara tirado | El juego se ve como trabado: la cámara se aleja sola y el movimiento se siente pastoso | GF | A |
| 3 | Nivel 1 | Disparando contra las paredes del mapa | Las flechas atraviesan los muros. Se nota mucho ahora que las flechas se ven | GF | A |
| 4 | Nivel 1 | Recogiendo monedas de las arañas | La textura de las monedas es un cuadrado amarillo. Desentona con el resto | ANI | B |
| 5 | General | Morí y llegué a la pantalla de Game Over | El texto "Roguelike puro" sobra y suena a jerga. Además el bloque de texto queda pegado al título | UI | B |
| 6 | General | Verificando lo implementado | El guardado, la pausa, las estrellas y el corazón funcionan bien. La barra de progreso resuelve la ceguera de la corrida anterior | UI | B |

---

## Recorrido nivel por nivel

_Completar con la sensación de esta corrida. Sirve para detectar picos de dificultad._

| Nivel | ¿Lo pasaste? | Intentos | ¿Se entendía qué hacer? | Sensación (1-5) | Nota rápida |
|-------|--------------|----------|-------------------------|-----------------|-------------|
| Nivel 1 — El paso de arena | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |
| Nivel 2 — Dunas errantes | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |
| Nivel 3 — Ruinas del oasis | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |
| Nivel 4 — Tormenta de arena | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |
| Boss 5 — El Coloso de Piedra | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |
| Nivel 6 — Catacumbas ardientes | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |
| Nivel 7 — Laberinto de huesos | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |
| Nivel 8 — Fortaleza olvidada | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |
| Nivel 9 — El corazón del desierto | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |
| Boss 10 — El Rey Escorpión | ☐ Sí ☐ No |  | ☐ Sí ☐ No |  |  |

---

## Cierre de la corrida

**Las 3 cosas que más me molestaron, en orden:**

1. Que WASD dejara de responder sin explicación aparente. Parecía que el juego se había colgado.
2. La sensación de "trabado" con la cámara alejándose sola.
3. Las flechas atravesando las paredes: rompe la lógica del escenario.

**Lo que mejor funcionó (para no romperlo después):**

1. El guardado persistente y el botón Continuar: ahora cerrar el navegador no castiga.
2. Las flechas con estela y el arco que apunta: por fin se entiende hacia dónde estás disparando.

**¿Volvería a jugarlo por gusto?** ☑ Sí — el guardado y las estrellas cambian por completo la intención de rejugar.
