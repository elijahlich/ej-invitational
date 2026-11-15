// ============================================================
// EJ Invitational — Tropical Palm + Sun palette
// Inspired by the wedding logo (deep palm green + warm gold sun)
// ============================================================

export const C = {
  // Primary tropical palette
  green:        '#0D4D3B',   // Deep palm-leaf green (logo primary)
  greenDark:    '#083829',   // Darker green for text contrast
  greenMid:     '#2D6B55',   // Softer green for subtitles
  greenPaper:   '#E8EFEB',   // Very light green tint for cards
  greenSubtle:  '#DDE8E2',   // Even lighter
  gold:         '#C9A961',   // Warm sun gold (logo accent)
  goldDark:     '#A68943',   // Deeper gold for hover/highlights
  goldSubtle:   '#F5EDD5',   // Pale gold tint
  goldPaper:    '#F9F2E0',   // Light sand

  // Paper + ink
  paper:        '#FAF7F0',   // Warm off-white (sand/beach)
  paperAlt:     '#F2EDE1',   // Slightly deeper sand
  paperDeep:    '#EBE4D3',   // Deeper paper
  ink:          '#1A2E27',   // Dark green-black text
  inkSoft:      '#4A5C53',   // Softer text
  ash:          '#7A8980',   // Ash gray-green
  ashLight:     '#A5B0A8',   // Light ash

  // Scoring colors (Augusta-style)
  red:          '#A11128',   // Under par / scoring
  redDeep:      '#7A0A1E',   // Eagle+
  redSubtle:    '#F5E1E4',   // Birdie bg tint

  // Lines
  border:       '#D9D0BA',   // Warm beige line
  borderSoft:   '#E8E0CC',

  // Status
  warn:         '#D97706',
};

const monoFont = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";

export const styles = {
  // Layout
  shell: {
    maxWidth: 520,
    margin: '0 auto',
    minHeight: '100vh',
    background: C.paper,
    position: 'relative',
    paddingBottom: 72,
  },
  scrollBody: {
    padding: '16px 14px 24px',
  },

  // Header
  header: {
    padding: '18px 16px 14px',
    background: `linear-gradient(180deg, ${C.green} 0%, ${C.greenDark} 100%)`,
    color: C.paper,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTitle: {
    fontFamily: 'Fraunces, serif',
    fontWeight: 700,
    fontSize: 28,
    letterSpacing: '-0.015em',
    lineHeight: 1,
  },
  headerSubtitle: {
    fontFamily: 'Fraunces, serif',
    fontStyle: 'italic',
    fontSize: 12.5,
    color: C.gold,
    marginTop: 4,
    letterSpacing: '0.04em',
  },
  mePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    padding: '5px 10px',
    background: 'rgba(250, 247, 240, 0.12)',
    border: `1px solid ${C.gold}`,
    borderRadius: 999,
    color: C.paper,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'Manrope, sans-serif',
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },

  // Bottom nav
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 520,
    background: C.paper,
    borderTop: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0 10px',
    zIndex: 10,
  },
  navBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '4px 10px',
    color: C.ash,
    fontSize: 10,
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  navBtnActive: {
    color: C.green,
  },

  // Card
  card: {
    background: C.paper,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    overflow: 'hidden',
  },

  // Section title
  sectionEyebrow: {
    fontSize: 9.5,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: C.gold,
    fontWeight: 700,
    marginBottom: 4,
    fontFamily: 'Manrope, sans-serif',
  },
  sectionTitle: {
    fontFamily: 'Fraunces, serif',
    fontWeight: 700,
    fontSize: 24,
    color: C.greenDark,
    letterSpacing: '-0.01em',
    lineHeight: 1.05,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: C.inkSoft,
    marginTop: 4,
    fontFamily: 'Manrope, sans-serif',
  },

  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    fontSize: 9.5,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: C.inkSoft,
    fontWeight: 700,
    padding: '10px 6px',
    borderBottom: `1px solid ${C.border}`,
    fontFamily: 'Manrope, sans-serif',
    textAlign: 'center',
  },
  td: {
    padding: '12px 6px',
    fontSize: 13,
    color: C.ink,
    fontFamily: 'Manrope, sans-serif',
    textAlign: 'center',
  },
  tdMono: {
    fontFamily: monoFont,
    fontWeight: 700,
    color: C.greenDark,
  },
  tr: { background: C.paper },
  trAlt: { background: C.paperAlt },

  // Buttons
  primaryBtn: {
    background: C.green,
    color: C.paper,
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontFamily: 'Manrope, sans-serif',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  secondaryBtn: {
    background: C.paper,
    color: C.green,
    border: `1px solid ${C.green}`,
    borderRadius: 8,
    padding: '9px 14px',
    fontFamily: 'Manrope, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  bigCTA: {
    width: '100%',
    background: C.green,
    color: C.paper,
    border: 'none',
    borderRadius: 10,
    padding: '16px',
    fontFamily: 'Fraunces, serif',
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    boxShadow: `0 2px 0 ${C.greenDark}`,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  iconDangerBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 6,
    color: C.red,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Forms
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    fontFamily: 'Manrope, sans-serif',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    background: C.paper,
    color: C.ink,
    outline: 'none',
  },
  hcpInput: {
    width: 62,
    padding: '8px 10px',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: monoFont,
    fontWeight: 700,
    color: C.greenDark,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    background: C.paper,
    outline: 'none',
  },
  nameInput: {
    padding: '4px 0',
    fontSize: 16,
    fontFamily: 'Fraunces, serif',
    fontWeight: 600,
    color: C.greenDark,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    width: '100%',
  },
  label: {
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: C.inkSoft,
    fontWeight: 700,
    marginBottom: 6,
    fontFamily: 'Manrope, sans-serif',
  },

  // Score entry
  playerScoreRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 72px',
    gap: 10,
    padding: '12px 14px',
    background: C.paper,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    alignItems: 'center',
  },
  scoreInputBig: {
    width: 72,
    height: 56,
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center',
    fontFamily: monoFont,
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    outline: 'none',
    color: C.greenDark,
    background: C.paper,
  },
  parBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: C.goldPaper,
    color: C.greenDark,
    fontFamily: 'Manrope, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 4,
    letterSpacing: '0.04em',
  },

  // Modal
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(13, 77, 59, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: C.paper,
    borderRadius: 12,
    padding: 20,
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
  },

  // Champion banner
  championBanner: {
    background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`,
    color: C.greenDark,
    padding: '14px 16px',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: `0 2px 0 ${C.goldDark}`,
  },
};

export const monoFamily = monoFont;
