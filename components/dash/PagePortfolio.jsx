'use client'
import { useState, useEffect, useRef } from 'react'
import { C, bd, thS } from './dashTheme'
import { SCREENER_TICKERS, CRYPTO_SYMBOLS, CRYPTO_NAMES } from './dashData'
import { supabase } from '../../lib/supabase'

const LOCAL_KEY = 'cp_portfolio_v2'

const ALL_TICKERS = [
  ...SCREENER_TICKERS,
  ...CRYPTO_SYMBOLS.map(t => ({ t, n: CRYPTO_NAMES[t] || t, sec: 'Crypto' })),
]

// ── Row ──────────────────────────────────────────────────────────────────────
function HoldingRow({ r, i, onT, onRemove, livePrice }) {
  const [hov, setHov] = useState(false)
  const price     = livePrice ?? r.avg
  const value     = r.shares * price
  const pnl       = value - r.shares * r.avg
  const pnlPct    = r.avg > 0 ? ((pnl / (r.shares * r.avg)) * 100).toFixed(2) : '0.00'
  const pos       = pnl >= 0
  const fmt = v => `$${Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:'var(--cp-bg1)'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'6px 8px',borderBottom:bd}}>
        <span style={{color:C.link,fontWeight:700,cursor:'pointer',fontSize:12}}
          onClick={()=>onT(r.t)}>{r.t}</span>
        <span style={{color:'var(--cp-txt3)',fontSize:10,marginLeft:4}}>{r.name}</span>
      </td>
      <td style={{padding:'6px 8px',borderBottom:bd,textAlign:'right',fontSize:12}}>{r.shares}</td>
      <td style={{padding:'6px 8px',borderBottom:bd,textAlign:'right',fontSize:12}}>{fmt(r.avg)}</td>
      <td style={{padding:'6px 8px',borderBottom:bd,textAlign:'right',fontWeight:700,color:'var(--cp-txt)',fontSize:12}}>
        {livePrice ? fmt(value) : '—'}
      </td>
      <td style={{padding:'6px 8px',borderBottom:bd,textAlign:'right',fontWeight:700,
        color:pos?C.pos:C.neg,fontSize:12}}>
        {livePrice ? `${pos?'+':''}${pnlPct}%` : '—'}
      </td>
      <td style={{padding:'6px 8px',borderBottom:bd,textAlign:'right',fontWeight:600,
        color:pos?C.pos:C.neg,fontSize:11}}>
        {livePrice ? `${pos?'+':''}${fmt(pnl)}` : '—'}
      </td>
      <td style={{padding:'6px 8px',borderBottom:bd}}>
        <span onClick={()=>onRemove(r.t)}
          style={{fontSize:11,color:C.neg,cursor:'pointer',fontWeight:600}}>Remove</span>
      </td>
    </tr>
  )
}

// ── Ticker search dropdown ────────────────────────────────────────────────────
function TickerSearch({ value, onChange, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const results = value.length > 0
    ? ALL_TICKERS.filter(x =>
        x.t.startsWith(value.toUpperCase()) ||
        x.n.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : []
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <input value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Ticker" autoComplete="off"
        style={{border:bd,borderRadius:3,padding:'6px 8px',fontSize:12,
          fontFamily:C.fnt,outline:'none',width:100,textTransform:'uppercase'}}
      />
      {open && results.length > 0 && (
        <div style={{position:'absolute',top:'calc(100% + 2px)',left:0,zIndex:9999,
          background:'var(--cp-bg1)',border:'1px solid #c0c8e0',borderRadius:4,minWidth:270,
          boxShadow:'0 6px 20px rgba(0,0,0,0.15)',maxHeight:260,overflowY:'auto'}}>
          {results.map(x => (
            <div key={x.t}
              onMouseDown={e => { e.preventDefault(); onSelect(x.t); setOpen(false) }}
              style={{padding:'7px 12px',cursor:'pointer',display:'flex',gap:8,alignItems:'center',
                fontSize:12,fontFamily:C.fnt,borderBottom:'1px solid #f5f5f5'}}
              onMouseEnter={e => e.currentTarget.style.background='var(--cp-bg2)'}
              onMouseLeave={e => e.currentTarget.style.background='var(--cp-bg1)'}>
              <span style={{fontWeight:700,color:C.link,minWidth:52}}>{x.t}</span>
              <span style={{color:'var(--cp-txt2)',fontSize:11,flex:1}}>{x.n}</span>
              <span style={{color:'var(--cp-txt3)',fontSize:10}}>{x.sec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PagePortfolio({ onT }) {
  const [holdings, setHoldings] = useState([])
  const [quotes,   setQuotes]   = useState({})
  const [userId,   setUserId]   = useState(null)
  const [synced,   setSynced]   = useState(false)   // true = loaded from Supabase
  const [newT, setNewT] = useState('')
  const [newS, setNewS] = useState('')
  const [newA, setNewA] = useState('')
  const [err,  setErr]  = useState('')
  const sharesRef = useRef(null)
  const priceRef  = useRef(null)

  // ── Auth + load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        // Load from Supabase
        supabase.from('portfolio_holdings')
          .select('ticker,shares,avg_cost')
          .eq('user_id', uid)
          .order('created_at', { ascending: true })
          .then(({ data }) => {
            if (data?.length) {
              setHoldings(data.map(r => ({
                t: r.ticker, shares: r.shares, avg: r.avg_cost,
                name: ALL_TICKERS.find(x=>x.t===r.ticker)?.n || ''
              })))
            }
            setSynced(true)
          })
      } else {
        // Load from localStorage
        try {
          const s = window.localStorage.getItem(LOCAL_KEY)
          if (s) setHoldings(JSON.parse(s))
        } catch {}
        setSynced(true)
      }
    })
  }, [])

  // ── Persist ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!synced) return
    if (!userId) {
      try { window.localStorage.setItem(LOCAL_KEY, JSON.stringify(holdings)) } catch {}
    }
  }, [holdings, synced, userId])

  // ── Live prices ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!holdings.length) { setQuotes({}); return }
    fetch(`/api/batch-quotes?symbols=${holdings.map(h=>h.t).join(',')}`)
      .then(r=>r.ok?r.json():{}).then(setQuotes).catch(()=>{})
  }, [holdings.map(h=>h.t).join(',')])

  // ── Add ──────────────────────────────────────────────────────────────────────
  const add = async () => {
    setErr('')
    const t = newT.trim().toUpperCase()
    const s = parseFloat(newS)
    const a = parseFloat(newA)
    if (!t)             return setErr('⚠ Enter a ticker symbol')
    if (isNaN(s)||s<=0) return setErr('⚠ Enter share count (e.g. 10)')
    if (isNaN(a)||a<=0) return setErr('⚠ Enter avg price (e.g. 150.00)')
    if (holdings.find(h=>h.t===t)) return setErr(`⚠ ${t} already in portfolio`)

    const meta = ALL_TICKERS.find(x=>x.t===t)
    const holding = { t, shares: s, avg: a, name: meta?.n || '' }

    if (userId) {
      const { error } = await supabase.from('portfolio_holdings').upsert({
        user_id: userId, ticker: t, shares: s, avg_cost: a
      }, { onConflict: 'user_id,ticker' })
      if (error) return setErr('⚠ Save failed: ' + error.message)
    }
    setHoldings(prev => [...prev, holding])
    setNewT(''); setNewS(''); setNewA('')
    setTimeout(() => sharesRef.current?.focus(), 50)
  }

  // ── Remove ───────────────────────────────────────────────────────────────────
  const remove = async ticker => {
    if (userId) {
      await supabase.from('portfolio_holdings')
        .delete().eq('user_id', userId).eq('ticker', ticker)
    }
    setHoldings(prev => prev.filter(h => h.t !== ticker))
  }

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalValue = holdings.reduce((s,h) => s + h.shares*(quotes[h.t]?.price ?? h.avg), 0)
  const totalCost  = holdings.reduce((s,h) => s + h.shares*h.avg, 0)
  const totalPnl   = totalValue - totalCost
  const totalPct   = totalCost > 0 ? ((totalPnl/totalCost)*100).toFixed(2) : '0.00'
  const pos        = totalPnl >= 0
  const fmt = v => `$${Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`

  const numInp = (val, set, ph, ref, w=90) => (
    <input ref={ref} value={val} onChange={e=>set(e.target.value)}
      onKeyDown={e=>e.key==='Enter'&&add()} placeholder={ph}
      style={{border:bd,borderRadius:3,padding:'6px 8px',fontSize:12,
        fontFamily:C.fnt,outline:'none',width:w}}/>
  )

  return (
    <div style={{padding:'12px 0'}}>
      {/* Header */}
      <div style={{marginBottom:12,display:'flex',alignItems:'flex-start',
        justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <div>
          <span style={{fontSize:15,fontWeight:700,color:'var(--cp-txt)',fontFamily:C.fnt}}>Portfolio</span>
          <span style={{fontSize:11,marginLeft:10,fontFamily:C.fnt,
            color:userId?'#4caf50':'#f59e0b',fontWeight:600}}>
            {userId ? '✓ Synced to your account' : '⚠ Sign in to save across devices'}
          </span>
        </div>
        {holdings.length > 0 && (
          <div style={{textAlign:'right',fontFamily:C.fnt}}>
            <div style={{fontSize:20,fontWeight:900,color:'var(--cp-txt)'}}>{fmt(totalValue)}</div>
            <div style={{fontSize:12,fontWeight:700,color:pos?C.pos:C.neg}}>
              {pos?'+':''}{totalPct}% &nbsp;({pos?'+':''}{fmt(totalPnl)})
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',maxWidth:860,borderCollapse:'collapse',
          fontSize:12,fontFamily:C.fnt,minWidth:580}}>
          <thead><tr>
            <th style={thS()}>Ticker</th>
            <th style={thS(true)}>Shares</th>
            <th style={thS(true)}>Avg Cost</th>
            <th style={thS(true)}>Live Value</th>
            <th style={thS(true)}>P&L %</th>
            <th style={thS(true)}>P&L $</th>
            <th style={thS()}>Action</th>
          </tr></thead>
          <tbody>
            {holdings.length === 0
              ? <tr><td colSpan={7} style={{padding:'24px 8px',textAlign:'center',
                  color:'var(--cp-txt3)',fontStyle:'italic'}}>
                  No holdings yet — add your first position below
                </td></tr>
              : holdings.map((r,i) => (
                  <HoldingRow key={r.t} r={r} i={i} onT={onT} onRemove={remove}
                    livePrice={quotes[r.t]?.price}/>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Add form — outside table to prevent overflow clipping of dropdown */}
      <div style={{marginTop:10,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',
        background:'var(--cp-bg2)',padding:'10px 10px',borderRadius:4,maxWidth:860}}>
        <TickerSearch value={newT} onChange={setNewT}
          onSelect={t => { setNewT(t); setTimeout(()=>sharesRef.current?.focus(),60) }}/>
        {numInp(newS,setNewS,'Shares',sharesRef,85)}
        {numInp(newA,setNewA,'Avg Price',priceRef,100)}
        <button onClick={add}
          style={{fontSize:12,background:C.link,color:'#fff',border:'none',
            borderRadius:3,padding:'7px 18px',cursor:'pointer',
            fontFamily:C.fnt,fontWeight:700,whiteSpace:'nowrap'}}>
          + Add Position
        </button>
      </div>

      {err && <div style={{marginTop:6,color:C.neg,fontSize:12,fontFamily:C.fnt}}>{err}</div>}
      <div style={{marginTop:6,fontSize:10,color:'var(--cp-txt3)',fontFamily:C.fnt}}>
        {userId
          ? 'Holdings synced to your Supabase account · Live prices via Finnhub'
          : 'Holdings saved in browser · Sign in to sync across devices · Live prices via Finnhub'}
      </div>
    </div>
  )
}