// dashTheme.js — CSS variable-based theming
// All colors reference CSS custom properties defined in globals.css
// This means html.dark / html.light class changes propagate to EVERY component instantly

export const C = {
  // Backgrounds
  bg0:     'var(--cp-bg0)',
  bg1:     'var(--cp-bg1)',
  bg2:     'var(--cp-bg2)',
  bg3:     'var(--cp-bg3)',

  // Text
  txt:     'var(--cp-txt)',
  txt2:    'var(--cp-txt2)',
  txt3:    'var(--cp-txt3)',

  // Accent
  link:    'var(--cp-link)',
  linkHov: 'var(--cp-linkHov)',

  // Bull / Bear
  pos:     'var(--cp-pos)',
  neg:     'var(--cp-neg)',
  posD:    'var(--cp-posD)',
  negD:    'var(--cp-negD)',

  // Nav
  navBg:   'var(--cp-navBg)',
  navHov:  'var(--cp-navHov)',
  navTxt:  'var(--cp-navTxt)',
  navAct:  'var(--cp-navAct)',

  // Legacy aliases
  hdrBg:   'var(--cp-bg2)',
  alt:     'var(--cp-bg1)',
  hov:     'var(--cp-bg2)',
  bdr:     'var(--cp-bg3)',
  thBg:    'var(--cp-bg2)',
  thBdr:   'var(--cp-bg3)',
  txt2old: 'var(--cp-txt2)',

  fnt: "'Source Sans Pro',Arial,sans-serif",
}

export const bd = `1px solid var(--cp-bg3)`

export const thS = (right = false) => ({
  padding: right ? '4px 8px' : '4px 4px 4px 6px',
  fontSize: 11, fontWeight: 700, color: 'var(--cp-txt2)',
  borderBottom: '1px solid var(--cp-bg3)',
  textAlign: right ? 'right' : 'left',
  background: 'var(--cp-bg2)',
  fontFamily: "'Source Sans Pro',Arial,sans-serif",
  whiteSpace: 'nowrap',
})