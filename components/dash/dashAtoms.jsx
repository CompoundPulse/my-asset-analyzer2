// dashAtoms.jsx — Spark, shared row components, thead helpers
'use client'
import { useState, useEffect, useRef } from 'react'
import { C, bd, thS } from './dashTheme'

/* ─── MINI SPARKLINE ─────────────────────────────────────────── */
// Uses bright colors readable on BOTH dark and light backgrounds
const SPARK_POS = '#26a69a'  // bright teal — visible on dark AND light
const SPARK_NEG = '#ef5350'  // bright red  — visible on dark AND light

export function Spark({ pos, seed, w=68, h=22 }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    let p = 30 + (seed % 15), pts = []
    for (let i = 0; i < 20; i++) {
      p += (pos ? 0.1 : -0.1) + (Math.random() - 0.48) * 1.4
      pts.push(Math.max(3, Math.min(57, p)))
    }
    const lo = Math.min(...pts)-1, hi = Math.max(...pts)+1
    const sy = v => h - ((v-lo)/(hi-lo||1))*(h-2)-1
    const sx = i => (i/(pts.length-1))*w
    ctx.clearRect(0,0,w,h)
    ctx.beginPath()
    pts.forEach((v,i) => i===0 ? ctx.moveTo(sx(i),sy(v)) : ctx.lineTo(sx(i),sy(v)))
    ctx.strokeStyle = pos ? SPARK_POS : SPARK_NEG
    ctx.lineWidth = 1.5; ctx.stroke()
  }, [pos, seed, w, h])
  return <canvas ref={ref} width={w} height={h} style={{width:w,height:h,display:'inline-block',verticalAlign:'middle'}}/>
}

/* ─── SIGNAL TABLE ROW ───────────────────────────────────────── */
export function SigRow({ r, i, onT }) {
  const [hov, setHov] = useState(false)
  const seed = r.t.charCodeAt(0)*3+(r.t.charCodeAt(r.t.length-1)||7)
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1,cursor:'pointer'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'3px 4px 3px 6px',borderBottom:bd,whiteSpace:'nowrap'}}>
        <a style={{color:C.link,textDecoration:'none',fontWeight:600,fontSize:12}} href="#"
          onClick={e=>{e.preventDefault();onT(r.t)}}>{r.t}</a>
      </td>
      <td style={{padding:'3px 8px',borderBottom:bd,textAlign:'right',fontWeight:600,fontSize:12,color:C.txt,whiteSpace:'nowrap'}}>{r.p}</td>
      <td style={{padding:'3px 8px',borderBottom:bd,textAlign:'right',fontWeight:600,fontSize:12,color:r.pos?C.pos:C.neg,whiteSpace:'nowrap'}}>{r.c}</td>
      <td style={{padding:'3px 8px',borderBottom:bd,textAlign:'right',fontSize:12,color:C.txt,whiteSpace:'nowrap'}}>{r.v}</td>
      <td style={{width:4,borderBottom:bd}}/>
      <td style={{padding:'3px 6px',borderBottom:bd,width:'35%'}}>
        <a style={{color:C.link,textDecoration:'none',fontSize:11,marginRight:6,whiteSpace:'nowrap'}} href="#">{r.s}</a>
        <Spark pos={r.pos} seed={seed}/>
      </td>
    </tr>
  )
}

/* ─── NEWS ROW ───────────────────────────────────────────────── */
export function NewsRow({ r, i, onT }) {
  const [hov, setHov] = useState(false)
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'3px 6px',borderBottom:bd,width:'16%',verticalAlign:'top',whiteSpace:'nowrap'}}>
        <a style={{color:C.link,fontWeight:700,fontSize:12,textDecoration:'none'}} href="#"
          onClick={e=>{e.preventDefault();onT(r.t)}}>{r.t}</a>
        <span style={{marginLeft:5,fontSize:11,fontWeight:700,color:r.pos?C.pos:C.neg}}>{r.c}</span>
      </td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:12,lineHeight:'1.4',color:C.txt}}>
        <a style={{color:C.link,textDecoration:'none'}} href={r.url||'#'} target="_blank" rel="noopener noreferrer"
          onMouseEnter={e=>e.target.style.textDecoration='underline'}
          onMouseLeave={e=>e.target.style.textDecoration='none'}>{r.h}</a>
        <span style={{color:C.txt2,fontSize:10,marginLeft:6}}>{r.src}</span>
      </td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:10,color:C.txt2,whiteSpace:'nowrap',verticalAlign:'top'}}>{r.time}</td>
    </tr>
  )
}

/* ─── PATTERN ROW ────────────────────────────────────────────── */
export function PatRow({ r, i, onT }) {
  const [hov, setHov] = useState(false)
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1,cursor:'pointer'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      {r.tt.map((t,ti)=>(
        <td key={ti} style={{padding:'3px 5px',borderBottom:bd,fontSize:12}}>
          <a style={{color:C.link,textDecoration:'none'}} href="#"
            onClick={e=>{e.preventDefault();onT(t)}}>{t}</a>
        </td>
      ))}
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:12}}>
        <a style={{color:C.link,textDecoration:'none',whiteSpace:'nowrap'}} href="#">{r.s}</a>
      </td>
    </tr>
  )
}

/* ─── THEAD HELPERS ──────────────────────────────────────────── */
export const SigHead = () => (
  <thead><tr>
    <th style={thS(false)}>Ticker</th>
    <th style={thS(true)}>Last</th>
    <th style={thS(true)}>Change</th>
    <th style={thS(true)}>Volume</th>
    <th style={{width:4,borderBottom:`1px solid ${C.thBdr}`,background:C.thBg}}/>
    <th style={{...thS(false),width:'35%'}}>
      <span style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>Signal</span>
        <button style={{fontSize:10,color:C.link,background:'transparent',border:`1px solid ${C.thBdr}`,borderRadius:2,padding:'1px 5px',cursor:'pointer',fontFamily:C.fnt}}>Daily ▾</button>
      </span>
    </th>
  </tr></thead>
)
export const PatHead = () => (
  <thead><tr>
    <th colSpan={4} style={thS(false)}>Tickers</th>
    <th style={thS(false)}>Signal</th>
  </tr></thead>
)