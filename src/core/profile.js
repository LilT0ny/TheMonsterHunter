import { STARS_PER_LEVEL, TOTAL_LEVELS } from './config.js';

// --- Perfil persistente vs. run efimera ---------------------------------
//
// runState.js maneja la PARTIDA ACTUAL: se resetea al morir, es la economia
// del roguelike. Este modulo maneja el PERFIL DEL JUGADOR: sobrevive a la
// muerte y al refresco del navegador. Son dos ciclos de vida distintos y por
// eso viven en modulos distintos.
//
// Si las estrellas vivieran dentro de la run, se perderian cada vez que el
// jugador muere, que es justo cuando mas hacen falta como incentivo.

const PROFILE_KEY = 'tmh_profile_v1';
const SAVE_KEY = 'tmh_save_v1';

const DEFAULT_PROFILE = Object.freeze({
  introSeen: false,
  maxLevelUnlocked: 1,
  stars: {},
  bestScore: 0,
  runsCompleted: 0,
  autoFire: false
});

function readJson(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    // Storage corrupto, deshabilitado o modo privado: seguimos con defaults.
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // Cuota llena o storage bloqueado: el juego sigue, solo se pierde el guardado.
    return false;
  }
}

function removeKey(key) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Nada que hacer, el perfil simplemente no se limpia.
  }
}

function normalizeProfile(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const stars = {};

  Object.entries(source.stars || {}).forEach(([level, value]) => {
    const levelNumber = Number(level);
    const amount = Number(value);
    if (Number.isFinite(levelNumber) && Number.isFinite(amount)) {
      stars[levelNumber] = Math.max(0, Math.min(STARS_PER_LEVEL, Math.floor(amount)));
    }
  });

  return {
    introSeen: Boolean(source.introSeen),
    maxLevelUnlocked: Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(source.maxLevelUnlocked) || 1)),
    stars,
    bestScore: Math.max(0, Math.floor(source.bestScore) || 0),
    runsCompleted: Math.max(0, Math.floor(source.runsCompleted) || 0),
    autoFire: Boolean(source.autoFire)
  };
}

// --- Perfil -------------------------------------------------------------

export function getProfile(scene) {
  let profile = scene.registry.get('profile');
  if (!profile) {
    profile = normalizeProfile(readJson(PROFILE_KEY, DEFAULT_PROFILE));
    scene.registry.set('profile', profile);
  }
  return profile;
}

export function persistProfile(scene, profile) {
  const normalized = normalizeProfile(profile);
  scene.registry.set('profile', normalized);
  writeJson(PROFILE_KEY, normalized);
  return normalized;
}

export function getStars(scene, levelNumber) {
  return getProfile(scene).stars[levelNumber] || 0;
}

export function getTotalStars(scene) {
  return Object.values(getProfile(scene).stars).reduce((sum, amount) => sum + amount, 0);
}

export function getMaxTotalStars() {
  return TOTAL_LEVELS * STARS_PER_LEVEL;
}

export function isLevelUnlocked(scene, levelNumber) {
  return levelNumber <= getProfile(scene).maxLevelUnlocked;
}

/**
 * Guarda el resultado de un nivel. Las estrellas nunca bajan: si el jugador
 * ya habia sacado 3 y vuelve a pasar con 1, conserva las 3.
 */
export function recordLevelResult(scene, levelNumber, starsEarned, score = 0) {
  const profile = getProfile(scene);
  const previous = profile.stars[levelNumber] || 0;
  const earned = Math.max(0, Math.min(STARS_PER_LEVEL, starsEarned));

  profile.stars[levelNumber] = Math.max(previous, earned);
  profile.maxLevelUnlocked = Math.max(
    profile.maxLevelUnlocked,
    Math.min(TOTAL_LEVELS, levelNumber + 1)
  );
  profile.bestScore = Math.max(profile.bestScore, score);

  persistProfile(scene, profile);
  return { previous, earned, best: profile.stars[levelNumber], improved: earned > previous };
}

export function markRunCompleted(scene, score = 0) {
  const profile = getProfile(scene);
  profile.runsCompleted += 1;
  profile.bestScore = Math.max(profile.bestScore, score);
  return persistProfile(scene, profile);
}

export function isAutoFireEnabled(scene) {
  return getProfile(scene).autoFire;
}

/** El autodisparo es una preferencia del jugador, no de la partida: persiste. */
export function setAutoFire(scene, enabled) {
  const profile = getProfile(scene);
  profile.autoFire = Boolean(enabled);
  return persistProfile(scene, profile);
}

export function isIntroSeen(scene) {
  return getProfile(scene).introSeen;
}

export function markIntroSeen(scene) {
  const profile = getProfile(scene);
  if (profile.introSeen) return profile;
  profile.introSeen = true;
  return persistProfile(scene, profile);
}

export function resetProfile(scene) {
  const fresh = normalizeProfile(DEFAULT_PROFILE);
  scene.registry.set('profile', fresh);
  writeJson(PROFILE_KEY, fresh);
  clearSavedRun();
  return fresh;
}

// --- Partida guardada (continuar donde quedaste) ------------------------

export function writeSavedRun(run, sceneKey) {
  if (!run || !sceneKey) return false;
  return writeJson(SAVE_KEY, { run, sceneKey, savedAt: Date.now() });
}

export function readSavedRun() {
  const saved = readJson(SAVE_KEY, null);
  if (!saved || !saved.run || !saved.sceneKey) return null;
  return saved;
}

export function hasSavedRun() {
  return readSavedRun() !== null;
}

export function clearSavedRun() {
  removeKey(SAVE_KEY);
}
