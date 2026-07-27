import { MAX_PLAYERS, REVIVE_HP_RATIO } from './config.js';
import { clearSavedRun, writeSavedRun } from './profile.js';

// La run es la PARTIDA ACTUAL: muere con el jugador y vuelve a cero.
// El progreso que sobrevive a la muerte vive en profile.js.
//
// `players` es un array porque el juego soporta co-op: cada jugador tiene su
// propia vida y su propio estado de caido, pero comparten score, monedas,
// habilidades y mejoras (la run es una sola, la juegan entre dos).

const DEFAULT_UPGRADES = Object.freeze({
  health: 0,
  luck: 0,
  armor: 0,
  speed: 0,
  damage: 0
});

const DEFAULT_RUN = Object.freeze({
  score: 0,
  coins: 0,
  level: 1,
  hpMax: 100,
  coop: false
});

export function createPlayerState(hpMax) {
  return { hp: hpMax, down: false };
}

export function createDefaultRun() {
  return {
    ...DEFAULT_RUN,
    players: [createPlayerState(DEFAULT_RUN.hpMax)],
    skills: [],
    upgrades: { ...DEFAULT_UPGRADES }
  };
}

export function cloneRun(run) {
  return {
    ...run,
    players: (run.players || []).map((player) => ({ ...player })),
    skills: [...(run.skills || [])],
    upgrades: { ...(run.upgrades || DEFAULT_UPGRADES) }
  };
}

/**
 * Repara una run que viene de localStorage: puede estar incompleta, corrupta
 * o venir de una version anterior del juego (cuando `hp` era un solo campo).
 */
export function normalizeRun(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const hpMax = Math.max(1, Math.floor(source.hpMax) || DEFAULT_RUN.hpMax);

  let players = Array.isArray(source.players)
    ? source.players.slice(0, MAX_PLAYERS).map((player) => ({
      hp: Phaser.Math.Clamp(Math.floor(player?.hp ?? hpMax), 0, hpMax),
      down: Boolean(player?.down)
    }))
    : [];

  if (players.length === 0) {
    // Compatibilidad con guardados viejos de un solo jugador.
    const legacyHp = Phaser.Math.Clamp(Math.floor(source.hp ?? hpMax), 0, hpMax);
    players = [{ hp: legacyHp, down: legacyHp <= 0 }];
  }

  return {
    score: Math.max(0, Math.floor(source.score) || 0),
    coins: Math.max(0, Math.floor(source.coins) || 0),
    level: Math.max(1, Math.floor(source.level) || 1),
    hpMax,
    coop: Boolean(source.coop) && players.length > 1,
    players,
    skills: Array.isArray(source.skills) ? [...source.skills] : [],
    upgrades: { ...DEFAULT_UPGRADES, ...(source.upgrades || {}) }
  };
}

export function resetRun(scene) {
  const run = createDefaultRun();
  scene.registry.set('run', run);
  clearSavedRun();
  return run;
}

export function getRun(scene) {
  const current = scene.registry.get('run');
  if (!current) {
    return resetRun(scene);
  }
  return cloneRun(current);
}

export function saveRun(scene, run) {
  scene.registry.set('run', cloneRun(run));
}

/** Vuelca la run al almacenamiento persistente para poder continuarla luego. */
export function checkpointRun(scene, sceneKey) {
  const run = getRun(scene);
  writeSavedRun(run, sceneKey);
  return run;
}

export function loadRunIntoRegistry(scene, rawRun) {
  const run = normalizeRun(rawRun);
  scene.registry.set('run', run);
  return run;
}

// --- Jugadores ----------------------------------------------------------

export function getPlayers(run) {
  return run.players || [];
}

export function getPlayerState(run, index = 0) {
  return getPlayers(run)[index] || null;
}

export function getPlayerCount(scene) {
  return getPlayers(getRun(scene)).length;
}

export function isCoop(scene) {
  return getRun(scene).coop === true;
}

export function isPartyWiped(run) {
  const players = getPlayers(run);
  return players.length > 0 && players.every((player) => player.down);
}

/** Suma la vida de todos los jugadores frente al total posible del equipo. */
export function getPartyHealthRatio(run) {
  const players = getPlayers(run);
  if (players.length === 0) return 0;
  const total = players.reduce((sum, player) => sum + Math.max(0, player.hp), 0);
  return total / (run.hpMax * players.length);
}

/** Suma un segundo jugador a la run en curso (co-op a mitad de nivel). */
export function enableCoop(scene) {
  const run = getRun(scene);
  if (run.players.length >= MAX_PLAYERS) {
    return { run, added: false, index: -1 };
  }

  run.players.push(createPlayerState(run.hpMax));
  run.coop = true;
  saveRun(scene, run);
  return { run, added: true, index: run.players.length - 1 };
}

