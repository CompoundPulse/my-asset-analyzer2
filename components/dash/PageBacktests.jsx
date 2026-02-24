'use client'
import { useState, useRef, useEffect } from 'react'
import { C, bd, thS } from './dashTheme'

const STRATEGIES = [
  { id:'sma_cross',  label:'SMA Crossover',     desc:'Buy when 50-day SMA crosses above 200-day. Sell when crosses below.' },
  { id:'rsi_ob',     label:'RSI Overbought/Oversold', desc:'Buy RSI < 30. Sell RSI > 70.' },
  { id:'bb_bounce',  label:'Bollinger Band Bounce',  desc:'Buy at lower band, sell at upper band.' },
  { id:'macd_cross', label:'MACD Crossover',    desc:'Buy MACD crosses signal up. Sell crosses down.' },
  { id:'mom_break',  label:'Momentum Breakout', desc:'Buy 52-week high breakout. Sell 20-day low breakdown.' },
]

const PRESETS = ['AAPL','MSFT','NVDA','SPY','QQQ','TSLA','GOOGL','AMZN','BTC','ETH']

function calcSMA(prices, n) {
  return prices.map((_, i) => i >= n-1
    ? prices.slice(i-n+1, i+1).reduce((a,b)=>a+b,0)/n : null)
}
function calcRSI(prices, n=14) {
  const changes = prices.map((p,i)=>i===0?0:p-prices[i-1])
  return prices.map((_,i) => {
    if (i < n) return null
    const slice = changes.slice(i-n+1, i+1)
    const gains = slice.filter(c=>c>0).reduce((a,b)=>a+b,0)/n
    const losses = Math.abs(slice.filter(c=>c<0).reduce((a,b)=>a+b,0))/n
    return losses===0 ? 100 : 100 - (100/(1+(gains/losses)))
  })
}
function calcBB(prices, n=20, k=2) {
  return prices.map((_,i) => {
    if (i < n-1) return null
    const sl = prices.slice(i-n+1,i+1)
    const mean = sl.reduce((a,b)=>a+b,0)/n
    const std = Math.sqrt(sl.reduce((a,b)=>a+(b-mean)**2,0)/n)
    return { upper: mean+k*std, lower: mean-k*std, mid: mean }
  })
}
function calcMACD(prices) {
  const ema = (p, n) => {
    const k = 2/(n+1), result = Array(p.length).fill(null)
    let e = p.slice(0,n).filter(x=>x!=null).reduce((a,b)=>a+b,0)/n
    result[n-1] = e
    for (let i=n; i<p.length; i++) { e = p[i]*k + e*(1-k); result[i]=e }
    return result
  }
  const e12 = ema(prices,12), e26 = ema(prices,26)
  const macd = prices.map((_,i) => e12[i]&&e26[i] ? e12[i]-e26[i] : null)
  const signal = ema(macd.map(x=>x??0), 9)
  return { macd, signal }
}

