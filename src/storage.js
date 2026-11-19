// =====================================================================
// Firestore layer — single-tournament shape
// Docs:
//   {COLLECTION}/meta       → { players, groups, course, _schemaVersion }
//   {COLLECTION}/settings   → { skinsCarryover, handicapAllowance }
//   {COLLECTION}/scores     → { [playerId]: [18 integers or nulls] }
// =====================================================================

import {
  doc, getDoc, setDoc, onSnapshot, runTransaction,
} from 'firebase/firestore';
import { db } from './firebase.js';
import {
  COLLECTION, SCHEMA_VERSION, DEFAULT_PLAYERS, DEFAULT_GROUPS, DEFAULT_SETTINGS, HIGUERA,
} from './lib.js';

const metaRef     = () => doc(db, COLLECTION, 'meta');
const settingsRef = () => doc(db, COLLECTION, 'settings');
const scoresRef   = () => doc(db, COLLECTION, 'scores');

// Per-device local storage keys
const MY_PLAYER_KEY = 'ej-me-2026';

export function loadMe() {
  try { return localStorage.getItem(MY_PLAYER_KEY) || null; } catch { return null; }
}
export function persistMe(id) {
  try { if (id) localStorage.setItem(MY_PLAYER_KEY, id); } catch {}
}

// Seed the DB with defaults if empty
export async function loadAll() {
  if (!db) return { meta: null, settings: null, scores: null };
  const [m, s, sc] = await Promise.all([
    getDoc(metaRef()), getDoc(settingsRef()), getDoc(scoresRef()),
  ]);
  let meta = m.data();
  if (!meta) {
    meta = {
      players: DEFAULT_PLAYERS,
      groups: DEFAULT_GROUPS,
      course: HIGUERA,
      _schemaVersion: SCHEMA_VERSION,
    };
    await setDoc(metaRef(), meta);
  }
  let settings = s.data();
  if (!settings) {
    settings = { ...DEFAULT_SETTINGS };
    await setDoc(settingsRef(), settings);
  }
  let scores = sc.data();
  if (!scores) {
    scores = {};
    await setDoc(scoresRef(), scores);
  }
  return { meta, settings, scores };
}

// Real-time subscriptions
export function subscribeAll(callbacks) {
  if (!db) return () => {};
  const u1 = onSnapshot(metaRef(),     (snap) => callbacks.onMeta?.(snap.data()));
  const u2 = onSnapshot(settingsRef(), (snap) => callbacks.onSettings?.(snap.data()));
  const u3 = onSnapshot(scoresRef(),   (snap) => callbacks.onScores?.(snap.data() || {}));
  return () => { u1(); u2(); u3(); };
}

// Atomic single-cell write for a player's hole.
// Uses a Firestore transaction so two scorekeepers writing concurrently
// cannot clobber each other — even for the same player on different holes,
// or across players. Retries once on transient failure (network blip).
export async function persistScoreCell(playerId, holeIdx, value) {
  if (!db) return { ok: false };
  const run = async () => {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(scoresRef());
      const current = snap.data() || {};
      const playerArr = current[playerId] ? [...current[playerId]] : Array(18).fill(null);
      playerArr[holeIdx] = (value === '' || value == null) ? null : Number(value);
      tx.update(scoresRef(), { [playerId]: playerArr });
    });
  };
  try {
    await run();
    return { ok: true };
  } catch (e1) {
    // Retry once after 500ms
    await new Promise(r => setTimeout(r, 500));
    try {
      await run();
      return { ok: true };
    } catch (e2) {
      console.error('persistScoreCell', e2);
      return { ok: false, error: e2 };
    }
  }
}

export async function persistMeta(meta) {
  if (!db) return;
  await setDoc(metaRef(), meta);
}

export async function persistSettings(settings) {
  if (!db) return;
  await setDoc(settingsRef(), settings);
}

export async function persistClearAllScores() {
  if (!db) return;
  await setDoc(scoresRef(), {});
}
