import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy, Users, Edit3, X, ChevronLeft, ChevronRight, Star, User,
  Trash2, Plus, Settings as SettingsIcon, Download, Clipboard, BarChart3, Sun,
  Wifi, WifiOff, Check, Loader2,
} from 'lucide-react';
import { C, styles, monoFamily } from './styles.js';
import {
  HIGUERA, effectiveCourse, lowestHcpPlayer, courseHandicap, adjustedCH,
  strokesOnHole, capScore, safeNum, fmtScore, fmtToPar,
  computeHitAHouse, computeAntiShtick, computeSkins,
  playerRoundTotals, downloadCSV, MAX_OVER_PAR,
} from './lib.js';

// =====================================================================
// SHARED: tiny UI bits
// =====================================================================
function SectionTitle({ eyebrow, title, subtitle, icon: Icon }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={styles.sectionEyebrow}>{eyebrow}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && <Icon size={22} color={C.green} />}
        <div style={styles.sectionTitle}>{title}</div>
      </div>
      {subtitle && <div style={styles.sectionSubtitle}>{subtitle}</div>}
    </div>
  );
}

function Tag({ label, tone = 'neutral' }) {
  const palette = {
    gold:    { bg: C.goldPaper,   fg: C.goldDark,  bd: C.gold },
    green:   { bg: C.greenPaper,  fg: C.greenDark, bd: C.green },
    red:     { bg: C.redSubtle,   fg: C.red,       bd: C.red },
    neutral: { bg: C.paperAlt,    fg: C.inkSoft,   bd: C.border },
  }[tone] || { bg: C.paperAlt, fg: C.inkSoft, bd: C.border };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: palette.bg, color: palette.fg, border: `1px solid ${palette.bd}`,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: 'Manrope, sans-serif',
    }}>{label}</span>
  );
}

// Decorative palm-silhouette watermark for header backgrounds
function PalmWatermark({ right = -20, top = -10, opacity = 0.08, size = 180 }) {
  return (
    <svg viewBox="0 0 100 100" style={{
      position: 'absolute', right, top, width: size, height: size,
      opacity, pointerEvents: 'none',
    }}>
      <g fill={C.gold}>
        <path d="M50 40 Q35 25 20 30 Q32 32 45 40 Q30 32 18 42 Q32 40 48 44 Q33 46 25 55 Q38 48 50 48 Z" />
        <circle cx="30" cy="35" r="5" />
        <rect x="48" y="40" width="4" height="50" rx="1" />
      </g>
    </svg>
  );
}