function runBacktest(prices, dates, stratId) {
  const trades = []
  let inTrade = false, entryPrice = 0, entryDate = ''

  if (stratId === 'sma_cross') {
    const s50 = calcSMA(prices,50), s200 = calcSMA(prices,200)
    for (let i=1; i<prices.length; i++) {
      if (!s50[i]||!s200[i]||!s50[i-1]||!s200[i-1]) continue
      if (!inTrade && s50[i]>s200[i] && s50[i-1]<=s200[i-1]) { inTrade=true; entryPrice=prices[i]; entryDate=dates[i] }
      else if (inTrade && s50[i]<s200[i] && s50[i-1]>=s200[i-1]) {
        trades.push({ entry:entryDate,exit:dates[i],buy:entryPrice,sell:prices[i],ret:((prices[i]-entryPrice)/entryPrice*100) })
        inTrade=false
      }
    }
  } else if (stratId === 'rsi_ob') {
    const rsi = calcRSI(prices)
    for (let i=1; i<prices.length; i++) {
      if (!rsi[i]||!rsi[i-1]) continue
      if (!inTrade && rsi[i]>=30 && rsi[i-1]<30) { inTrade=true; entryPrice=prices[i]; entryDate=dates[i] }
      else if (inTrade && rsi[i]<=70 && rsi[i-1]>70) {
        trades.push({ entry:entryDate,exit:dates[i],buy:entryPrice,sell:prices[i],ret:((prices[i]-entryPrice)/entryPrice*100) })
        inTrade=false
      }
    }
  } else if (stratId === 'bb_bounce') {
    const bb = calcBB(prices)
    for (let i=1; i<prices.length; i++) {
      if (!bb[i]||!bb[i-1]) continue
      if (!inTrade && prices[i-1]<=bb[i-1].lower && prices[i]>bb[i].lower) { inTrade=true; entryPrice=prices[i]; entryDate=dates[i] }
      else if (inTrade && prices[i]>=bb[i].upper) {
        trades.push({ entry:entryDate,exit:dates[i],buy:entryPrice,sell:prices[i],ret:((prices[i]-entryPrice)/entryPrice*100) })
        inTrade=false
      }
    }
  } else if (stratId === 'macd_cross') {
    const { macd, signal } = calcMACD(prices)
    for (let i=1; i<prices.length; i++) {
      if (!macd[i]||!signal[i]||!macd[i-1]||!signal[i-1]) continue
      if (!inTrade && macd[i]>signal[i] && macd[i-1]<=signal[i-1]) { inTrade=true; entryPrice=prices[i]; entryDate=dates[i] }
      else if (inTrade && macd[i]<signal[i] && macd[i-1]>=signal[i-1]) {
        trades.push({ entry:entryDate,exit:dates[i],buy:entryPrice,sell:prices[i],ret:((prices[i]-entryPrice)/entryPrice*100) })
        inTrade=false
      }
    }
  } else if (stratId === 'mom_break') {
    for (let i=52; i<prices.length; i++) {
      const high52 = Math.max(...prices.slice(i-52,i))
      const low20  = Math.min(...prices.slice(Math.max(0,i-20),i))
      if (!inTrade && prices[i]>high52) { inTrade=true; entryPrice=prices[i]; entryDate=dates[i] }
      else if (inTrade && prices[i]<low20) {
        trades.push({ entry:entryDate,exit:dates[i],buy:entryPrice,sell:prices[i],ret:((prices[i]-entryPrice)/entryPrice*100) })
        inTrade=false
      }
    }
  }

  if (inTrade) {
    const last = prices.length-1
    trades.push({ entry:entryDate, exit:dates[last]+'*', buy:entryPrice, sell:prices[last], ret:((prices[last]-entryPrice)/entryPrice*100), open:true })
  }

  return trades
}

