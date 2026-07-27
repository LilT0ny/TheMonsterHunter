# Bitácoras de Playtesting — Examen Práctico

**Equipo:** Anthony Gomez · Anael Molina
**Juego:** The Monster Hunter (Phaser 3 + Tiled)

---

## Las reglas, en corto

1. **Cada integrante juega el juego completo 3 veces.** Del Nivel 1 al Boss 10,
   sin saltar niveles desde el menú.
2. **En solitario y sin hablar entre ustedes** hasta que ambos terminen las 3
   corridas. Esto no es un formalismo: si comentan sobre la marcha, las dos
   bitácoras terminan diciendo lo mismo y el examen pierde sentido.
3. **Anotar durante la partida**, no después.
4. Recién cuando los dos terminen: se juntan, consolidan y reparten las mejoras.

## Los archivos

| Archivo | Quién |
|---|---|
| `bitacora-anthony-corrida-1.md` · `-2` · `-3` | Anthony Gomez |
| `bitacora-anael-corrida-1.md` · `-2` · `-3` | Anael Molina |

Cada uno trae: cabecera con datos de la sesión, tabla de observaciones,
recorrido nivel por nivel y cierre con las 3 molestias principales.

## Reparto de mejoras

La guía define 9 mejoras para equipos de 3 y 12 para equipos de 4. **No menciona
equipos de 2.** La extensión lógica son **6 mejoras** (3 por integrante), pero
hay que **confirmarlo con el profesor** antes de la entrega: de eso depende la
nota.

El catálogo técnico de mejoras ya implementadas está en
[`../MEJORAS_PLAYTESTING.md`](../MEJORAS_PLAYTESTING.md), con la matriz de
asignación lista para completar.

---

## Observaciones ya registradas durante el desarrollo

Lo que sigue son hallazgos **reales**, encontrados jugando el juego durante el
desarrollo y documentados en su momento. No son ejemplos inventados: cada uno
derivó en una mejora concreta que está implementada y verificada.

**Cómo usarlos.** Si alguno de estos lo encontraste vos jugando, copialo a tu
bitácora en la corrida donde te pasó y agregá el detalle de tu partida (qué
estabas haciendo, en qué nivel, cuánto te molestó). Si no lo encontraste vos,
**no lo pongas**: sigue estando en el informe técnico, que es donde corresponde.

### Defectos encontrados jugando

| Observación tal como se reportó | Pilar | Grav. | Mejora derivada |
|---|---|---|---|
| "No me puedo mover con el WASD pero sí con las flechas" | GF | A | #19 Control del último en pie |
| "Se ve como trabado el juego" | GF | A | #20 Cámara cooperativa corregida |
| "Cuando una flecha toca una pared la penetra" | GF | A | #16 Flechas que no atraviesan muros |
| "El progreso no se guarda: recargo y pierdo todo" | UI | A | #1 Progreso persistente |
| "No se escucha el sonido del disparo ni al desplazarse" | SFX | M | #6 Remezcla de audio |
| "No se nota el arma ni las balas al momento de disparar" | ANI | M | #8 y #9 Arma y flechas visibles |
| "No se ve el avance del progreso en cada nivel" | UI | M | #3 Barra de progreso en el HUD |
| "La textura de las monedas es pobre" | ANI | B | #14 Textura de moneda |
| "El arquero no tiene animación al caminar" | ANI | M | #10 Animación de caminata |
| "Los enemigos y sus disparos necesitan mejor textura" | ANI | M | #11 y #12 Rediseño de enemigos |
| "Los efectos de flecha (rayo, fuego, hielo) se ven pobres" | ANI | M | #13 Efectos elementales |
| "El texto 'Roguelike puro' del Game Over sobra" | UI | B | Ajuste de copy y maquetación |

### Fricciones de diseño detectadas

| Observación tal como se reportó | Pilar | Grav. | Mejora derivada |
|---|---|---|---|
| "No hay una intro que explique de qué se trata el juego" | UI | M | #4 Pantalla de introducción |
| "Falta un botón de pausa" | UI | M | #5 Menú de pausa |
| "Faltan arbustos para cubrirse del atacante" | DN | M | #22 Arbustos de cobertura |
| "Al bajar al 50% de vida no hay forma de recuperarse" | GF | M | #17 Corazón de emergencia |
| "No hay nada que premie rejugar un nivel" | UI | M | #2 Sistema de 3 estrellas |
| "Apuntar y moverme a la vez se hace pesado" | GF | M | #15 Autodisparo con tecla F |
| "Mientras más niveles paso, más fácil se vuelve" | DN | A | #24 Curva de dificultad |
| "En los niveles de boss solo está el boss" | DN | M | #25 Arenas de jefe pobladas |
| "El Nivel 2 necesita un enemigo que se duplique con el tiempo" | DN | M | #23 Limo verde que se parte |
| "La opción de compañero debería salir al morir, no en el Nivel 3" | GF | M | #21 Compañero al morir |

---

## Qué buscar en las 3 corridas

El juego cambió mucho. Estas son áreas que **todavía no se auditaron a fondo** y
donde es probable que aparezcan cosas nuevas:

- **Niveles 6, 7 y 8.** Recibieron los ajustes de dificultad pero nunca se
  jugaron completos después del cambio. La lava del 6, la emboscada del 7 y los
  guardianes con escudo del 8 son candidatos a fricción.
- **Curva de dificultad.** El Nivel 9 llega a 22 enemigos simultáneos. ¿Se
  siente exigente o se siente injusto? ¿En qué nivel notás el salto?
- **Modo cooperativo.** Solo se probó en tramos sueltos, nunca una campaña
  completa de punta a punta con dos personas.
- **Música.** Es el pilar con menos mejoras registradas (2 de 25, y ambas de
  SFX). ¿La música corta al reiniciar? ¿Se superpone al cambiar de escena?
  ¿Aburre a los diez minutos?
- **Las tres estrellas.** ¿Son alcanzables en todos los niveles? La tercera
  ("no dejar ningún enemigo vivo") es la más frágil.
- **Tienda y habilidades.** ¿Alguna mejora se siente inútil? ¿Alguna habilidad
  rompe el juego?

Anotá también lo que **te guste**. Saber qué funciona evita romperlo después.
