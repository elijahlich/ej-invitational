// =====================================================================
// THE EJ INVITATIONAL — lib.js
// One-round, 10-player, 3-tournament scoring library
// =====================================================================

export const COLLECTION = 'ej-2026';

// ---- Schema version ----
// v4 (2026-11): Reliability audit before go-live. Migration now also replaces
// the players list (preserving handicap edits for players still in the field,
// dropping removed players). Writes use a Firestore transaction so concurrent
// scorekeepers can't clobber each other. Added sync status + offline badges
// in the header and a loading-timeout error screen.
// v3 (2026-11): Field reduced to 10 players in 3 groups. Max score capped at
// NET quadruple bogey (gross cap = par + 4 + strokes on that hole).
// v2 (2026-11): AS ref unified with HH/Skins to field-low (Alex 6.2).
// v1 (2026-11): Initial build.
export const SCHEMA_VERSION = 4;

export const MAX_OVER_PAR = 4; // cap any one hole at par + 4

// ---- Course: Higuera Golf Club, Punta Mita MX ----
// Verified from scanned scorecard. Playing White tees.
export const HIGUERA = {
  id: 'higuera',
  name: 'Higuera Golf Club',
  city: 'Punta Mita, MX',
  par: 72,
  // Yardage by hole (White tees)
  yards: [368, 594, 340, 149, 458, 366, 312, 133, 414,
          355, 179, 407, 430, 499, 371, 321, 114, 515],
  // Par by hole
  pars:  [4, 5, 4, 3, 5, 4, 4, 3, 4,
          4, 3, 4, 4, 5, 4, 4, 3, 5],
  // Men's handicap index (SI) by hole
  sis:   [6, 2, 12, 8, 18, 10, 14, 16, 4,
          7, 5, 11, 1, 17, 13, 3, 15, 9],
  // Tee options — playing White
  tees: {
    White: { rating: 69.6, slope: 124 },
    Gold:  { rating: 67.5, slope: 116 },
    Blue:  { rating: 71.6, slope: 132 },
    Black: { rating: 77.8, slope: 145 },
  },
  activeTee: 'White',
};

// Effective course = course + the active tee's rating/slope merged in
export function effectiveCourse(course = HIGUERA) {
  const tee = course.tees[course.activeTee];
  return { ...course, rating: tee.rating, slope: tee.slope };
}

// ---- Players (10 total after cancellations, split into 3 groups) ----
export const DEFAULT_PLAYERS = [
  // Group 1 (foursome)
  { id: 'elijah',  name: 'Elijah Lichtenberg', hcp: 8.3,  groupId: 'g1' },
  { id: 'charlie', name: 'Charlie Bogart',     hcp: 11.7, groupId: 'g1' },
  { id: 'alex',    name: 'Alex Lichtenberg',   hcp: 6.2,  groupId: 'g1' },
  { id: 'jack',    name: 'Jack Ross',          hcp: 20.7, groupId: 'g1' },
  // Group 2 (threesome)
  { id: 'ari',     name: 'Ari Lichtenberg',    hcp: 17.8, groupId: 'g2' },
  { id: 'gary',    name: 'Gary Ross',          hcp: 26.6, groupId: 'g2' },
  { id: 'bo',      name: 'Bo Abrams',          hcp: 16.2, groupId: 'g2' },
  // Group 3 (threesome)
  { id: 'jordan',  name: 'Jordan Bender',      hcp: 11.2, groupId: 'g3' },
  { id: 'lisa',    name: 'Lisa Bender',        hcp: 23.0, groupId: 'g3' },
  { id: 'tom',     name: 'Tom Schiff',         hcp: 12.3, groupId: 'g3' },
];

// ---- Groups (teams for the Anti-Shtick) ----
// Each group is both a tee-time foursome AND the Anti-Shtick team.
export const DEFAULT_GROUPS = [
  { id: 'g1', name: 'Group 1', short: 'G1', teeTime: '1:00 PM' },
  { id: 'g2', name: 'Group 2', short: 'G2', teeTime: '1:10 PM' },
  { id: 'g3', name: 'Group 3', short: 'G3', teeTime: '1:20 PM' },
];

export const DEFAULT_SETTINGS = {
  skinsCarryover: false,       // if true, tied holes carry to next hole
  handicapAllowance: 1.0,      // 1.0 = full strokes (standard for this tournament)
};