export function disableCoop(scene) {
  const run = getRun(scene);
  run.players = run.players.slice(0, 1);
  run.coop = false;
  saveRun(scene, run);
  return run;
}

// --- Mutaciones de estado ----------------------------------------------

export function hasSkill(scene, skillId) {
  return getRun(scene).skills.includes(skillId);
}

export function addSkill(scene, skillId) {
  const run = getRun(scene);
  if (!run.skills.includes(skillId)) {
    run.skills.push(skillId);
  }
  saveRun(scene, run);
  return run;
}

export function addCoins(scene, amount) {
  const run = getRun(scene);
  run.coins += Math.max(0, Math.floor(amount));
  saveRun(scene, run);
  return run;
}

export function addScore(scene, amount) {
  const run = getRun(scene);
  run.score += Math.max(0, Math.floor(amount));
  saveRun(scene, run);
  return run;
}

export function setLevel(scene, level) {
  const run = getRun(scene);
  run.level = level;
  saveRun(scene, run);
  return run;
}

export function healPlayer(scene, amount, index = 0) {
  const run = getRun(scene);
  const player = getPlayerState(run, index);
  if (!player || player.down) return { run, healed: 0 };

  const before = player.hp;
  player.hp = Math.min(run.hpMax, player.hp + Math.max(0, Math.round(amount)));
  saveRun(scene, run);
  return { run, healed: player.hp - before };
}

export function healAllPlayers(scene, amount) {
  const run = getRun(scene);
  getPlayers(run).forEach((player) => {
    if (!player.down) {
      player.hp = Math.min(run.hpMax, player.hp + Math.max(0, Math.round(amount)));
    }
  });
  saveRun(scene, run);
  return run;
}

/** Cura y levanta a todo el equipo. Se usa entre niveles, en la tienda. */
export function restoreParty(scene) {
  const run = getRun(scene);
  getPlayers(run).forEach((player) => {
    player.hp = run.hpMax;
    player.down = false;
  });
  saveRun(scene, run);
  return run;
}

export function damagePlayer(scene, rawDamage, index = 0) {
  const run = getRun(scene);
  const player = getPlayerState(run, index);
  if (!player || player.down) {
    return { run, finalDamage: 0, justDowned: false, crossedHalf: false };
  }

  const stats = getDerivedStats(run);
  const finalDamage = Math.max(1, Math.round(rawDamage * (1 - stats.armorReduction)));
  const half = run.hpMax * 0.5;
  const wasAboveHalf = player.hp > half;

  player.hp = Math.max(0, player.hp - finalDamage);

  const justDowned = player.hp <= 0;
  if (justDowned) {
    player.down = true;
  }

  saveRun(scene, run);
  return {
    run,
    finalDamage,
    justDowned,
    crossedHalf: wasAboveHalf && player.hp <= half && player.hp > 0
  };
}

export function revivePlayer(scene, index) {
  const run = getRun(scene);
  const player = getPlayerState(run, index);
  if (!player || !player.down) return { run, revived: false };

  player.down = false;
  player.hp = Math.max(1, Math.round(run.hpMax * REVIVE_HP_RATIO));
  saveRun(scene, run);
  return { run, revived: true };
}

export function buyUpgrade(scene, upgrade) {
  const run = getRun(scene);
  if (run.coins < upgrade.cost) {
    return { ok: false, run, message: 'No tienes monedas suficientes.' };
  }

  run.coins -= upgrade.cost;
  run.upgrades[upgrade.id] += 1;

  if (upgrade.id === 'health') {
    run.hpMax += 20;
    getPlayers(run).forEach((player) => {
      if (!player.down) {
        player.hp = Math.min(run.hpMax, player.hp + 20);
      }
    });
  }

  saveRun(scene, run);
  return { ok: true, run, message: `${upgrade.name} mejorada.` };
}

export function getDerivedStats(run) {
  const upgrades = run.upgrades || DEFAULT_UPGRADES;
  const rapid = run.skills?.includes('rapid') ? 0.67 : 1;

  return {
    moveSpeed: 175 * (1 + upgrades.speed * 0.10),
    arrowDamage: 24 + upgrades.damage * 5,
    shootCooldown: 310 * rapid,
    armorReduction: Math.min(0.65, upgrades.armor * 0.05),
    luckMultiplier: 1 + upgrades.luck * 0.15,
    hpMax: run.hpMax
  };
}