export default function PageBacktests({ onT }) {
  const [ticker,   setTicker]   = useState('AAPL')
  const [stratId,  setStratId]  = useState('sma_cross')
  const [trades,   setTrades]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const canRef = useRef(null)

  const run = async () => {
    setError(''); setTrades(null); setLoading(true)
    try {
      const sym = ticker.trim().toUpperCase()
      const r = await fetch(`/api/daily?symbol=${sym}`)
      if (!r.ok) throw new Error('Failed to fetch price data')
      const d = await r.json()
      if (!d.prices?.length) throw new Error('No price data available for ' + sym)
      const prices = d.prices.map(p => p.value ?? p.close)
      const dates  = d.prices.map(p => p.date?.slice(0,10) || '')
      if (prices.length < 100) throw new Error('Not enough history (need 100+ days)')
      const result = runBacktest(prices, dates, stratId)
      setTrades({ list: result, prices, dates, sym })
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  // Draw equity curve
  useEffect(() => {
    if (!trades || !canRef.current) return
    const canvas = canRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)

    // Build equity curve
    let equity = 10000, curve = [equity]
    for (const t of trades.list) {
      equity *= (1 + t.ret/100)
      curve.push(equity)
    }
    if (curve.length < 2) return

    const lo = Math.min(...curve), hi = Math.max(...curve)
    const sx = i => 20 + (i/(curve.length-1))*(W-40)
    const sy = v => H-20 - ((v-lo)/(hi-lo||1))*(H-40)
    const pos = curve[curve.length-1] >= curve[0]

    // Grid
    ctx.strokeStyle='var(--cp-bg2)'; ctx.lineWidth=1
    for (let i=0;i<5;i++) { ctx.beginPath(); ctx.moveTo(20,20+i*(H-40)/4); ctx.lineTo(W-20,20+i*(H-40)/4); ctx.stroke() }

    // Baseline
    const base = sy(10000)
    ctx.strokeStyle='var(--cp-bg3)'; ctx.setLineDash([4,3]); ctx.beginPath()
    ctx.moveTo(20,base); ctx.lineTo(W-20,base); ctx.stroke()
    ctx.setLineDash([])

    // Gradient fill
    const grad = ctx.createLinearGradient(0,sy(hi),0,sy(lo))
    grad.addColorStop(0, pos?'rgba(38,166,91,0.2)':'rgba(232,64,64,0.2)')
    grad.addColorStop(1,'rgba(255,255,255,0)')
    ctx.beginPath(); ctx.moveTo(sx(0),sy(curve[0]))
    curve.forEach((v,i)=>ctx.lineTo(sx(i),sy(v)))
    ctx.lineTo(sx(curve.length-1),H-20); ctx.lineTo(sx(0),H-20); ctx.closePath()
    ctx.fillStyle=grad; ctx.fill()

    // Line
    ctx.strokeStyle=pos?C.pos:C.neg; ctx.lineWidth=2
    ctx.beginPath(); ctx.moveTo(sx(0),sy(curve[0]))
    curve.forEach((v,i)=>ctx.lineTo(sx(i),sy(v)))
    ctx.stroke()
  }, [trades])

  const strat = STRATEGIES.find(s=>s.id===stratId)

  // Summary stats
  const stats = trades ? (() => {
    const wins  = trades.list.filter(t=>t.ret>0)
    const total = trades.list.reduce((s,t)=>s*(1+t.ret/100),1)
    return {
      n:       trades.list.length,
      winRate: trades.list.length ? (wins.length/trades.list.length*100).toFixed(0) : 0,
      totalRet:((total-1)*100).toFixed(1),
      avgTrade: trades.list.length ? (trades.list.reduce((s,t)=>s+t.ret,0)/trades.list.length).toFixed(2) : 0,
      best:     trades.list.length ? Math.max(...trades.list.map(t=>t.ret)).toFixed(2) : 0,
      worst:    trades.list.length ? Math.min(...trades.list.map(t=>t.ret)).toFixed(2) : 0,
      pos:      total >= 1,
    }
  })() : null

  return (
    <div style={{padding:'12px 0'}}>
      <div style={{marginBottom:12,fontSize:15,fontWeight:700,color:'var(--cp-txt)',fontFamily:C.fnt}}>
        Strategy Backtester
      </div>

      {/* Controls */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12,alignItems:'center'}}>
        <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==='Enter'&&run()}
          placeholder="Ticker" style={{border:bd,borderRadius:3,padding:'6px 8px',
            fontSize:12,fontFamily:C.fnt,width:90,outline:'none',textTransform:'uppercase'}}/>
        <select value={stratId} onChange={e=>setStratId(e.target.value)}
          style={{border:bd,borderRadius:3,padding:'6px 8px',fontSize:12,fontFamily:C.fnt,outline:'none'}}>
          {STRATEGIES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button onClick={run} disabled={loading}
          style={{fontSize:12,background:loading?'var(--cp-txt3)':C.link,color:'#fff',border:'none',
            borderRadius:3,padding:'7px 18px',cursor:loading?'default':'pointer',
            fontFamily:C.fnt,fontWeight:700}}>
          {loading ? 'Running…' : '▶ Run Backtest'}
        </button>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {PRESETS.map(p=>(
            <span key={p} onClick={()=>setTicker(p)}
              style={{fontSize:11,color:C.link,cursor:'pointer',padding:'3px 6px',
                border:bd,borderRadius:3,fontFamily:C.fnt,
                background:ticker===p?'var(--cp-bg2)':'var(--cp-bg1)'}}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {strat && (
        <div style={{marginBottom:10,fontSize:11,color:'var(--cp-txt2)',fontFamily:C.fnt,
          background:'var(--cp-bg0)',padding:'6px 10px',borderRadius:3,border:bd}}>
          <strong>{strat.label}:</strong> {strat.desc}
        </div>
      )}

      {error && <div style={{color:C.neg,fontSize:12,fontFamily:C.fnt,marginBottom:8}}>⚠ {error}</div>}

      {stats && (
        <>
          {/* Stats strip */}
          <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:10,
            background:'var(--cp-bg2)',padding:'10px 12px',borderRadius:4,fontFamily:C.fnt}}>
            {[
              ['Total Return', `${stats.pos?'+':''}${stats.totalRet}%`, stats.pos?C.pos:C.neg],
              ['Trades', stats.n, 'var(--cp-txt)'],
              ['Win Rate', `${stats.winRate}%`, parseFloat(stats.winRate)>=50?C.pos:C.neg],
              ['Avg Trade', `${stats.avgTrade>0?'+':''}${stats.avgTrade}%`, stats.avgTrade>=0?C.pos:C.neg],
              ['Best Trade', `+${stats.best}%`, C.pos],
              ['Worst Trade', `${stats.worst}%`, C.neg],
            ].map(([label,val,color])=>(
              <div key={label} style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--cp-txt2)',marginBottom:2}}>{label}</div>
                <div style={{fontSize:14,fontWeight:700,color}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Equity curve */}
          <canvas ref={canRef} width={700} height={160}
            style={{width:'100%',maxWidth:700,height:160,display:'block',marginBottom:10,
              border:bd,borderRadius:3}}/>

          {/* Trade log */}
          <div style={{fontSize:11,color:'var(--cp-txt2)',fontFamily:C.fnt,marginBottom:4}}>
            Trade Log {trades.list.length===0?'— no trades triggered with this strategy':
              `(${trades.list.length} trades · * = open position)`}
          </div>
          {trades.list.length > 0 && (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',maxWidth:620,borderCollapse:'collapse',fontSize:11,fontFamily:C.fnt}}>
                <thead><tr>
                  <th style={thS()}>Entry</th><th style={thS()}>Exit</th>
                  <th style={thS(true)}>Buy</th><th style={thS(true)}>Sell</th>
                  <th style={thS(true)}>Return</th>
                </tr></thead>
                <tbody>
                  {trades.list.slice(-20).reverse().map((t,i)=>(
                    <tr key={i} style={{background:i%2?C.alt:'var(--cp-bg1)'}}>
                      <td style={{padding:'4px 8px',borderBottom:bd}}>{t.entry}</td>
                      <td style={{padding:'4px 8px',borderBottom:bd,color:t.open?'#f59e0b':'inherit'}}>{t.exit}</td>
                      <td style={{padding:'4px 8px',borderBottom:bd,textAlign:'right',fontFamily:'monospace'}}>${t.buy.toFixed(2)}</td>
                      <td style={{padding:'4px 8px',borderBottom:bd,textAlign:'right',fontFamily:'monospace'}}>${t.sell.toFixed(2)}</td>
                      <td style={{padding:'4px 8px',borderBottom:bd,textAlign:'right',fontWeight:700,
                        color:t.ret>=0?C.pos:C.neg}}>{t.ret>=0?'+':''}{t.ret.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{marginTop:6,fontSize:10,color:'var(--cp-txt3)',fontFamily:C.fnt}}>
            Past performance does not guarantee future results · Not financial advice · Prices from Finnhub/Yahoo
          </div>
        </>
      )}

      {!trades && !loading && !error && (
        <div style={{padding:60,textAlign:'center',color:'var(--cp-txt3)',fontFamily:C.fnt}}>
          Select a ticker and strategy, then click Run Backtest
        </div>
      )}
    </div>
  )
}