// =====================================================================
// CORE MATH
// =====================================================================
export function safeNum(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Cap NET at par + MAX_OVER_PAR (net quadruple bogey). The player's gross
// is therefore capped at (par + 4 + strokes_received_on_this_hole), so a
// player receiving a stroke on this hole can score one more gross than a
// scratch player before being capped. Pass strokes=0 for a plain gross cap.
export function capScore(raw, par, strokes = 0) {
  const n = safeNum(raw);
  if (n == null) return null;
  return Math.min(n, par + MAX_OVER_PAR + (strokes || 0));
}

// USGA Course Handicap formula, rounded to nearest whole stroke.
// Matches usga.org course handicap calculator exactly.
export function courseHandicap(hcpIndex, course) {
  if (!course || hcpIndex == null) return 0;
  const c = course.rating != null ? course : effectiveCourse(course);
  const raw = hcpIndex * (c.slope / 113) + (c.rating - c.par);
  return Math.round(raw);
}

export function applyAllowance(ch, allowance) {
  return Math.round(ch * (allowance ?? 1.0));
}

// Strokes allocated to a specific hole by SI, wrapping for high handicaps.
// E.g. CH 21 → 18 SIs get 1 stroke + top 3 SIs get +1 each = 2 strokes on SI 1,2,3.
export function strokesOnHole(ch, si) {
  if (!ch || ch <= 0) return 0;
  let s = 0;
  if (si <= ch)      s += 1;
  if (si <= ch - 18) s += 1;
  if (si <= ch - 36) s += 1;
  return s;
}

// Differential between a player's CH and a reference player's CH, floored at 0.
export function adjustedCH(playerHcp, refHcp, course, allowance = 1.0) {
  const p = applyAllowance(courseHandicap(playerHcp, course), allowance);
  const r = applyAllowance(courseHandicap(refHcp, course), allowance);
  return Math.max(0, p - r);
}

// Lowest handicap in a list of players (ties broken by name)
export function lowestHcpPlayer(players) {
  if (!players || !players.length) return null;
  return players.reduce((lo, p) => (!lo || p.hcp < lo.hcp ? p : lo), null);
}

// Display helpers
export function fmtScore(n) {
  if (n == null || isNaN(n)) return '—';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

export function fmtToPar(n) {
  if (n == null || isNaN(n)) return '—';
  if (n === 0) return 'E';
  const s = n > 0 ? '+' : '';
  return `${s}${Number.isInteger(n) ? n : n.toFixed(1)}`;
}

// =====================================================================
// HIT A HOUSE — individual net stroke play
// Reference = field-low handicap (Alex, 6.2). Each player's net totaled
// across the 18 holes. Lowest net wins.
// =====================================================================
export function playerRoundTotals(player, playerScores, course, refHcp, allowance = 1.0) {
  const c = effectiveCourse(course);
  const ch = adjustedCH(player.hcp, refHcp, c, allowance);
  let gross = 0, net = 0, played = 0;
  for (let i = 0; i < 18; i++) {
    const str = strokesOnHole(ch, c.sis[i]);
    const s = capScore(playerScores?.[i], c.pars[i], str);
    if (s == null) continue;
    gross += s;
    net   += s - str;
    played++;
  }
  return { gross, net, played, ch };
}

export function computeHitAHouse(players, scores, settings) {
  const course = effectiveCourse(HIGUERA);
  const ref = lowestHcpPlayer(players);
  const allowance = 1.0; // full strokes for HH
  const parThroughN = (n) => course.pars.slice(0, n).reduce((s, p) => s + p, 0);

  const rows = players.map(p => {
    const t = playerRoundTotals(p, scores[p.id], course, ref.hcp, allowance);
    const netToPar = t.played > 0 ? t.net - parThroughN(t.played) : null;
    return { player: p, ...t, netToPar, ch: t.ch };
  });

  // Sort by net asc (unplayed go to bottom). Tiebreakers: fewer gross, then name.
  rows.sort((a, b) => {
    if (a.played === 0 && b.played === 0) return a.player.name.localeCompare(b.player.name);
    if (a.played === 0) return 1;
    if (b.played === 0) return -1;
    if (a.net !== b.net) return a.net - b.net;
    if (a.gross !== b.gross) return a.gross - b.gross;
    return a.player.name.localeCompare(b.player.name);
  });
  return { rows, ref, course };
}

// =====================================================================
// ANTI-SHTICK INVITATIONAL — team (group) match play across 4 teams
// Reference = FIELD-LOW handicap (Alex) — same as HH & Skins, so a group
// containing Alex isn't disadvantaged relative to a group without him.
// On each hole, each group's score = lowest NET in the group.
// Hole winner = lowest group score; 1 point per hole, split N ways on ties.
// =====================================================================
export function computeAntiShtick(players, groups, scores, settings) {
  const course = effectiveCourse(HIGUERA);
  const allowance = settings?.handicapAllowance ?? 1.0;
  const fieldRef = lowestHcpPlayer(players);

  // Per-group: members + per-player CH vs FIELD-LOW (not group-low)
  const groupData = groups.map(g => {
    const members = players.filter(p => p.groupId === g.id);
    const chByPlayer = {};
    members.forEach(p => {
      chByPlayer[p.id] = adjustedCH(p.hcp, fieldRef.hcp, course, allowance);
    });
    return { group: g, members, ref: fieldRef, chByPlayer };
  });

  // Per-hole: compute each group's best net, then determine winner(s)
  const perHole = [];
  const standings = {};
  groups.forEach(g => { standings[g.id] = { group: g, points: 0, holesWon: 0, holesHalved: 0, holesLost: 0, perHole: [] }; });

  for (let h = 0; h < 18; h++) {
    const si = course.sis[h];
    const par = course.pars[h];
    const groupResults = groupData.map(gd => {
      const nets = gd.members.map(p => {
        const str = strokesOnHole(gd.chByPlayer[p.id], si);
        const g = capScore((scores[p.id] || [])[h], par, str);
        if (g == null) return null;
        return { playerId: p.id, gross: g, net: g - str, strokes: str };
      }).filter(Boolean);
      if (nets.length === 0) return { groupId: gd.group.id, best: null, bestBy: null, complete: false };
      const best = Math.min(...nets.map(n => n.net));
      const bestEntries = nets.filter(n => n.net === best);
      return { groupId: gd.group.id, best, bestBy: bestEntries.map(n => n.playerId), complete: nets.length === gd.members.length };
    });

    // Only count holes where every group has at least one score in
    const allIn = groupResults.every(r => r.best != null);
    if (!allIn) {
      perHole.push({ hole: h + 1, par, si, winners: [], points: {}, groupBest: {}, complete: false });
      groupResults.forEach(r => {
        standings[r.groupId].perHole.push({ hole: h + 1, best: r.best, result: null });
      });
      continue;
    }

    const lowestNet = Math.min(...groupResults.map(r => r.best));
    const winners = groupResults.filter(r => r.best === lowestNet).map(r => r.groupId);
    const splitValue = 1 / winners.length;
    const points = {};
    winners.forEach(gid => { points[gid] = splitValue; });

    const groupBest = {};
    groupResults.forEach(r => { groupBest[r.groupId] = r.best; });

    perHole.push({ hole: h + 1, par, si, winners, points, groupBest, complete: true, lowestNet });

    groupResults.forEach(r => {
      const won = winners.includes(r.groupId);
      const halved = won && winners.length > 1;
      const outright = won && winners.length === 1;
      standings[r.groupId].points += points[r.groupId] || 0;
      if (outright) standings[r.groupId].holesWon += 1;
      else if (halved) standings[r.groupId].holesHalved += 1;
      else standings[r.groupId].holesLost += 1;
      standings[r.groupId].perHole.push({
        hole: h + 1,
        best: r.best,
        result: outright ? 'won' : halved ? 'halved' : 'lost',
      });
    });
  }

  const sorted = Object.values(standings).sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.holesWon !== b.holesWon) return b.holesWon - a.holesWon;
    return a.group.name.localeCompare(b.group.name);
  });

  return { standings: sorted, perHole, groupData, course };
}

