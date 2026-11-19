import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BarChart3, Clipboard, Users, Settings as SettingsIcon } from 'lucide-react';
import { isFirebaseConfigured } from './firebase.js';
import {
  loadAll, subscribeAll, persistScoreCell, persistMeta, persistSettings,
  persistClearAllScores, loadMe, persistMe,
} from './storage.js';
import {
  DEFAULT_PLAYERS, DEFAULT_GROUPS, DEFAULT_SETTINGS, HIGUERA,
  SCHEMA_VERSION, migrateMetaIfNeeded,
} from './lib.js';
import { C, styles } from './styles.js';
import {
  Header, BoardsView, ScoringView, PlayersView, SettingsView, MePickerModal,
} from './components.jsx';

export default function App() {
  const [meta, setMeta]         = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [scores, setScores]     = useState({});
  const [me, setMe]             = useState(null);
  const [view, setView]         = useState('boards');
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showMePicker, setShowMePicker] = useState(false);
  const [syncState, setSyncState] = useState('idle'); // idle | saving | saved | error | offline
  const [isOnline, setIsOnline]   = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const focusedRef = useRef(0);
  const syncTimerRef = useRef(null);

  // --- Online / offline listener ---
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // --- Initial load (with timeout fallback) ---
  useEffect(() => {
    let cancelled = false;
    // Safety: if load never completes, surface an error after 15s
    const timeoutId = setTimeout(() => {
      if (!cancelled && loading) {
        setLoadError('Still waiting on Firebase. Check your internet connection and the Firebase env vars in Vercel.');
        setLoading(false);
      }
    }, 15000);
    (async () => {
      setMe(loadMe());
      if (!isFirebaseConfigured) {
        if (!cancelled) {
          setMeta({ players: DEFAULT_PLAYERS, groups: DEFAULT_GROUPS, course: HIGUERA, _schemaVersion: SCHEMA_VERSION });
          setSettings(DEFAULT_SETTINGS);
          setScores({});
          setLoading(false);
        }
        return;
      }
      try {
        const { meta: m, settings: s, scores: sc } = await loadAll();
        const migrated = await migrateMetaIfNeeded(m, persistMeta);
        if (!cancelled) {
          setMeta(migrated);
          setSettings({ ...DEFAULT_SETTINGS, ...(s || {}) });
          setScores(sc || {});
          setLoading(false);
        }
      } catch (e) {
        console.error('loadAll', e);
        if (!cancelled) {
          setLoadError(`Couldn't reach Firebase: ${e?.message || 'unknown error'}`);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, []);

  // --- Real-time subscriptions ---
  useEffect(() => {
    if (loading || !isFirebaseConfigured) return;
    const unsub = subscribeAll({
      onMeta:     (data) => { if (data) setMeta(data); },
      onSettings: (data) => { if (data) setSettings(prev => ({ ...prev, ...data })); },
      onScores:   (data) => {
        if (focusedRef.current > 0) return; // avoid clobbering in-progress typing
        setScores(data || {});
      },
    });
    return unsub;
  }, [loading]);

  // --- Reset focus counter on route change or tab becoming visible again ---
  // This recovers from "stuck focus" if a user tapped an input then locked
  // their phone / switched apps without the input firing blur.
  useEffect(() => { focusedRef.current = 0; }, [view]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') focusedRef.current = 0; };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // --- Mutators ---
  const updateScore = useCallback(async (playerId, holeIdx, value) => {
    // Optimistic local update
    setScores(prev => {
      const arr = prev[playerId] ? [...prev[playerId]] : Array(18).fill(null);
      arr[holeIdx] = value === '' || value == null ? null : Number(value);
      return { ...prev, [playerId]: arr };
    });
    setSyncState('saving');
    const { ok } = await persistScoreCell(playerId, holeIdx, value);
    setSyncState(ok ? 'saved' : 'error');
    // Fade the "saved" badge after 1.4s
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => setSyncState(prev => prev === 'saved' ? 'idle' : prev), 1400);
  }, []);

  const updateMeta = useCallback(async (updater) => {
    let next;
    setMeta(prev => {
      next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
    if (next) {
      try { await persistMeta(next); } catch (e) { console.error('persistMeta', e); }
    }
  }, []);

  const updateSettings = useCallback(async (next) => {
    setSettings(next);
    try { await persistSettings(next); } catch (e) { console.error('persistSettings', e); }
  }, []);

  const pickMe = useCallback((playerId) => {
    setMe(playerId);
    persistMe(playerId);
    setShowMePicker(false);
  }, []);

  const resetAll = useCallback(async () => {
    if (!confirm('Reset ALL scores? This wipes every score for every player. Cannot be undone.')) return;
    setScores({});
    await persistClearAllScores();
  }, []);

  const focusedHandlers = useMemo(() => ({
    onFocus: () => { focusedRef.current += 1; },
    onBlur:  () => { focusedRef.current = Math.max(0, focusedRef.current - 1); },
  }), []);

  // --- Firebase not configured screen ---
  if (!isFirebaseConfigured) {
    return (
      <div style={styles.shell}>
        <div style={{ padding: 20, maxWidth: 480, margin: '40px auto' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 24, color: C.greenDark, marginBottom: 12 }}>
            The EJ Invitational — Setup Required
          </div>
          <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>
            Firebase env vars are missing. Copy <code>.env.example</code> to <code>.env</code> and fill with your project credentials. Then rebuild.
          </div>
        </div>
      </div>
    );
  }

  // --- Loading error screen ---
  if (loadError) {
    return (
      <div style={styles.shell}>
        <div style={{ padding: 24, maxWidth: 480, margin: '40px auto' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, color: C.red, marginBottom: 10 }}>
            Can't reach the tournament database
          </div>
          <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5, marginBottom: 18 }}>
            {loadError}
          </div>
          <button onClick={() => window.location.reload()} style={styles.primaryBtn}>Try again</button>
        </div>
      </div>
    );
  }

  if (loading || !meta) {
    return (
      <div style={styles.shell}>
        <div style={{ padding: 40, textAlign: 'center', color: C.ash, fontFamily: 'Fraunces, serif' }}>Loading…</div>
      </div>
    );
  }

  const myPlayer = me ? meta.players.find(p => p.id === me) : null;

  return (
    <div style={styles.shell}>
      <Header myPlayer={myPlayer} onChangeMe={() => setShowMePicker(true)} syncState={syncState} isOnline={isOnline} />

      {view === 'boards'   && <BoardsView   meta={meta} scores={scores} settings={settings} />}
      {view === 'scoring'  && <ScoringView  meta={meta} scores={scores} settings={settings} me={me} onScoreUpdate={updateScore} focusedHandlers={focusedHandlers} />}
      {view === 'players'  && <PlayersView  meta={meta} settings={settings} scores={scores}
                                            onUpdatePlayer={(id, patch) => updateMeta(m => ({ ...m, players: m.players.map(p => p.id === id ? { ...p, ...patch } : p) }))} />}
      {view === 'settings' && <SettingsView meta={meta} settings={settings} scores={scores}
                                            onUpdateSettings={updateSettings} onResetAll={resetAll} />}

      {/* Bottom nav */}
      <div style={styles.bottomNav}>
        {[
          { id: 'boards',   label: 'Boards',   icon: BarChart3 },
          { id: 'scoring',  label: 'Scoring',  icon: Clipboard },
          { id: 'players',  label: 'Players',  icon: Users },
          { id: 'settings', label: 'Setup',    icon: SettingsIcon },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            style={{ ...styles.navBtn, ...(view === t.id ? styles.navBtnActive : {}) }}>
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </div>

      {showMePicker && (
        <MePickerModal players={meta.players} groups={meta.groups}
          onPick={pickMe} onCancel={() => setShowMePicker(false)} canCancel={!!me} />
      )}

      {/* Nudge to pick identity on first load */}
      {!me && !showMePicker && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <button onClick={() => setShowMePicker(true)} style={{
            background: C.gold, color: C.greenDark,
            padding: '10px 18px', borderRadius: 999, border: 'none',
            fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 12,
            boxShadow: `0 4px 12px ${C.greenDark}66`,
            cursor: 'pointer',
          }}>Tap to pick who you are</button>
        </div>
      )}

      {/* Error toast on failed save */}
      {syncState === 'error' && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: C.red, color: C.paper, padding: '10px 16px', borderRadius: 999,
          fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 30,
        }}>
          Score didn't save. Check connection & re-enter.
        </div>
      )}
    </div>
  );
}