// =====================================================================
// HEADER
// =====================================================================
export function Header({ myPlayer, onChangeMe, syncState = 'idle', isOnline = true }) {
  // Status badge: "Live" when connected & idle, "Saving..." while writing,
  // "Saved" briefly after success, "Offline" if browser reports no network.
  let statusLabel = 'Live';
  let StatusIcon  = Wifi;
  let statusColor = C.gold;
  if (!isOnline) { statusLabel = 'Offline'; StatusIcon = WifiOff; statusColor = '#ff8888'; }
  else if (syncState === 'saving') { statusLabel = 'Saving…'; StatusIcon = Loader2; statusColor = C.gold; }
  else if (syncState === 'saved')  { statusLabel = 'Saved';   StatusIcon = Check;    statusColor = C.gold; }
  else if (syncState === 'error')  { statusLabel = 'Retry';   StatusIcon = WifiOff;  statusColor = '#ff8888'; }

  return (
    <div style={styles.header}>
      <PalmWatermark />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* EJ Monogram */}
            <div style={{
              width: 36, height: 36,
              background: C.gold,
              color: C.greenDark,
              fontFamily: 'Fraunces, serif',
              fontWeight: 700,
              fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              letterSpacing: '-0.02em',
            }}>EJ</div>
            <div>
              <div style={styles.headerTitle}>The <span style={{ fontStyle: 'italic', color: C.gold }}>Invitational</span></div>
              <div style={styles.headerSubtitle}>Higuera Golf Club · Punta Mita · Nov 19, 2026</div>
            </div>
          </div>
          {/* Sync + connection badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 999,
            background: 'rgba(250, 247, 240, 0.12)',
            border: `1px solid ${statusColor}`,
            color: statusColor,
            fontSize: 10, fontWeight: 700, fontFamily: 'Manrope, sans-serif',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}>
            <StatusIcon size={10} />
            {statusLabel}
          </div>
        </div>
        <button onClick={onChangeMe} style={styles.mePill}>
          <User size={11} />
          <span>{myPlayer ? myPlayer.name : 'Set who you are'}</span>
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// BOARDS VIEW — three leaderboards stacked, with tab switcher
// =====================================================================
export function BoardsView({ meta, scores, settings }) {
  const [tab, setTab] = useState('hitAHouse');
  const hahData = useMemo(() => computeHitAHouse(meta.players, scores, settings), [meta, scores, settings]);
  const asData  = useMemo(() => computeAntiShtick(meta.players, meta.groups, scores, settings), [meta, scores, settings]);
  const skData  = useMemo(() => computeSkins(meta.players, scores, settings), [meta, scores, settings]);

  const tabs = [
    { id: 'hitAHouse',  label: 'Hit a House', icon: Trophy },
    { id: 'antiShtick', label: 'Anti-Shtick', icon: Users },
    { id: 'skins',      label: 'Skins',       icon: Sun },
  ];

  return (
    <div style={styles.scrollBody}>
      <SectionTitle
        eyebrow="Leaderboards · Live"
        title="Standings"
        subtitle="Updates in real time as scores come in"
        icon={BarChart3}
      />

      {/* Tab row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 6px',
            border: `1px solid ${tab === t.id ? C.green : C.border}`,
            background: tab === t.id ? C.green : C.paper,
            color: tab === t.id ? C.paper : C.inkSoft,
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hitAHouse'  && <HitAHouseBoard data={hahData} meta={meta} />}
      {tab === 'antiShtick' && <AntiShtickBoard data={asData} meta={meta} />}
      {tab === 'skins'      && <SkinsBoard data={skData} meta={meta} />}
    </div>
  );
}

function HitAHouseBoard({ data, meta }) {
  const { rows, ref, course } = data;
  const played = rows.some(r => r.played > 0);
  const champ = played && rows[0]?.played === 18;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {champ && (
        <div style={styles.championBanner}>
          <Trophy size={22} color={C.greenDark} />
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>Hit a House Champion</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, lineHeight: 1 }}>{rows[0].player.name}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              Net <span style={{ fontFamily: monoFamily, fontWeight: 700 }}>{rows[0].net}</span> · Gross {rows[0].gross}
            </div>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <div style={{ padding: '12px 14px 6px', borderBottom: `1px solid ${C.border}` }}>
          <div style={styles.sectionEyebrow}>Individual · Net Stroke Play</div>
          <div style={{ fontSize: 11, color: C.inkSoft }}>Strokes off {ref.name} ({ref.hcp.toFixed(1)}) · {course.name}, White tees</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Player</th>
                <th style={styles.th}>Idx</th>
                <th style={styles.th}>Thru</th>
                <th style={styles.th}>Gross</th>
                <th style={{ ...styles.th, color: C.green }}>Net</th>
                <th style={styles.th}>To Par</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const topRank = r.played > 0 && i === 0;
                return (
                  <tr key={r.player.id} style={i % 2 ? styles.trAlt : styles.tr}>
                    <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: topRank ? C.red : C.inkSoft }}>
                      {r.played > 0 ? i + 1 : '–'}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'left', fontWeight: 600, color: C.greenDark }}>{r.player.name}</td>
                    <td style={{ ...styles.td, color: C.inkSoft, fontSize: 11 }}>{r.player.hcp.toFixed(1)}</td>
                    <td style={{ ...styles.td, ...styles.tdMono, fontSize: 11, color: C.inkSoft }}>{r.played}/18</td>
                    <td style={{ ...styles.td, ...styles.tdMono }}>{r.played > 0 ? r.gross : '—'}</td>
                    <td style={{ ...styles.td, ...styles.tdMono, background: topRank ? C.goldSubtle : 'transparent' }}>
                      {r.played > 0 ? fmtScore(r.net) : '—'}
                    </td>
                    <td style={{ ...styles.td, ...styles.tdMono, color: C.inkSoft, fontSize: 12 }}>
                      {r.netToPar != null ? fmtToPar(r.netToPar) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AntiShtickBoard({ data, meta }) {
  const { standings, perHole, groupData } = data;
  const played = standings.some(s => s.perHole.some(h => h.result != null));
  const totalCompleted = perHole.filter(h => h.complete).length;
  const champ = played && totalCompleted === 18;
  const leader = standings[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {champ && (
        <div style={styles.championBanner}>
          <Trophy size={22} color={C.greenDark} />
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>Anti-Shtick Champion</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, lineHeight: 1 }}>{leader.group.name}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              <span style={{ fontFamily: monoFamily, fontWeight: 700 }}>{leader.points.toFixed(1)}</span> pts
            </div>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <div style={{ padding: '12px 14px 6px', borderBottom: `1px solid ${C.border}` }}>
          <div style={styles.sectionEyebrow}>Team · Group Match Play</div>
          <div style={{ fontSize: 11, color: C.inkSoft }}>Best net in each group counts · Low wins the hole (ties split)</div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
              <th style={{ ...styles.th, textAlign: 'left' }}>Group</th>
              <th style={styles.th}>Won</th>
              <th style={styles.th}>Halved</th>
              <th style={styles.th}>Lost</th>
              <th style={{ ...styles.th, color: C.green }}>Points</th>
              <th style={styles.th}>Thru</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const gd = groupData.find(g => g.group.id === s.group.id);
              const topRank = played && i === 0;
              const thru = s.perHole.filter(h => h.result != null).length;
              return (
                <tr key={s.group.id} style={i % 2 ? styles.trAlt : styles.tr}>
                  <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: topRank ? C.red : C.inkSoft }}>
                    {played ? i + 1 : '–'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: C.greenDark, fontSize: 14 }}>{s.group.name}</div>
                    <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 1 }}>
                      {gd?.members.map(p => p.name.split(' ')[0]).join(' · ')}
                    </div>
                  </td>
                  <td style={{ ...styles.td, ...styles.tdMono }}>{s.holesWon}</td>
                  <td style={{ ...styles.td, ...styles.tdMono, color: C.inkSoft }}>{s.holesHalved}</td>
                  <td style={{ ...styles.td, ...styles.tdMono, color: C.inkSoft }}>{s.holesLost}</td>
                  <td style={{ ...styles.td, ...styles.tdMono, background: topRank ? C.goldSubtle : 'transparent', fontSize: 15 }}>
                    {s.points.toFixed(1)}
                  </td>
                  <td style={{ ...styles.td, ...styles.tdMono, color: C.inkSoft, fontSize: 11 }}>{thru}/18</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Per-hole breakdown */}
      <div style={styles.card}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
          <div style={styles.sectionEyebrow}>Hole by Hole</div>
        </div>
        <div style={{ padding: '10px 14px', overflowX: 'auto' }}>
          <table style={{ ...styles.table, fontSize: 10 }}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left', padding: '6px 4px' }}>Hole</th>
                {standings.map(s => (
                  <th key={s.group.id} style={{ ...styles.th, padding: '6px 4px' }}>{s.group.short}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perHole.map((h, i) => (
                <tr key={h.hole} style={i % 2 ? styles.trAlt : styles.tr}>
                  <td style={{ padding: '4px', fontFamily: monoFamily, color: C.inkSoft, fontSize: 10, textAlign: 'left' }}>
                    {h.hole} <span style={{ color: C.ashLight }}>(p{h.par})</span>
                  </td>
                  {standings.map(s => {
                    const best = h.groupBest?.[s.group.id];
                    const won = h.winners?.includes(s.group.id);
                    const split = won && h.winners.length > 1;
                    return (
                      <td key={s.group.id} style={{
                        padding: '4px',
                        textAlign: 'center',
                        fontFamily: monoFamily,
                        fontSize: 11,
                        fontWeight: won ? 700 : 400,
                        color: best == null ? C.ashLight : (won ? (split ? C.gold : C.red) : C.ink),
                        background: won && !split ? C.redSubtle : (split ? C.goldSubtle : 'transparent'),
                      }}>
                        {best != null ? best : '·'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SkinsBoard({ data, meta }) {
  const { perHole, overall, ref } = data;
  const totalSkins = perHole.filter(h => h.winner).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styles.card}>
        <div style={{ padding: '12px 14px 6px', borderBottom: `1px solid ${C.border}` }}>
          <div style={styles.sectionEyebrow}>Skins · Best Net Per Hole</div>
          <div style={{ fontSize: 11, color: C.inkSoft }}>Strokes off {ref.name} · {totalSkins} of 18 skins decided</div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
              <th style={{ ...styles.th, textAlign: 'left' }}>Player</th>
              <th style={styles.th}>Group</th>
              <th style={{ ...styles.th, color: C.green }}>Skins</th>
            </tr>
          </thead>
          <tbody>
            {overall.map((r, i) => {
              const grp = meta.groups.find(g => g.id === r.player.groupId);
              const hasSkins = r.skins > 0;
              const topRank = hasSkins && i === 0;
              return (
                <tr key={r.player.id} style={i % 2 ? styles.trAlt : styles.tr}>
                  <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: topRank ? C.red : C.inkSoft }}>
                    {hasSkins ? i + 1 : '–'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'left', fontWeight: 600, color: C.greenDark }}>{r.player.name}</td>
                  <td style={{ ...styles.td, color: C.inkSoft, fontSize: 11 }}>{grp?.short || ''}</td>
                  <td style={{ ...styles.td, ...styles.tdMono, background: topRank ? C.goldSubtle : 'transparent', fontSize: 16, color: hasSkins ? C.greenDark : C.ashLight }}>
                    {r.skins}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Per-hole skin winners */}
      {totalSkins > 0 && (
        <div style={styles.card}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
            <div style={styles.sectionEyebrow}>Skin by Hole</div>
          </div>
          <div style={{ padding: '6px 14px 10px' }}>
            {perHole.filter(h => h.winner || h.tied).map(h => {
              const p = meta.players.find(pl => pl.id === h.winner);
              return (
                <div key={h.hole} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px dashed ${C.borderSoft}`, fontSize: 12 }}>
                  <div style={{ fontFamily: monoFamily, color: C.inkSoft }}>Hole {h.hole} <span style={{ color: C.ashLight }}>(par {h.par})</span></div>
                  <div>
                    {p ? (
                      <><span style={{ fontWeight: 600, color: C.greenDark }}>{p.name}</span> <span style={{ color: C.red, fontFamily: monoFamily, fontWeight: 700 }}>net {h.winnerNet}</span>{h.value > 1 && <span style={{ color: C.gold, marginLeft: 6, fontWeight: 700 }}>×{h.value}</span>}</>
                    ) : (
                      <span style={{ color: C.ashLight, fontStyle: 'italic' }}>Tied — no skin</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// SCORING VIEW — pick group, then enter hole-by-hole
// =====================================================================
export function ScoringView({ meta, scores, settings, me, onScoreUpdate, focusedHandlers }) {
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    if (me) {
      const mePlayer = meta.players.find(p => p.id === me);
      if (mePlayer) return mePlayer.groupId;
    }
    return null;
  });

  // Reset selection if "me" changes
  useEffect(() => {
    if (me && !selectedGroupId) {
      const mePlayer = meta.players.find(p => p.id === me);
      if (mePlayer) setSelectedGroupId(mePlayer.groupId);
    }
  }, [me]);

  if (!selectedGroupId) {
    return <GroupPicker meta={meta} scores={scores} me={me} onPick={setSelectedGroupId} />;
  }

  const group = meta.groups.find(g => g.id === selectedGroupId);
  const members = meta.players.filter(p => p.groupId === selectedGroupId);
  return (
    <HoleEntry
      group={group}
      members={members}
      meta={meta}
      scores={scores}
      settings={settings}
      me={me}
      onBack={() => setSelectedGroupId(null)}
      onScoreUpdate={onScoreUpdate}
      focusedHandlers={focusedHandlers}
    />
  );
}

function GroupPicker({ meta, scores, me, onPick }) {
  return (
    <div style={styles.scrollBody}>
      <SectionTitle
        eyebrow="Score Entry"
        title="Pick your group"
        subtitle="Tap the group you're playing with to start scoring"
        icon={Clipboard}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {meta.groups.map(g => {
          const members = meta.players.filter(p => p.groupId === g.id);
          const includesMe = me && members.some(p => p.id === me);
          const played = members.every(p => (scores[p.id] || []).filter(x => safeNum(x) != null).length > 0);
          const complete = members.every(p => (scores[p.id] || []).filter(x => safeNum(x) != null).length === 18);
          return (
            <button key={g.id} onClick={() => onPick(g.id)} style={{
              ...styles.card,
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              borderColor: includesMe ? C.gold : C.border,
              borderWidth: includesMe ? 2 : 1,
              background: includesMe ? C.goldSubtle : C.paper,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.greenDark, fontSize: 20 }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>{g.teeTime} · {members.length} players</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                  {includesMe && <Tag label="Your group" tone="gold" />}
                  {complete ? <Tag label="Complete" tone="green" /> : played ? <Tag label="In progress" tone="neutral" /> : null}
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>
                {members.map((p, i) => {
                  const isMe = p.id === me;
                  return (
                    <span key={p.id} style={{ color: isMe ? C.red : C.ink, fontWeight: isMe ? 700 : 400, marginRight: 10 }}>
                      {p.name}
                      <span style={{ color: C.ashLight, fontSize: 10, marginLeft: 3 }}>({p.hcp.toFixed(1)})</span>
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HoleEntry({ group, members, meta, scores, settings, me, onBack, onScoreUpdate, focusedHandlers }) {
  const course = effectiveCourse(HIGUERA);
  const fieldRef = lowestHcpPlayer(meta.players);  // Alex (6.2) — single ref for all 3 tournaments
  const allowance = settings?.handicapAllowance ?? 1.0;

  const [currentHole, setCurrentHole] = useState(0);
  const [showJumper, setShowJumper] = useState(false);
  const hole = currentHole;
  const par = course.pars[hole];
  const si = course.sis[hole];
  const yards = course.yards[hole];

  // Single stroke count per player per hole — all three tournaments
  // (Hit a House, Anti-Shtick, Skins) now use field-low as the reference,
  // so the dot count is the same for every tournament.
  const strokesByPlayer = useMemo(() => {
    const out = {};
    members.forEach(p => {
      const ch = adjustedCH(p.hcp, fieldRef.hcp, course, 1.0);
      out[p.id] = strokesOnHole(ch, si);
    });
    return out;
  }, [members, fieldRef, course, si]);

  return (
    <div style={styles.scrollBody}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <button onClick={onBack} style={{ ...styles.iconBtn, marginBottom: 6 }}>
            <ChevronLeft size={18} color={C.green} />
          </button>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 12, color: C.green, fontWeight: 600, letterSpacing: '0.04em' }}>
            {group.name} · {group.teeTime}
          </div>
          <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>{course.name} · White tees</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: C.inkSoft, marginTop: 6 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: C.green }} />
            <span>Strokes received this hole (counts for all 3 tournaments)</span>
          </div>
        </div>
        <button onClick={() => setShowJumper(true)} style={{
          padding: '6px 10px',
          background: C.paperAlt,
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          color: C.greenDark,
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'Manrope, sans-serif',
          cursor: 'pointer',
        }}>Holes</button>
      </div>

      {/* Hole header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`,
        color: C.paper,
        borderRadius: 12,
        padding: '18px 20px',
        marginBottom: 14,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <PalmWatermark right={-10} top={-30} size={140} opacity={0.12} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, color: C.gold, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Hole</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 68, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{hole + 1}</div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: C.gold, lineHeight: 1 }}>Par {par}</div>
          <div style={{ fontSize: 11, color: C.paper, opacity: 0.8, marginTop: 4 }}>SI {si} · {yards} yds</div>
        </div>
      </div>

      {/* Player rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {members.map(p => (
          <PlayerHoleRow
            key={p.id}
            player={p}
            isMe={p.id === me}
            strokes={strokesByPlayer[p.id] ?? 0}
            par={par}
            currentScore={(scores[p.id] || [])[hole]}
            onChange={(val) => onScoreUpdate(p.id, hole, val)}
            focusedHandlers={focusedHandlers}
          />
        ))}
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          onClick={() => setCurrentHole(h => Math.max(0, h - 1))}
          disabled={hole === 0}
          style={{
            ...styles.secondaryBtn,
            padding: '14px',
            opacity: hole === 0 ? 0.4 : 1,
            cursor: hole === 0 ? 'not-allowed' : 'pointer',
          }}>
          <ChevronLeft size={16} style={{ verticalAlign: 'middle' }} /> Previous
        </button>
        <button
          onClick={() => hole === 17 ? onBack() : setCurrentHole(h => Math.min(17, h + 1))}
          style={{ ...styles.primaryBtn, padding: '14px' }}>
          {hole === 17 ? 'Finish Round' : 'Next Hole'} <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
        </button>
      </div>

      {/* Hole jumper modal */}
      {showJumper && (
        <div style={styles.modalBackdrop} onClick={() => setShowJumper(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18, color: C.greenDark }}>Jump to Hole</div>
              <button onClick={() => setShowJumper(false)} style={styles.iconBtn}><X size={18} color={C.green} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {Array.from({ length: 18 }).map((_, i) => {
                const played = members.every(p => safeNum((scores[p.id] || [])[i]) != null);
                const partial = members.some(p => safeNum((scores[p.id] || [])[i]) != null);
                const current = i === hole;
                return (
                  <button key={i} onClick={() => { setCurrentHole(i); setShowJumper(false); }} style={{
                    padding: '10px 0',
                    background: current ? C.green : played ? C.greenPaper : partial ? C.goldSubtle : C.paper,
                    color: current ? C.paper : played ? C.greenDark : C.ink,
                    border: `1px solid ${current ? C.green : C.border}`,
                    borderRadius: 6,
                    fontFamily: monoFamily,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}>{i + 1}</button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerHoleRow({ player, isMe, strokes, par, currentScore, onChange, focusedHandlers }) {
  const [local, setLocal] = useState(currentScore != null ? String(currentScore) : '');
  useEffect(() => { setLocal(currentScore != null ? String(currentScore) : ''); }, [currentScore]);

  // Cap NET at par + 4 → gross cap is par + 4 + strokes received this hole.
  // A player getting a stroke can score one more gross before being capped.
  const max = par + MAX_OVER_PAR + (strokes || 0);
  const handleBlur = () => {
    focusedHandlers?.onBlur?.();
    if (local === '' || local == null) { onChange(null); return; }
    const n = parseInt(local, 10);
    if (!Number.isFinite(n) || n < 1) { setLocal(currentScore != null ? String(currentScore) : ''); return; }
    const capped = Math.min(n, max);
    setLocal(String(capped));
    onChange(capped);
  };

  // Score-vs-par coloring
  let bg = C.paper, fg = C.greenDark;
  const n = parseInt(local, 10);
  if (Number.isFinite(n) && n > 0) {
    const d = n - par;
    if (d <= -2)       { bg = C.redSubtle;  fg = C.redDeep; }
    else if (d === -1) { bg = C.redSubtle;  fg = C.red; }
    else if (d === 0)  { bg = C.paper;      fg = C.ink; }
    else if (d === 1)  { bg = C.paperAlt;   fg = C.ink; }
    else               { bg = C.greenPaper; fg = C.greenDark; }
  }

  const hasDots = strokes > 0;
  const label = hasDots ? `${strokes} stroke${strokes !== 1 ? 's' : ''}` : null;

  return (
    <div style={{
      ...styles.playerScoreRow,
      borderColor: isMe ? C.gold : C.border,
      borderWidth: isMe ? 2 : 1,
    }}>
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600, color: C.greenDark, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {player.name}
          {hasDots && (
            <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
              {Array.from({ length: strokes }).map((_, i) => (
                <span key={i} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: C.green }} />
              ))}
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>
          Idx {player.hcp.toFixed(1)}
          {label && <span style={{ marginLeft: 8, fontWeight: 600 }}>· {label}</span>}
        </div>
      </div>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={focusedHandlers?.onFocus}
        onBlur={handleBlur}
        style={{ ...styles.scoreInputBig, background: bg, color: fg }}
        placeholder="–"
      />
    </div>
  );
}

// =====================================================================
// PLAYERS VIEW — edit handicaps, view scorecard
// =====================================================================
export function PlayersView({ meta, settings, scores, onUpdatePlayer }) {
  const ref = lowestHcpPlayer(meta.players);
  const [scorecardFor, setScorecardFor] = useState(null);

  return (
    <div style={styles.scrollBody}>
      <SectionTitle
        eyebrow={`Field · ${meta.players.length} Players`}
        title="Players"
        subtitle="Edit indices · view live scorecards"
        icon={Users}
      />
      {meta.groups.map(g => {
        const members = meta.players.filter(p => p.groupId === g.id);
        return (
          <div key={g.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 15, color: C.greenDark }}>{g.name}</div>
              <div style={{ fontSize: 10, color: C.inkSoft, letterSpacing: '0.04em' }}>{g.teeTime}</div>
            </div>
            <div style={styles.card}>
              {members.map((p, i) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  isRef={p.id === ref.id}
                  isLast={i === members.length - 1}
                  course={effectiveCourse(HIGUERA)}
                  refHcp={ref.hcp}
                  onUpdate={(patch) => onUpdatePlayer(p.id, patch)}
                  onOpenScorecard={() => setScorecardFor(p.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {scorecardFor && (
        <ScorecardModal
          player={meta.players.find(p => p.id === scorecardFor)}
          meta={meta}
          scores={scores}
          onClose={() => setScorecardFor(null)}
        />
      )}
      <div style={{ height: 40 }} />
    </div>
  );
}

function PlayerRow({ player, isRef, isLast, course, refHcp, onUpdate, onOpenScorecard }) {
  const [name, setName] = useState(player.name);
  const [hcp, setHcp]   = useState(String(player.hcp));
  useEffect(() => { setName(player.name); setHcp(String(player.hcp)); }, [player.name, player.hcp]);

  const ch  = courseHandicap(player.hcp, course);
  const adj = adjustedCH(player.hcp, refHcp, course, 1.0);

  return (
    <div style={{ padding: '12px 14px', borderBottom: isLast ? 'none' : `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input type="text" value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => { if (name.trim() && name !== player.name) onUpdate({ name: name.trim() }); else setName(player.name); }}
            style={styles.nameInput}
          />
          {isRef && <span style={{ fontSize: 9, color: C.red, fontWeight: 700, marginLeft: 6, letterSpacing: '0.1em' }}>FIELD LOW</span>}
          <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 4 }}>
            Higuera CH <span style={{ fontFamily: monoFamily, fontWeight: 700, color: C.greenDark }}>{ch}</span>
            <span style={{ marginLeft: 8 }}>vs field low <span style={{ fontFamily: monoFamily, fontWeight: 700, color: C.red }}>{adj}</span></span>
          </div>
        </div>
        <input type="number" step="0.1" value={hcp}
          onChange={e => setHcp(e.target.value)}
          onBlur={() => {
            const parsed = parseFloat(hcp);
            if (isNaN(parsed)) return;
            const clean = Math.round(parsed * 10) / 10;
            setHcp(String(clean));
            if (clean !== player.hcp) onUpdate({ hcp: clean });
          }}
          style={styles.hcpInput}
        />
      </div>
      <button onClick={onOpenScorecard} style={{
        marginTop: 10,
        width: '100%',
        padding: '8px 12px',
        background: C.greenPaper,
        border: `1px solid ${C.green}`,
        borderRadius: 6,
        color: C.greenDark,
        fontFamily: 'Manrope, sans-serif',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '0.02em',
      }}>
        📋 View Live Scorecard
      </button>
    </div>
  );
}

function ScorecardModal({ player, meta, scores, onClose }) {
  const course = effectiveCourse(HIGUERA);
  const ref = lowestHcpPlayer(meta.players);
  const ch = adjustedCH(player.hcp, ref.hcp, course, 1.0);
  const rs = scores[player.id] || [];
  const holes = course.pars.map((par, i) => {
    const raw = safeNum(rs[i]);
    const strokes = strokesOnHole(ch, course.sis[i]);
    const gross = raw != null ? capScore(raw, par, strokes) : null;
    const net = gross != null ? gross - strokes : null;
    return { par, si: course.sis[i], gross, net, strokes };
  });
  const played = holes.filter(h => h.gross != null).length;
  const totalPar = holes.reduce((s, h) => s + h.par, 0);
  const totalGross = holes.reduce((s, h) => s + (h.gross || 0), 0);
  const totalNet = holes.reduce((s, h) => s + (h.net != null ? h.net : 0), 0);
  const frontPar = holes.slice(0, 9).reduce((s, h) => s + h.par, 0);
  const backPar  = holes.slice(9).reduce((s, h) => s + h.par, 0);
  const frontGross = holes.slice(0, 9).reduce((s, h) => s + (h.gross || 0), 0);
  const backGross  = holes.slice(9).reduce((s, h) => s + (h.gross || 0), 0);
  const frontNet = holes.slice(0, 9).reduce((s, h) => s + (h.net != null ? h.net : 0), 0);
  const backNet  = holes.slice(9).reduce((s, h) => s + (h.net != null ? h.net : 0), 0);
  const frontPlayed = holes.slice(0, 9).filter(h => h.gross != null).length;
  const backPlayed  = holes.slice(9).filter(h => h.gross != null).length;

  const grossColor = (gross, par) => {
    if (gross == null) return { color: C.ashLight };
    const d = gross - par;
    if (d <= -1) return { color: C.red, fontWeight: 700 };
    if (d === 0) return { color: C.ink };
    if (d === 1) return { color: C.inkSoft };
    return { color: C.greenDark, fontWeight: 700 };
  };

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 720, width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: `1px solid ${C.border}`,
          background: C.greenPaper,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.green, fontWeight: 700, marginBottom: 2 }}>Live Scorecard</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, color: C.greenDark, lineHeight: 1.1 }}>{player.name}</div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 4 }}>Index {player.hcp.toFixed(1)} · {ch} strokes vs {ref.name} · Higuera White</div>
          </div>
          <button onClick={onClose} style={styles.iconBtn}><X size={18} color={C.green} /></button>
        </div>

        <div style={{ padding: 14 }}>
          {played === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: C.ashLight, fontStyle: 'italic', fontSize: 13 }}>
              No scores yet — this scorecard fills in live as {player.name.split(' ')[0]} plays.
            </div>
          ) : (
            <>
              <ScorecardNine label="Out" holes={holes.slice(0, 9)} startHole={1}
                totalPar={frontPar} totalGross={frontGross} totalNet={frontNet} played={frontPlayed}
                grossColor={grossColor} />
              <ScorecardNine label="In" holes={holes.slice(9)} startHole={10}
                totalPar={backPar} totalGross={backGross} totalNet={backNet} played={backPlayed}
                grossColor={grossColor} />
              {played === 18 && (
                <div style={{ padding: '12px 14px', background: C.goldSubtle, borderRadius: 8, marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.greenDark, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total</div>
                  <div style={{ display: 'flex', gap: 14, fontFamily: monoFamily, fontSize: 13 }}>
                    <div><span style={{ color: C.inkSoft }}>Par </span><b style={{ color: C.greenDark }}>{totalPar}</b></div>
                    <div><span style={{ color: C.inkSoft }}>Gross </span><b style={{ color: C.greenDark }}>{totalGross}</b></div>
                    <div><span style={{ color: C.inkSoft }}>Net </span><b style={{ color: C.red }}>{totalNet}</b> <span style={{ fontSize: 10, color: C.inkSoft }}>({fmtToPar(totalNet - totalPar)})</span></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScorecardNine({ label, holes, startHole, totalPar, totalGross, totalNet, played, grossColor }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: monoFamily, fontSize: 11 }}>
        <thead>
          <tr style={{ background: C.paperAlt }}>
            <th style={{ padding: '4px 6px', textAlign: 'left', color: C.inkSoft, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>Hole</th>
            {holes.map((_, i) => (
              <th key={i} style={{ padding: '4px', textAlign: 'center', color: C.greenDark, fontWeight: 700, borderBottom: `1px solid ${C.border}`, minWidth: 22 }}>
                {startHole + i}
              </th>
            ))}
            <th style={{ padding: '4px 6px', textAlign: 'center', color: C.green, fontWeight: 700, borderBottom: `1px solid ${C.border}`, background: C.greenPaper }}>{label}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '3px 6px', color: C.inkSoft, fontSize: 10 }}>Par</td>
            {holes.map((h, i) => <td key={i} style={{ padding: '3px 4px', textAlign: 'center', color: C.inkSoft, fontSize: 10 }}>{h.par}</td>)}
            <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: 700, color: C.inkSoft, fontSize: 10, background: C.greenPaper }}>{totalPar}</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 6px', color: C.inkSoft, fontSize: 10 }}>Gross</td>
            {holes.map((h, i) => (
              <td key={i} style={{ padding: '4px', textAlign: 'center', ...grossColor(h.gross, h.par) }}>
                {h.gross != null ? h.gross : '·'}
              </td>
            ))}
            <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: C.greenDark, background: C.greenPaper }}>{played > 0 ? totalGross : '·'}</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 6px', color: C.red, fontSize: 10, fontWeight: 600 }}>Net</td>
            {holes.map((h, i) => (
              <td key={i} style={{ padding: '4px', textAlign: 'center', color: h.net != null ? C.red : C.ashLight, fontWeight: 700 }}>
                {h.net != null ? h.net : '·'}
              </td>
            ))}
            <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: C.red, background: C.greenPaper }}>{played > 0 ? totalNet : '·'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// =====================================================================
// SETTINGS VIEW
// =====================================================================
export function SettingsView({ meta, settings, scores, onUpdateSettings, onResetAll }) {
  return (
    <div style={styles.scrollBody}>
      <SectionTitle eyebrow="Config" title="Settings" icon={SettingsIcon} />
      <div style={styles.card}>
        <div style={{ padding: 14, borderBottom: `1px solid ${C.border}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={settings.skinsCarryover}
              onChange={e => onUpdateSettings({ ...settings, skinsCarryover: e.target.checked })} />
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 600, color: C.greenDark }}>Skins carryover</div>
              <div style={{ fontSize: 11, color: C.inkSoft }}>If a hole is tied, the skin carries to the next hole</div>
            </div>
          </label>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <SectionTitle eyebrow="Tournament" title="Export + Reset" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => downloadCSV(meta.players, meta.groups, scores)} style={styles.secondaryBtn}>
            <Download size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Export All Scores (CSV)
          </button>
          <button onClick={onResetAll} style={{ ...styles.secondaryBtn, color: C.red, borderColor: C.red }}>
            <Trash2 size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Reset all scores
          </button>
        </div>
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

// =====================================================================
// ME PICKER MODAL
// =====================================================================
export function MePickerModal({ players, groups, onPick, onCancel, canCancel }) {
  return (
    <div style={styles.modalBackdrop} onClick={canCancel ? onCancel : undefined}>
      <div style={{ ...styles.modal, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: C.greenDark }}>Who are you?</div>
          {canCancel && <button onClick={onCancel} style={styles.iconBtn}><X size={18} color={C.green} /></button>}
        </div>
        <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 14 }}>
          Tap your name — we'll remember on this device so scoring and leaderboards personalize for you.
        </div>
        {groups.map(g => {
          const members = players.filter(p => p.groupId === g.id);
          return (
            <div key={g.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gold, fontWeight: 700, marginBottom: 6 }}>
                {g.name} · {g.teeTime}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {members.map(p => (
                  <button key={p.id} onClick={() => onPick(p.id)} style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: C.paper,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 14,
                    color: C.ink,
                  }}>
                    <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: C.greenDark, fontSize: 15 }}>{p.name}</span>
                    <span style={{ float: 'right', fontFamily: monoFamily, color: C.inkSoft, fontSize: 12 }}>{p.hcp.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