// =====================================================================
// SKINS — best individual net per hole wins the skin
// Reference = field-low handicap (Alex). If tied: no skin (optional carryover).
// =====================================================================
export function computeSkins(players, scores, settings) {
  const course = effectiveCourse(HIGUERA);
  const ref = lowestHcpPlayer(players);
  const allowance = 1.0;
  // Precompute each player's CH vs field-low
  const chByPlayer = {};
  players.forEach(p => { chByPlayer[p.id] = adjustedCH(p.hcp, ref.hcp, course, allowance); });

  const perHole = [];
  const totals = {};
  players.forEach(p => { totals[p.id] = 0; });
  const carry = settings?.skinsCarryover ?? false;
  let pot = 1;

  for (let h = 0; h < 18; h++) {
    const si = course.sis[h];
    const par = course.pars[h];
    const nets = players.map(p => {
      const str = strokesOnHole(chByPlayer[p.id], si);
      const g = capScore((scores[p.id] || [])[h], par, str);
      if (g == null) return null;
      return { playerId: p.id, gross: g, net: g - str };
    }).filter(Boolean);

    if (nets.length < 2) {
      // Need at least 2 scores to decide a skin
      perHole.push({ hole: h + 1, par, winner: null, value: 0, complete: false });
      continue;
    }

    const bestNet = Math.min(...nets.map(n => n.net));
    const leaders = nets.filter(n => n.net === bestNet);
    if (leaders.length > 1) {
      // Tied — no skin
      perHole.push({ hole: h + 1, par, winner: null, value: 0, complete: true, tied: true });
      if (carry) pot += 1;
      continue;
    }

    const winner = leaders[0].playerId;
    perHole.push({ hole: h + 1, par, winner, value: pot, complete: true, winnerNet: bestNet });
    totals[winner] = (totals[winner] || 0) + pot;
    pot = 1;
  }

  // Overall leaderboard by skin count
  const overall = players.map(p => ({ player: p, skins: totals[p.id] || 0 })).sort((a, b) => {
    if (a.skins !== b.skins) return b.skins - a.skins;
    return a.player.name.localeCompare(b.player.name);
  });

  return { perHole, totals, overall, ref, chByPlayer };
}

