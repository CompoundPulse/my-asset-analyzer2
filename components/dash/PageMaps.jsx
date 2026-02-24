// PageMaps.jsx — live sector ETF prices from /api/stocks
'use client'
import { useState, useEffect } from 'react'
import { C } from './dashTheme'
import { SECTORS } from './dashData'

function SectorTile({ s, liveData, onT }) {
  const [hov, setHov] = useState(false)
  const q = liveData[s.etf]
  const chg = q?.changePercent ?? q?.dp ?? q?.regularMarketChangePercent
  const isUp = chg == null || chg >= 0
  const intensity = chg != null ? Math.min(Math.abs(chg)/3, 1) : 0
  const bg = chg == null ? 'var(--cp-bg2)'
    : isUp ? `rgba(0,${Math.floor(100+intensity*136)},0,${0.08+intensity*0.22})`
           : `rgba(${Math.floor(150+intensity*105)},0,0,${0.08+intensity*0.18})`
  return (
    <div style={{background:hov?(isUp?'rgba(0,180,0,0.2)':'rgba(200,0,0,0.2)'):bg,
      border:`1px solid ${isUp?'var(--cp-posD)':'var(--cp-negD)'}`,borderRadius:4,
      padding:'12px 14px',cursor:'pointer',minHeight:90}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{fontSize:12,fontWeight:700,color:'var(--cp-txt)',fontFamily:C.fnt,marginBottom:2}}>{s.name}</div>
      <div style={{fontSize:17,fontWeight:900,color:isUp?C.pos:C.neg,fontFamily:C.fnt,marginBottom:4}}>
        {chg != null ? `${isUp?'+':''}${parseFloat(chg).toFixed(2)}%` : <span style={{fontSize:12,color:'var(--cp-txt3)'}}>loading…</span>}
      </div>
      <div style={{fontSize:10,color:C.txt,fontFamily:C.fnt,marginBottom:6}}>{s.etf}</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
        {s.stocks.map(t=>(
          <a key={t} href="#" style={{fontSize:10,color:C.link,textDecoration:'none',background:'rgba(255,255,255,0.75)',borderRadius:2,padding:'1px 4px',fontFamily:C.fnt}}
            onClick={e=>{e.preventDefault();onT(t)}}>{t}</a>
        ))}
      </div>
    </div>
  )
}

export default function PageMaps({ onT }) {
  const [liveData, setLiveData] = useState({})

  useEffect(() => {
    const etfs = SECTORS.map(s=>s.etf)
    Promise.all(
      etfs.map(etf =>
        fetch(`/api/stocks?symbol=${etf}&type=quote`)
          .then(r=>r.ok?r.json():null)
          .then(data=>({etf,data}))
          .catch(()=>({etf,data:null}))
      )
    ).then(results => {
      const map = {}
      results.forEach(({etf,data})=>{ if(data) map[etf]=data })
      setLiveData(map)
    })
  }, [])

  return (
    <div style={{padding:'12px 0'}}>
      <div style={{marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:15,fontWeight:700,color:'var(--cp-txt)',fontFamily:C.fnt}}>Sector Heat Map</span>
        <span style={{fontSize:11,color:C.txt,fontFamily:C.fnt}}>Live ETF prices · Click any ticker for chart</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
        {SECTORS.map((s,i)=><SectorTile key={i} s={s} liveData={liveData} onT={onT}/>)}
      </div>
    </div>
  )
}