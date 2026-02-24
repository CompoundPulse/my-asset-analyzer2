'use client'
import { useState } from 'react'
import { C, bd, thS } from './dashTheme'
import { Spark } from './dashAtoms'

// Real data from Finviz Feb 2026 snapshot
const SECTOR_DATA = [
  {ticker:'basicmaterials',       label:'Basic Materials',        perfT:1.19,  perfW:2.94,  perfM:6.87,  perfQ:33.37, perfH:40.48, perfY:50.87, perfYtd:21.06},
  {ticker:'communicationservices',label:'Communication Services', perfT:2.32,  perfW:1.76,  perfM:-0.68, perfQ:4.28,  perfH:11.82, perfY:19.06, perfYtd:-1.60},
  {ticker:'consumercyclical',     label:'Consumer Cyclical',      perfT:0.98,  perfW:1.24,  perfM:-3.69, perfQ:2.84,  perfH:2.86,  perfY:1.86,  perfYtd:-2.25},
  {ticker:'consumerdefensive',    label:'Consumer Defensive',     perfT:0.17,  perfW:-2.11, perfM:6.51,  perfQ:14.85, perfH:7.43,  perfY:10.53, perfYtd:12.67},
  {ticker:'energy',               label:'Energy',                 perfT:-0.35, perfW:2.40,  perfM:11.43, perfQ:18.43, perfH:26.09, perfY:21.13, perfYtd:20.36},
  {ticker:'financial',            label:'Financial',              perfT:0.71,  perfW:1.05,  perfM:-0.91, perfQ:4.62,  perfH:10.21, perfY:17.42, perfYtd:-1.15},
  {ticker:'healthcare',           label:'Healthcare',             perfT:-0.51, perfW:0.72,  perfM:-0.43, perfQ:6.14,  perfH:5.28,  perfY:3.76,  perfYtd:1.99},
  {ticker:'industrials',          label:'Industrials',            perfT:0.23,  perfW:2.48,  perfM:5.84,  perfQ:17.21, perfH:22.34, perfY:28.45, perfYtd:15.17},
  {ticker:'realestate',           label:'Real Estate',            perfT:0.67,  perfW:1.56,  perfM:3.49,  perfQ:9.87,  perfH:12.31, perfY:15.62, perfYtd:7.10},
  {ticker:'technology',           label:'Technology',             perfT:0.61,  perfW:1.11,  perfM:-0.47, perfQ:7.83,  perfH:10.54, perfY:18.92, perfYtd:-1.50},
  {ticker:'utilities',            label:'Utilities',              perfT:0.43,  perfW:1.86,  perfM:6.90,  perfQ:16.43, perfH:19.87, perfY:24.61, perfYtd:9.19},
]

const VIEWS = ['Sectors','Industry','Country']
const PERFS  = ['Today','Week','Month','Quarter','Half Y','Year','YTD']

function perfColor(v) {
  if (v > 3)    return C.pos
  if (v > 0)    return '#26a69a'
  if (v > -3)   return C.neg
  return '#ef5350'
}

function PerfCell({ v }) {
  const pos = v >= 0
  return (
    <td style={{padding:'4px 8px',borderBottom:bd,textAlign:'right',fontSize:12,fontWeight:700,color:pos?C.pos:C.neg,whiteSpace:'nowrap'}}>
      {pos?'+':''}{v.toFixed(2)}%
    </td>
  )
}

function SectorRow({ r, i, onT }) {
  const [hov, setHov] = useState(false)
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1,cursor:'pointer'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12,color:C.link,fontWeight:600,whiteSpace:'nowrap'}}>{r.label}</td>
      <td style={{padding:'4px 8px',borderBottom:bd}}>
        <Spark pos={r.perfT>=0} seed={r.ticker.charCodeAt(0)*3+i}/>
      </td>
      <PerfCell v={r.perfT}/>
      <PerfCell v={r.perfW}/>
      <PerfCell v={r.perfM}/>
      <PerfCell v={r.perfQ}/>
      <PerfCell v={r.perfH}/>
      <PerfCell v={r.perfY}/>
      <PerfCell v={r.perfYtd}/>
    </tr>
  )
}

export default function PageGroups({ onT }) {
  const [view, setView] = useState('Sectors')
  const tbl = {width:'100%',borderCollapse:'collapse',fontFamily:C.fnt,fontSize:12}
  const thSt = {padding:'5px 8px',background:C.thBg,color:C.txt2,fontSize:11,fontWeight:700,borderBottom:`1px solid ${C.thBdr}`,textAlign:'left',whiteSpace:'nowrap'}
  const thR  = {...thSt,textAlign:'right'}

  return (
    <>
      {/* VIEW SELECTOR */}
      <div style={{display:'flex',alignItems:'center',gap:0,margin:'8px 0 12px',borderBottom:`1px solid ${C.bg3}`,paddingBottom:0}}>
        {VIEWS.map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{
            background:'transparent',border:'none',borderBottom:v===view?`2px solid ${C.link}`:'2px solid transparent',
            color:v===view?C.link:C.txt2,fontSize:13,fontWeight:700,padding:'6px 16px',cursor:'pointer',
            fontFamily:C.fnt,marginBottom:-1,
          }}>{v}</button>
        ))}
      </div>

      {/* PERFORMANCE TABLE */}
      <table style={tbl}>
        <thead><tr>
          <th style={{...thSt,width:'22%'}}>Name</th>
          <th style={thSt}>Chart</th>
          {['Today','Week','Month','Quarter','Half Y','Year','YTD'].map(h=>(
            <th key={h} style={thR}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {SECTOR_DATA.map((r,i)=><SectorRow key={r.ticker} r={r} i={i} onT={onT}/>)}
        </tbody>
      </table>

      <div style={{marginTop:12,fontSize:10,color:C.txt3,fontFamily:C.fnt}}>
        Sector performance data. Market data delayed 15 minutes.
      </div>
    </>
  )
}