// =====================================================================
// MISC
// =====================================================================
export function roundComplete(players, scores) {
  return players.every(p => {
    const arr = scores[p.id] || [];
    return arr.filter(x => safeNum(x) != null).length === 18;
  });
}

export function groupComplete(members, scores) {
  return members.every(p => (scores[p.id] || []).filter(x => safeNum(x) != null).length === 18);
}

// CSV export
export function buildCSV(players, groups, scores) {
  const course = effectiveCourse(HIGUERA);
  const ref = lowestHcpPlayer(players);
  const headers = ['Group', 'Player', 'Index', 'CH vs Alex',
    ...Array.from({ length: 18 }, (_, i) => `H${i + 1}`),
    'Gross', 'Net'];
  const lines = [headers.join(',')];
  players.forEach(p => {
    const grp = groups.find(g => g.id === p.groupId)?.name || '';
    const ch = adjustedCH(p.hcp, ref.hcp, course, 1.0);
    const t = playerRoundTotals(p, scores[p.id], course, ref.hcp, 1.0);
    const cols = [grp, p.name, p.hcp, ch,
      ...Array.from({ length: 18 }, (_, i) => {
        const str = strokesOnHole(ch, course.sis[i]);
        return capScore((scores[p.id] || [])[i], course.pars[i], str) ?? '';
      }),
      t.gross || '', t.net || ''];
    lines.push(cols.map(c => String(c).includes(',') ? `"${c}"` : c).join(','));
  });
  return lines.join('\n');
}

export function downloadCSV(players, groups, scores) {
  const csv = buildCSV(players, groups, scores);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ej-invitational-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Migrate meta if schema changes. Preserves user handicap edits for players
// who remain in the roster; drops players no longer in DEFAULT_PLAYERS;
// adds any new players. Groups + course always refresh from defaults.
export async function migrateMetaIfNeeded(meta, persistMetaFn) {
  if (!meta) return meta;
  const stored = meta._schemaVersion || 1;
  if (stored >= SCHEMA_VERSION) return meta;
  // Preserve edited handicaps (and names) for surviving players
  const existing = {};
  (meta.players || []).forEach(p => { if (p?.id) existing[p.id] = p; });
  const mergedPlayers = DEFAULT_PLAYERS.map(p => {
    const prev = existing[p.id];
    return {
      ...p,
      hcp:  prev && typeof prev.hcp === 'number' ? prev.hcp : p.hcp,
      name: prev && typeof prev.name === 'string' && prev.name.trim() ? prev.name : p.name,
    };
  });
  const migrated = {
    ...meta,
    players: mergedPlayers,
    course:  HIGUERA,
    groups:  DEFAULT_GROUPS,
    _schemaVersion: SCHEMA_VERSION,
  };
  await persistMetaFn(migrated);
  return migrated;
}
