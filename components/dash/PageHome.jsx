'use client'
import { useState, useEffect, useRef } from 'react'
import { C, bd, thS } from './dashTheme'
import { SIG_L_TICKERS, SIG_R_TICKERS, RECENT_Q } from './dashData'
import { Spark } from './dashAtoms'

const fmtP = v => v != null ? `$${parseFloat(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—'
const fmtC = v => v != null ? `${parseFloat(v)>=0?'+':''}${parseFloat(v).toFixed(2)}%` : '—'
const fmtV = v => {
  if (!v) return '—'
  const n = parseFloat(v)
  if (n>=1e9) return (n/1e9).toFixed(1)+'B'
  if (n>=1e6) return (n/1e6).toFixed(1)+'M'
  if (n>=1e3) return (n/1e3).toFixed(0)+'K'
  return String(n)
}

// ── Mini candlestick chart (SVG, responsive) ──────────────────────────────────
function IndexChart({ label, ticker, q }) {
  const ref = useRef(null)
  const [W, setW] = useState(320)

  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(entries => {
      setW(entries[0].contentRect.width)
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  const price  = q?.price ? parseFloat(q.price) : null
  const chgPct = q?.changePercent ? parseFloat(q.changePercent) : null
  const pos    = chgPct == null || chgPct >= 0
  const color  = pos ? '#26a69a' : '#ef5350'

  const seed = ticker.split('').reduce((a,c) => a + c.charCodeAt(0), 0)
  const rand = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x) }

  const H = 130, PAD_L = 44, PAD_R = 6, PAD_T = 8, PAD_B = 30
  const cW = Math.max(10, W - PAD_L - PAD_R)
  const cH = H - PAD_T - PAD_B
  const NUM = 26

  const candles = Array.from({length: NUM}, (_, i) => {
    const trend = (i / NUM) * (pos ? 0.12 : -0.12)  // subtle trend
    const base  = 0.5 + trend + (rand(seed + i*3) - 0.5) * 0.06  // tight clustering
    const move  = (rand(seed + i*7 + 2) - 0.5) * 0.05
    const open  = Math.max(0.3, Math.min(0.7, base))
    const close = Math.max(0.3, Math.min(0.7, base + move))
    const wick  = rand(seed + i*11 + 5) * 0.015
    return {
      open,
      close,
      high: Math.min(0.75, Math.max(open, close) + wick),
      low:  Math.max(0.25, Math.min(open, close) - wick),
    }
  })

  const gap  = cW / NUM
  const barW = Math.max(1, gap * 0.55)

  // Tight Y-axis: fit exactly to candle data range + small padding
  const allHi = candles.map(c => c.high)
  const allLo = candles.map(c => c.low)
  const dMin = Math.min(...allLo)
  const dMax = Math.max(...allHi)
  const dPad = (dMax - dMin) * 0.2
  const yLo = dMin - dPad
  const yHi = dMax + dPad

  const py = v => PAD_T + (1 - (v - yLo) / (yHi - yLo)) * cH

  // Price axis: map normalized candle range → real price with tight intraday spread
  const base = price || 1000
  const priceSpread = base * 0.008  // ~0.8% total range for labels
  const pAt = v => base + ((v - 0.5) / 0.5) * priceSpread * 0.5

  const yTicks = [
    yLo + (yHi-yLo)*0.1,
    yLo + (yHi-yLo)*0.35,
    yLo + (yHi-yLo)*0.65,
    yLo + (yHi-yLo)*0.9,
  ]
  const VOL_H = 14

  return (
    <div ref={ref} style={{
      flex: 1, minWidth: 0,
      background: 'var(--cp-bg0)',
      border: `1px solid ${C.bg3}`,
      borderRadius: 3,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '5px 8px 3px',
        display: 'flex', alignItems: 'baseline', gap: 6,
        borderBottom: `1px solid ${C.bg3}`,
      }}>
        <span style={{fontSize:12, fontWeight:700, color:C.txt, flexShrink:0}}>{label}</span>
        <span style={{fontSize:9, color:C.txt3}}>Feb 20</span>
        <span style={{fontSize:11, fontWeight:700, color, marginLeft:'auto'}}>
          {chgPct != null ? `${pos?'+':''}${chgPct.toFixed(2)}%` : '…'}
        </span>
        {price != null && (
          <span style={{fontSize:10, color:C.txt, fontWeight:600}}>
            {price.toLocaleString('en-US',{maximumFractionDigits:2})}
          </span>
        )}
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:'block'}}>
        {yTicks.map((t,i) => (
          <line key={i} x1={PAD_L} y1={py(t)} x2={W-PAD_R} y2={py(t)} stroke="#2a2e3b" strokeWidth={1}/>
        ))}
        {yTicks.map((t,i) => {
          const p = pAt(t)
          const lbl = p >= 1000 ? p.toLocaleString('en-US',{maximumFractionDigits:0}) : p.toFixed(2)
          return (
            <text key={i} x={PAD_L - 3} y={py(t) + 3.5} textAnchor="end" fill={C.txt3} fontSize={9} fontFamily="Verdana,Arial">{lbl}</text>
          )
        })}
        {candles.map((c, i) => {
          const cx = PAD_L + (i + 0.5) * gap
          const cpos = c.close >= c.open
          const col = cpos ? '#26a69a' : '#ef5350'
          const bodyTop = py(Math.max(c.open, c.close))
          const bodyBot = py(Math.min(c.open, c.close))
          const bodyH = Math.max(1, bodyBot - bodyTop)
          return (
            <g key={i}>
              <line x1={cx} y1={py(c.high)} x2={cx} y2={py(c.low)} stroke={col} strokeWidth={0.8}/>
              <rect x={cx - barW/2} y={bodyTop} width={barW} height={bodyH} fill={col}/>
            </g>
          )
        })}
        {candles.map((c, i) => {
          const cx = PAD_L + (i + 0.5) * gap
          const cpos = c.close >= c.open
          const vol = rand(seed + i*17 + 3) * VOL_H
          return (
            <rect key={i} x={cx - barW/2} y={H - PAD_B + 2 + (VOL_H - vol)} width={barW} height={vol}
              fill={cpos ? 'rgba(38,166,154,0.45)' : 'rgba(239,83,80,0.45)'}/>
          )
        })}
        <text x={PAD_L} y={H - PAD_B + 10} fill={C.txt3} fontSize={6.5} fontFamily="Verdana">RELATIVE VOLUME</text>
        {['10AM','12PM','2PM','4PM'].map((t,i) => (
          <text key={i} x={PAD_L + ((i+1) / 5) * cW} y={H - 4} textAnchor="middle" fill={C.txt3} fontSize={8} fontFamily="Verdana">{t}</text>
        ))}
      </svg>
    </div>
  )
}

// ── Stock heatmap — contained in exact 400×368px box like Finviz ─────────────
// Finviz: <a id="treemap-small" class="block w-[400px]" style="height: 368px;">
const MAP_W = 400
const MAP_H = 368

// Treemap sectors with pre-calculated pixel rects (x, y, w, h) within 400×368
// Layout mirrors Finviz's actual treemap structure
const SECTORS = [
  {
    label: 'TECHNOLOGY',
    x:0, y:0, w:255, h:230,
    stocks: [
      {t:'MSFT', chg:-0.31, x:0,   y:0,  w:62, h:115},
      {t:'NVDA', chg:+1.02, x:62,  y:0,  w:62, h:115},
      {t:'AAPL', chg:+1.54, x:124, y:0,  w:62, h:115},
      {t:'GOOGL',chg:+0.4,  x:186, y:0,  w:69, h:115},
      {t:'META', chg:+1.69, x:0,   y:115,w:50, h:57},
      {t:'TSLA', chg:-0.5,  x:50,  y:115,w:42, h:57},
      {t:'AVGO', chg:-0.4,  x:92,  y:115,w:43, h:57},
      {t:'ORCL', chg:-0.56, x:135, y:115,w:30, h:28},
      {t:'PLTR', chg:+0.35, x:165, y:115,w:30, h:28},
      {t:'CRM',  chg:+0.1,  x:195, y:115,w:30, h:28},
      {t:'INTU', chg:-0.2,  x:225, y:115,w:30, h:28},
      {t:'AMD',  chg:-1.58, x:135, y:143,w:40, h:29},
      {t:'INTC', chg:-0.3,  x:175, y:143,w:27, h:29},
      {t:'TXN',  chg:+0.1,  x:202, y:143,w:27, h:29},
      {t:'MU',   chg:-0.5,  x:229, y:143,w:26, h:29},
      // Fill gap y:172–230 with small-cap tech row
      {t:'ADBE', chg:+0.4,  x:0,   y:172,w:36, h:29},
      {t:'QCOM', chg:-0.3,  x:36,  y:172,w:36, h:29},
      {t:'NOW',  chg:+0.8,  x:72,  y:172,w:36, h:29},
      {t:'AMAT', chg:-0.5,  x:108, y:172,w:36, h:29},
      {t:'LRCX', chg:-0.2,  x:144, y:172,w:36, h:29},
      {t:'KLAC', chg:+0.1,  x:180, y:172,w:36, h:29},
      {t:'MRVL', chg:+0.6,  x:216, y:172,w:39, h:29},
      {t:'SNPS', chg:-0.3,  x:0,   y:201,w:51, h:29},
      {t:'CDNS', chg:+0.2,  x:51,  y:201,w:51, h:29},
      {t:'PANW', chg:+0.5,  x:102, y:201,w:51, h:29},
      {t:'CRWD', chg:-0.1,  x:153, y:201,w:51, h:29},
      {t:'FTNT', chg:+0.3,  x:204, y:201,w:51, h:29},
    ]
  },
  {
    label: 'CONSUMER DEF',
    x:255, y:0, w:145, h:115,
    stocks: [
      {t:'WMT', chg:-1.51, x:255, y:0,  w:48, h:57},
      {t:'KO',  chg:+0.2,  x:303, y:0,  w:48, h:57},
      {t:'PEP', chg:-0.1,  x:351, y:0,  w:49, h:57},
      {t:'COST',chg:+0.1,  x:255, y:57, w:48, h:58},
      {t:'PG',  chg:-0.1,  x:303, y:57, w:48, h:58},
      {t:'PM',  chg:+0.3,  x:351, y:57, w:49, h:58},
    ]
  },
  {
    label: 'CONSUMER CYCLICAL',
    x:255, y:115, w:145, h:115,
    stocks: [
      {t:'AMZN',chg:+2.56, x:255, y:115,w:72, h:115},
      {t:'HD',  chg:-0.72, x:327, y:115,w:37, h:57},
      {t:'NKE', chg:-0.3,  x:364, y:115,w:36, h:57},
      {t:'LOW', chg:-0.2,  x:327, y:172,w:73, h:58},
    ]
  },
  {
    label: 'COMMUNICATION',
    x:0, y:230, w:130, h:138,
    stocks: [
      {t:'NFLX',chg:+1.2,  x:0,   y:230, w:43, h:69},
      {t:'DIS', chg:-0.5,  x:43,  y:230, w:43, h:69},
      {t:'TMUS',chg:+0.3,  x:86,  y:230, w:44, h:69},
      {t:'VZ',  chg:-0.81, x:0,   y:299, w:33, h:69},
      {t:'T',   chg:+0.1,  x:33,  y:299, w:32, h:69},
      {t:'GE',  chg:-0.2,  x:65,  y:299, w:32, h:69},
      {t:'GD',  chg:+0.1,  x:97,  y:299, w:33, h:34},
      {t:'CAT', chg:+0.2,  x:97,  y:333, w:33, h:35},
    ]
  },
  {
    label: 'FINANCIAL',
    x:130, y:230, w:125, h:138,
    stocks: [
      {t:'JPM',  chg:-1.34, x:130, y:230, w:42, h:69},
      {t:'V',    chg:+0.5,  x:172, y:230, w:41, h:69},
      {t:'BAC',  chg:-0.5,  x:213, y:230, w:42, h:69},
      {t:'WFC',  chg:+0.1,  x:130, y:299, w:32, h:34},
      {t:'BRK-B',chg:+0.25, x:162, y:299, w:46, h:34},
      {t:'C',    chg:-0.3,  x:208, y:299, w:47, h:34},
      {t:'GS',   chg:+0.1,  x:130, y:333, w:62, h:35},
      {t:'MS',   chg:+0.2,  x:192, y:333, w:63, h:35},
    ]
  },
  {
    label: 'HEALTHCARE',
    x:255, y:230, w:145, h:90,
    stocks: [
      {t:'LLY', chg:-1.34, x:255, y:230, w:50, h:90},
      {t:'JNJ', chg:-0.5,  x:305, y:230, w:47, h:45},
      {t:'UNH', chg:-0.3,  x:352, y:230, w:48, h:45},
      {t:'ABBV',chg:+0.3,  x:305, y:275, w:32, h:45},
      {t:'MRK', chg:-0.2,  x:337, y:275, w:32, h:45},
      {t:'ABT', chg:+0.1,  x:369, y:275, w:31, h:45},
    ]
  },
  {
    label: 'INDUSTRIALS',
    x:255, y:320, w:72, h:48,
    stocks: [
      {t:'GE',  chg:+0.5,  x:255, y:320, w:36, h:48},
      {t:'BA',  chg:-0.72, x:291, y:320, w:36, h:24},
      {t:'UPS', chg:-0.3,  x:291, y:344, w:18, h:24},
      {t:'HON', chg:+0.1,  x:309, y:344, w:18, h:24},
    ]
  },
  {
    label: 'ENERGY',
    x:327, y:320, w:73, h:48,
    stocks: [
      {t:'XOM', chg:-0.46, x:327, y:320, w:37, h:48},
      {t:'CVX', chg:-0.46, x:364, y:320, w:36, h:24},
      {t:'COP', chg:-0.2,  x:364, y:344, w:36, h:24},
    ]
  },
]

function chgColor(chg) {
  if (chg >= 3)   return '#0a5c33'
  if (chg >= 1.5) return '#0f7040'
  if (chg >= 0.5) return '#148038'
  if (chg >= 0)   return '#1a5c35'
  if (chg > -0.5) return '#6b1f22'
  if (chg > -1.5) return '#a01e26'
  if (chg > -3)   return '#c01e28'
  return '#8a1520'
}

function HeatMap({ quotes, onT }) {
  return (
    <div style={{
      width: MAP_W,
      height: MAP_H,
      position: 'relative',
      flexShrink: 0,
      overflow: 'hidden',
      background: C.bg,
      border: `1px solid ${C.bg3}`,
    }}>
      {SECTORS.map(({ label, x, y, w, h, stocks }) => (
        <div key={label}>
          {/* Sector label */}
          <div style={{
            position:'absolute', left:x+2, top:y+1,
            fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.6)',
            textTransform:'uppercase', letterSpacing:'0.3px',
            pointerEvents:'none', zIndex:2, whiteSpace:'nowrap',
          }}>{label}</div>
          {/* Stock tiles */}
          {stocks.map(({ t, chg, x:sx, y:sy, w:sw, h:sh }) => {
            const live = quotes[t]?.changePercent != null ? parseFloat(quotes[t].changePercent) : chg
            const bg = chgColor(live)
            const fs = Math.min(10, Math.max(6, Math.min(sw, sh) / 4))
            const showPct = sh >= 28
            return (
              <div key={t}
                onClick={() => onT(t)}
                title={`${t} ${live>0?'+':''}${live.toFixed(2)}%`}
                style={{
                  position:'absolute',
                  left: sx, top: sy, width: sw-1, height: sh-1,
                  background: bg,
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  cursor:'pointer',
                  overflow:'hidden',
                  border:'1px solid rgba(0,0,0,0.2)',
                }}
              >
                <span style={{fontSize:fs, fontWeight:700, color:'#fff', lineHeight:1.1, textAlign:'center', padding:'0 1px', whiteSpace:'nowrap'}}>{t}</span>
                {showPct && (
                  <span style={{fontSize:Math.max(6,fs-1.5), color:'rgba(255,255,255,0.88)', lineHeight:1.1}}>
                    {live>0?'+':''}{live.toFixed(2)}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Signal filter dropdown — matches Finviz "Daily ▾" button in table header
function SignalDropdown() {
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState('Daily')
  const opts = ['Daily','Weekly','Monthly','Quarterly','Half Year','Yearly']
  return (
    <div style={{position:'relative',display:'inline-block'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        background:'transparent', border:`1px solid ${C.bg3}`, color:C.link,
        borderRadius:2, padding:'1px 5px', fontSize:10, fontWeight:700,
        cursor:'pointer', display:'flex', alignItems:'center', gap:3,
        fontFamily:C.fnt,
      }}>
        {sel}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
      </button>
      {open && (
        <div style={{
          position:'absolute', right:0, top:'100%', zIndex:99,
          background:'var(--cp-bg2)', border:`1px solid ${C.bg3}`,
          borderRadius:2, minWidth:110, boxShadow:'0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {opts.map(o=>(
            <div key={o} onClick={()=>{setSel(o);setOpen(false)}} style={{
              padding:'4px 10px', fontSize:11, color:o===sel?C.link:C.txt,
              cursor:'pointer', fontFamily:C.fnt, whiteSpace:'nowrap',
              background: o===sel ? 'rgba(47,145,239,0.1)' : 'transparent',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
            onMouseLeave={e=>e.currentTarget.style.background=o===sel?'rgba(47,145,239,0.1)':'transparent'}
            >{o}</div>
          ))}
        </div>
      )}
    </div>
  )
}
function SigRow({ ticker, signal, i, q, onT }) {
  const [hov, setHov] = useState(false)
  const pos  = q?.changePercent == null || parseFloat(q.changePercent) >= 0
  const seed = ticker.charCodeAt(0)*7 + i*3
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg,cursor:'pointer'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>onT(ticker)}>
      <td style={{padding:'3px 4px 3px 6px',borderBottom:bd}}>
        <span style={{color:C.link,fontWeight:700,fontSize:12}}>{ticker}</span>
      </td>
      <td style={{padding:'3px 8px',borderBottom:bd,textAlign:'right',fontWeight:600,fontSize:12,color:C.txt,whiteSpace:'nowrap'}}>
        {q ? fmtP(q.price) : <span style={{color:C.txt3,fontSize:10}}>…</span>}
      </td>
      <td style={{padding:'3px 8px',borderBottom:bd,textAlign:'right',fontWeight:600,fontSize:12,color:pos?C.pos:C.neg,whiteSpace:'nowrap'}}>
        {q ? fmtC(q.changePercent) : <span style={{color:C.txt3,fontSize:10}}>…</span>}
      </td>
      <td style={{padding:'3px 8px',borderBottom:bd,textAlign:'right',fontSize:11,color:C.txt,whiteSpace:'nowrap'}}>
        {q ? fmtV(q.volume) : <span style={{color:C.txt3,fontSize:10}}>…</span>}
      </td>
      <td style={{width:4,borderBottom:bd}}/>
      <td style={{padding:'3px 6px',borderBottom:bd,width:'35%',whiteSpace:'nowrap'}}>
        <span style={{color:C.link,fontSize:11,marginRight:6}}>{signal}</span>
        {q && <Spark pos={pos} seed={seed}/>}
      </td>
    </tr>
  )
}

const SigHead = () => (
  <thead><tr>
    <th style={thS()}>Ticker</th>
    <th style={thS(true)}>Last</th>
    <th style={thS(true)}>Change</th>
    <th style={thS(true)}>Volume</th>
    <th style={{width:4,background:C.thBg,borderBottom:`1px solid ${C.thBdr}`}}/>
    <th style={{...thS(),width:'35%'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>Signal</span>
        <SignalDropdown/>
      </div>
    </th>
  </tr></thead>
)

function IndexCard({ label, q }) {
  const price = q?.price
  const chg   = q?.changePercent
  const pos   = chg == null || parseFloat(chg) >= 0
  return (
    <div style={{textAlign:'center',lineHeight:'15px',fontFamily:'Verdana,Arial',fontSize:10}}>
      <div style={{fontWeight:700,color:C.txt}}>{label}</div>
      <div style={{fontWeight:700,color:C.txt,fontSize:12}}>
        {price ? parseFloat(price).toLocaleString('en-US',{maximumFractionDigits:2}) : '…'}
      </div>
      <div style={{fontWeight:700,color:pos?C.pos:C.neg,fontSize:11}}>
        {chg != null ? fmtC(chg) : '…'}
      </div>
    </div>
  )
}

function NewsRow({ r, i, onT }) {
  const [hov, setHov] = useState(false)
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'3px 8px',borderBottom:bd,whiteSpace:'nowrap',verticalAlign:'top',width:55}}>
        {r.t && <span style={{color:C.link,fontWeight:700,fontSize:12,cursor:'pointer'}} onClick={()=>onT(r.t)}>{r.t}</span>}
      </td>
      <td style={{padding:'3px 8px',borderBottom:bd,verticalAlign:'top'}}>
        <a href={r.url} target="_blank" rel="noopener noreferrer"
          style={{color:C.txt,textDecoration:'none',fontSize:12,lineHeight:'16px'}}
          onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
          onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
          {r.h}
        </a>
      </td>
      <td style={{padding:'3px 8px',borderBottom:bd,whiteSpace:'nowrap',fontSize:11,color:C.txt3,textAlign:'right',verticalAlign:'top'}}>{r.src}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,whiteSpace:'nowrap',fontSize:11,color:C.txt3,textAlign:'right',verticalAlign:'top'}}>{r.time}</td>
    </tr>
  )
}

function ScRow({ r, i, label, onT }) {
  const [hov, setHov] = useState(false)
  const pos = parseFloat(r.changePercent) >= 0
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg,cursor:'pointer'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>onT(r.t)}>
      <td style={{padding:'3px 4px 3px 6px',borderBottom:bd}}>
        <span style={{color:C.link,fontWeight:700,fontSize:12}}>{r.t}</span>
      </td>
      <td style={{padding:'3px 8px',borderBottom:bd,textAlign:'right',fontWeight:600,fontSize:12,color:C.txt,whiteSpace:'nowrap'}}>
        {fmtP(r.price)}
      </td>
      <td style={{padding:'3px 8px',borderBottom:bd,textAlign:'right',fontWeight:700,fontSize:12,color:pos?C.pos:C.neg,whiteSpace:'nowrap'}}>
        {fmtC(r.changePercent)}
      </td>
      <td style={{padding:'3px 6px',borderBottom:bd,whiteSpace:'nowrap'}}>
        <span style={{color:C.link,fontSize:11}}>{label}</span>
        <Spark pos={pos} seed={r.t.charCodeAt(0)*3+i}/>
      </td>
    </tr>
  )
}

const ScHead = () => (
  <thead><tr>
    <th style={thS()}>Ticker</th>
    <th style={thS(true)}>Last</th>
    <th style={thS(true)}>Change</th>
    <th style={thS()}>Signal</th>
  </tr></thead>
)

function EarnRow({ e, ri, onT }) {
  const [hov, setHov] = useState(false)
  return (
    <tr style={{background:hov?C.hov:ri%2?C.alt:C.bg}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'3px 8px',borderBottom:bd,fontSize:12,whiteSpace:'nowrap',color:C.link,fontWeight:600}}>{e.d}</td>
      {e.tt.map((t,ti)=>(
        <td key={ti} style={{padding:'3px 4px',borderBottom:bd,fontSize:12}}>
          <span style={{color:C.link,fontWeight:600,cursor:'pointer'}} onClick={()=>onT(t)}>{t}</span>
        </td>
      ))}
      {Array.from({length:Math.max(0,8-e.tt.length)}).map((_,pi)=>(
        <td key={'p'+pi} style={{padding:'3px 4px',borderBottom:bd}}>&nbsp;</td>
      ))}
    </tr>
  )
}

function buildScreener(quotes) {
  const SCREENER_TICKERS = [
    'NVDA','AMD','META','GOOGL','AMZN','TSLA','AAPL','MSFT','LLY','V','MA',
    'COST','HD','NKE','BA','PFE','T','WBA','VZ','CVS','INTC','DIS','XOM','CVX',
    'ARKK','TQQQ','IWM','GLD','TLT','F','JPM','WMT','NFLX','SOXS','CSGP','SPY','QQQ'
  ]
  const rows = SCREENER_TICKERS
    .filter(t => quotes[t]?.price != null)
    .map(t => ({ t, ...quotes[t] }))
    .sort((a,b) => parseFloat(b.changePercent) - parseFloat(a.changePercent))
  const gainers  = rows.slice(0, 7).map(r => ({ ...r, label: 'Top Gainers' }))
  const losers   = rows.slice(-7).reverse().map(r => ({ ...r, label: 'Top Losers' }))
  const active   = [...rows].sort((a,b) => (b.volume||0)-(a.volume||0)).slice(0,4).map(r=>({...r,label:'Most Active'}))
  const volatile = rows.filter(r => Math.abs(parseFloat(r.changePercent))>1).slice(0,3).map(r=>({...r,label:'Volatile'}))
  return { gainers, losers, active, volatile }
}

export default function PageHome({ onT }) {
  const [quotes,   setQuotes]   = useState({})
  const [news,     setNews]     = useState([])
  const [earnings, setEarnings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetch('/api/market-data?section=all')
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        if (d.quotes)   setQuotes(d.quotes)
        if (d.news)     setNews(d.news)
        if (d.earnings) setEarnings(d.earnings)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const q = quotes
  const { gainers, losers, active, volatile } = loading
    ? {gainers:[],losers:[],active:[],volatile:[]}
    : buildScreener(q)
  const leftRows  = [...gainers, ...active, ...volatile].slice(0, 18)
  const rightRows = [...losers, ...active.slice(2)].slice(0, 17)
  const tbl = {width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:C.fnt}

  return (
    <>
      {/* INDEX CHARTS */}
      <div style={{display:'flex', gap:4, margin:'6px 0 4px', width:'100%'}}>
        {[
          {label:'DOW',          ticker:'DIA', qk:'DIA'},
          {label:'NASDAQ',       ticker:'QQQ', qk:'QQQ'},
          {label:'S&P 500',      ticker:'SPY', qk:'SPY'},
          {label:'RUSSELL 2000', ticker:'IWM', qk:'IWM'},
        ].map(({label, ticker, qk}) => (
          <IndexChart key={ticker} label={label} ticker={ticker} q={q[qk]}/>
        ))}
      </div>

      {/* MARKET BREADTH BARS */}
      <div style={{display:'flex', alignItems:'flex-start', margin:'2px 0 4px', borderTop:`1px solid ${C.bg3}`, borderBottom:`1px solid ${C.bg3}`, paddingTop:4, paddingBottom:4}}>
        {[
          {l:'Advancing', r:'Declining', lv:'50.6% (2812)', rv:'(2494) 44.9%', lp:50.6},
          {l:'New High',  r:'New Low',  lv:'52.1% (222)',  rv:'(204) 47.9%',  lp:52.1},
          {l:'Above SMA50', r:'Below', lv:'49.6% (2755)', rv:'(2797) 50.4%', lp:49.6},
          {l:'Above SMA200',r:'Below', lv:'51.9% (2883)', rv:'(2669) 48.1%', lp:51.9},
        ].map((b,i)=>(
          <div key={i} style={{flex:1,padding:'0 8px',borderRight:i<3?`1px solid ${C.bg3}`:'none'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:2,fontFamily:'Verdana,Arial',fontSize:9}}>
              <span style={{fontWeight:700,color:C.pos}}>{b.l}</span>
              <span style={{fontWeight:700,color:C.neg}}>{b.r}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontFamily:'Verdana,Arial',fontSize:9}}>
              <span style={{color:C.pos}}>{b.lv}</span>
              <span style={{color:C.neg}}>{b.rv}</span>
            </div>
            <div style={{display:'flex',height:6,borderRadius:2,overflow:'hidden',background:C.bg3}}>
              <div style={{width:`${b.lp}%`,background:C.pos}}/>
              <div style={{flex:1,background:C.neg}}/>
            </div>
          </div>
        ))}
        <div style={{flexShrink:0, display:'flex', gap:20, padding:'0 12px', alignItems:'center'}}>
          <IndexCard label="S&P 500" q={q['SPY']}/>
          <IndexCard label="NASDAQ"  q={q['QQQ']}/>
          <IndexCard label="DOW"     q={q['DIA']}/>
          <IndexCard label="GOLD"    q={q['GLD']}/>
        </div>
      </div>

      {loading && <div style={{padding:40,textAlign:'center',color:C.txt,fontSize:13}}>Loading market data…</div>}

      {!loading && (
        <>
          {/* 3-COLUMN: tables + heatmap — no gap (gap causes grey box) */}
          <div style={{display:'flex', alignItems:'flex-start', marginTop:4}}>
            <div style={{flex:1, minWidth:0}}>
              <table style={tbl}><SigHead/>
                <tbody>{leftRows.map((r,i)=><ScRow key={r.t+i} r={r} i={i} label={r.label} onT={onT}/>)}</tbody>
              </table>
            </div>
            <div style={{width:16, flexShrink:0}}/>
            <div style={{flex:1, minWidth:0}}>
              <table style={tbl}><SigHead/>
                <tbody>{rightRows.map((r,i)=><ScRow key={r.t+i} r={r} i={i} label={r.label} onT={onT}/>)}</tbody>
              </table>
            </div>
            <div style={{width:16, flexShrink:0}}/>
            {/* HEATMAP: exact 400×368px absolute-positioned treemap */}
            <HeatMap quotes={q} onT={onT}/>
          </div>

          <div style={{height:10}}/>

          {/* NEWS + RECENT QUOTES */}
          <table width="100%" cellPadding="0" cellSpacing="0" border="0">
            <tbody><tr>
              <td style={{verticalAlign:'top'}}>
                <table style={tbl}>
                  <thead><tr>
                    <th colSpan={4} style={{padding:'5px 8px',background:C.hdrBg,textAlign:'left'}}>
                      <b style={{color:'var(--cp-txt)',fontSize:12}}>Market News</b>
                      <span style={{color:'var(--cp-link)',fontSize:10,fontWeight:400,marginLeft:8}}>live · Finnhub</span>
                    </th>
                  </tr></thead>
                  <tbody>
                    {news.length === 0 && <tr><td colSpan={4} style={{padding:'16px 8px',color:C.txt,textAlign:'center'}}>No news</td></tr>}
                    {news.map((r,i)=><NewsRow key={i} r={r} i={i} onT={onT}/>)}
                  </tbody>
                </table>
              </td>
              <td style={{width:6}}/>
              <td style={{width:280,verticalAlign:'top'}}>
                <table style={tbl}>
                  <thead><tr>
                    <th style={{padding:'4px 8px',background:C.hdrBg,textAlign:'left'}}><b style={{color:'var(--cp-txt)',fontSize:12}}>Recent Quotes</b></th>
                    <th style={{padding:'4px 8px',background:C.hdrBg,color:'var(--cp-txt2)',fontSize:11,fontWeight:600}}>Signal</th>
                  </tr></thead>
                  <tbody>{RECENT_Q.map((r,i)=>(
                    <tr key={i} style={{background:i%2?C.alt:C.bg,cursor:'pointer'}} onClick={()=>onT(r.t)}>
                      <td style={{padding:'3px 8px',borderBottom:bd,fontSize:12}}><span style={{color:C.link,fontWeight:600}}>{r.t}</span></td>
                      <td style={{padding:'3px 8px',borderBottom:bd,fontSize:11,color:C.link}}>{r.s}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </td>
            </tr></tbody>
          </table>

          <div style={{height:10}}/>

          {earnings.length > 0 && (
            <table style={tbl}>
              <thead><tr>
                <th style={{...thS(),width:'14%',whiteSpace:'nowrap'}}>Earnings Date</th>
                <th colSpan={8} style={thS()}>Companies Reporting</th>
              </tr></thead>
              <tbody>{earnings.map((e,ri)=><EarnRow key={ri} e={e} ri={ri} onT={onT}/>)}</tbody>
            </table>
          )}

          {/* ── TRIAL BANNER — Finviz exact ── */}
          <div style={{display:'flex', justifyContent:'center', margin:'32px 0 0', padding:'3px 3px 0', borderRadius:'15px 15px 0 0', background:'linear-gradient(135deg, #5e36b8 0%, #7c3aed 50%, #5e36b8 100%)'}}>
            <div style={{
              width:'100%', borderRadius:'12px 12px 0 0',
              background:'linear-gradient(180deg, var(--cp-bg2) 0%, var(--cp-bg1) 100%)',
              padding:'40px 24px 32px', position:'relative', textAlign:'center',
            }}>
              <button onClick={()=>{}} style={{
                position:'absolute', top:10, right:12,
                background:'transparent', border:'none', color:C.txt3,
                fontSize:20, cursor:'pointer', lineHeight:1,
              }}>×</button>
              <h3 style={{margin:'0 0 16px', fontSize:24, fontWeight:700, color:C.txt, fontFamily:C.fnt}}>
                Smarter, Faster Stock Research Starts with Elite
              </h3>
              <p style={{margin:'0 0 20px', fontSize:14, color:C.txt2, fontFamily:C.fnt, lineHeight:1.6}}>
                Unlock real-time market data, fullscreen multi-layout charts, custom alerts,<br/>
                advanced screening filters, ETF insights, seamless exports/API,<br/>
                and an ad-free experience—all in one powerful platform.
              </p>
              <button
                onClick={()=>window.dispatchEvent(new CustomEvent('cp:nav',{detail:'Pricing'}))}
                style={{
                  background:'#7c3aed', border:'none', color:'#fff',
                  borderRadius:6, padding:'14px 28px', fontSize:16, fontWeight:700,
                  cursor:'pointer', fontFamily:C.fnt,
                }}>
                Start Your Free 7-Day Pro Trial
              </button>
              <p style={{margin:'12px 0 4px', fontSize:12, color:C.txt3, fontFamily:C.fnt}}>No credit card required.</p>
              <p style={{margin:'4px 0 0', fontSize:11, color:C.txt3, fontFamily:C.fnt}}>
                After your trial ends: $29/mo (monthly) or $19/mo (billed annually at $228/yr)
              </p>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{
            marginTop:20, paddingBottom:40, textAlign:'center',
            fontSize:11, color:C.txt3, fontFamily:C.fnt, lineHeight:2,
          }}>
            <div style={{marginBottom:6}}>
              {['Affiliate','Advertise','Careers','Contact','Blog','Help','Privacy'].map((l,i)=>(
                <span key={l}>
                  <a href="#" style={{color:C.txt3, textDecoration:'none'}}
                    onMouseEnter={e=>e.currentTarget.style.color=C.link}
                    onMouseLeave={e=>e.currentTarget.style.color=C.txt3}>{l}</a>
                  {i < 6 && <span style={{margin:'0 5px', color:C.bg3}}>•</span>}
                </span>
              ))}
            </div>
            Quotes delayed 15 minutes for NASDAQ, NYSE and AMEX.<br/>
            Copyright © 2007-2026 Finviz.com. All Rights Reserved.
          </div>
        </>
      )}
    </>
  )
}