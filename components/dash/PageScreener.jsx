'use client'
import { useState, useEffect, useRef } from 'react'
import { C, bd, thS } from './dashTheme'
import { SCREENER_TICKERS } from './dashData'
import { Spark } from './dashAtoms'

function ScrRow({ r, i, q, onT }) {
  const [hov, setHov] = useState(false)
  const price  = q?.price
  const chgPct = q?.changePercent
  const pos    = chgPct == null || parseFloat(chgPct) >= 0
  const seed   = r.t.charCodeAt(0)*3+(r.t.charCodeAt(r.t.length-1)||7)
  const fmtVol = v => {
    if (!v) return '—'
    const n = parseFloat(v)
    if (n>=1e9) return (n/1e9).toFixed(1)+'B'
    if (n>=1e6) return (n/1e6).toFixed(1)+'M'
    if (n>=1e3) return (n/1e3).toFixed(0)+'K'
    return String(n)
  }
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:'var(--cp-bg1)',cursor:'pointer'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>onT(r.t)}>
      <td style={{padding:'4px 8px',borderBottom:bd,whiteSpace:'nowrap'}}>
        <span style={{color:C.link,fontWeight:700,fontSize:12}}>{r.t}</span>
      </td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,color:C.txt,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.n}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,color:C.txt,whiteSpace:'nowrap'}}>{r.sec}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,textAlign:'right',fontWeight:600,color:'var(--cp-txt)',whiteSpace:'nowrap'}}>
        {price != null ? `$${parseFloat(price).toFixed(2)}` : <span style={{color:'var(--cp-txt3)',fontSize:10}}>…</span>}
      </td>
      <td style={{padding:'4px 8px',borderBottom:bd,textAlign:'right',fontWeight:700,
        color:pos?C.pos:C.neg,whiteSpace:'nowrap'}}>
        {chgPct != null ? `${pos?'+':''}${parseFloat(chgPct).toFixed(2)}%` : <span style={{color:'var(--cp-txt3)',fontSize:10}}>…</span>}
      </td>
      <td style={{padding:'4px 8px',borderBottom:bd,textAlign:'right',fontSize:12,color:C.txt,whiteSpace:'nowrap'}}>
        {fmtVol(q?.volume)}
      </td>
      <td style={{padding:'4px 8px',borderBottom:bd}}>
        {q && <Spark pos={pos} seed={seed}/>}
      </td>
    </tr>
  )
}

export default function PageScreener({ onT }) {
  const [filter, setFilter] = useState('')
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('chg') // chg | price | vol
  const [sortDir, setSortDir] = useState(-1)  // -1 desc, 1 asc
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    // Use cached market-data endpoint
    const syms = SCREENER_TICKERS.map(r=>r.t).join(',')
    fetch(`/api/batch-quotes?symbols=${syms}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => { setQuotes(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSort = col => {
    if (sortBy === col) setSortDir(d => d * -1)
    else { setSortBy(col); setSortDir(-1) }
  }

  const TH = ({label, col, right}) => (
    <th style={{...thS(right),cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}
      onClick={()=>col&&handleSort(col)}>
      {label}{sortBy===col?(sortDir===-1?' ↓':' ↑'):''}
    </th>
  )

  let rows = SCREENER_TICKERS.filter(r =>
    !filter ||
    r.t.toUpperCase().startsWith(filter.toUpperCase()) ||
    r.n.toLowerCase().includes(filter.toLowerCase()) ||
    r.sec.toLowerCase().includes(filter.toLowerCase())
  )

  rows = [...rows].sort((a,b) => {
    const qa = quotes[a.t], qb = quotes[b.t]
    if (sortBy === 'chg')   return sortDir * ((parseFloat(qb?.changePercent)||0) - (parseFloat(qa?.changePercent)||0))
    if (sortBy === 'price') return sortDir * ((parseFloat(qb?.price)||0) - (parseFloat(qa?.price)||0))
    if (sortBy === 'vol')   return sortDir * ((parseFloat(qb?.volume)||0) - (parseFloat(qa?.volume)||0))
    return 0
  })

  return (
    <div style={{padding:'12px 0'}}>
      <div style={{marginBottom:10,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <span style={{fontSize:15,fontWeight:700,color:'var(--cp-txt)',fontFamily:C.fnt}}>Stock Screener</span>
        <input value={filter} onChange={e=>setFilter(e.target.value)}
          placeholder="Filter ticker, company, sector…"
          style={{border:bd,borderRadius:3,padding:'4px 8px',fontSize:12,fontFamily:C.fnt,outline:'none',width:250}}/>
        <span style={{fontSize:11,color:C.txt,fontFamily:C.fnt}}>
          {loading ? 'Fetching live prices…' : `${rows.length} results · Finnhub · cached 15min`}
        </span>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:C.fnt,minWidth:600}}>
          <thead><tr>
            <TH label="Ticker"/><TH label="Company"/><TH label="Sector"/>
            <TH label="Price" col="price" right/>
            <TH label="Change" col="chg" right/>
            <TH label="Volume" col="vol" right/>
            <TH label="Daily"/>
          </tr></thead>
          <tbody>
            {rows.map((r,i) => <ScrRow key={r.t} r={r} i={i} q={quotes[r.t]} onT={onT}/>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}