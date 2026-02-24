'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../app/hooks/useAuth'
import { useLiveTickers } from '../app/hooks/useLiveTickers'
import Dashboard from './Dashboard'
import AuthModal from './AuthModal'
import PricingModal from './PricingModal'

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg0:    '#0e101a',
  bg1:    '#111420',
  bg2:    '#161b2e',
  bg3:    '#1c2235',
  bg4:    '#222a40',
  dark:   '#080a10',
  border: '#1e2640',
  b2:     '#2a3558',
  accent: '#2f91ef',
  aGlow:  'rgba(47,145,239,0.18)',
  aGlow2: 'rgba(47,145,239,0.07)',
  bull:   '#26a65b',
  bear:   '#e84040',
  warn:   '#f4b942',
  white:  '#ffffff',
  t1:     '#e8edf5',
  t2:     '#8b95b0',
  t3:     '#4a5470',
  t4:     '#2a3050',
}

/* ─── CHART ENGINE ───────────────────────────────────────────── */
function genPrices(seed, type = 'up', len = 90) {
  let p = 180 + seed * 14, pts = []
  for (let i = 0; i < len; i++) {
    const n = Math.sin(i * 0.3 + seed) * 1.4 + Math.sin(i * 0.12 + seed * 1.6) * 2.3
    const d = type === 'up' ? 0.24 : type === 'down' ? -0.2 : 0.04
    p += d + n + (Math.random() - 0.48) * 1.5
    pts.push(Math.max(100, p))
  }
  if (type === 'hs') {
    for (let i=15;i<35;i++) pts[i]+=(i-15)*1.3
    for (let i=35;i<50;i++) pts[i]+=(50-i)*1.1
    for (let i=50;i<65;i++) pts[i]+=(i-50)*1.5
    for (let i=65;i<80;i++) pts[i]+=(80-i)*1.7
  }
  if (type === 'wave') for (let i=0;i<pts.length;i++) pts[i]+=Math.sin(i*0.19)*16
  return pts
}

function HeroChart({ color = '#2f91ef', type = 'up', label, seed = 1 }) {
  const ref = useRef(null), raf = useRef(null), fr = useRef(0)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'), W = c.width, H = c.height
    const prices = genPrices(seed, type)
    const lo = Math.min(...prices) - 5, hi = Math.max(...prices) + 5, rng = hi - lo
    const sy = v => H - 0.08*H - ((v-lo)/rng)*(H*0.82)
    const sx = i => (i/(prices.length-1))*(W-4)+2
    fr.current = 0; cancelAnimationFrame(raf.current)
    const draw = () => {
      fr.current += 1.6
      const vis = Math.min(prices.length, Math.ceil(fr.current))
      ctx.clearRect(0, 0, W, H)
      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1
      for (let r=1;r<5;r++) { ctx.beginPath(); ctx.moveTo(0,H*r/5); ctx.lineTo(W,H*r/5); ctx.stroke() }
      for (let col=1;col<8;col++) { ctx.beginPath(); ctx.moveTo(W*col/8,0); ctx.lineTo(W*col/8,H); ctx.stroke() }
      // price labels
      ctx.fillStyle = C.t3; ctx.font = '9px sans-serif'; ctx.textAlign = 'right'
      for (let r=0;r<5;r++) ctx.fillText('$'+(lo+rng*r/4).toFixed(0), W-4, sy(lo+rng*r/4)+4)
      // area fill
      const g = ctx.createLinearGradient(0,0,0,H)
      g.addColorStop(0, color+'35'); g.addColorStop(0.65, color+'0a'); g.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.moveTo(sx(0), H)
      for (let i=0;i<vis;i++) {
        if (i===0) ctx.lineTo(sx(0), sy(prices[0]))
        else { const mx=(sx(i-1)+sx(i))/2; ctx.bezierCurveTo(mx,sy(prices[i-1]),mx,sy(prices[i]),sx(i),sy(prices[i])) }
      }
      ctx.lineTo(sx(vis-1), H); ctx.closePath(); ctx.fillStyle = g; ctx.fill()
      // line
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5
      ctx.shadowBlur = 12; ctx.shadowColor = color + '70'
      for (let i=0;i<vis;i++) {
        if (i===0) ctx.moveTo(sx(0), sy(prices[0]))
        else { const mx=(sx(i-1)+sx(i))/2; ctx.bezierCurveTo(mx,sy(prices[i-1]),mx,sy(prices[i]),sx(i),sy(prices[i])) }
      }
      ctx.stroke(); ctx.shadowBlur = 0
      // pattern annotation after 55%
      if (vis > Math.floor(prices.length * 0.52)) {
        const pi = Math.floor(prices.length * 0.56)
        const ax = sx(pi), ay = sy(prices[pi])
        if (type === 'up' || type === 'trend') {
          ctx.setLineDash([5,4]); ctx.strokeStyle = color + '55'; ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.moveTo(sx(pi-22), sy(prices[pi-22])); ctx.lineTo(sx(Math.min(pi+20,prices.length-1)), sy(prices[Math.min(pi+20,prices.length-1)])); ctx.stroke()
          ctx.setLineDash([])
        }
        if (type === 'hs') {
          ctx.setLineDash([5,4]); ctx.strokeStyle = C.bear + '80'; ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.moveTo(sx(18), sy(prices[18])); ctx.lineTo(sx(72), sy(prices[72])); ctx.stroke()
          ctx.setLineDash([])
        }
        // dot
        ctx.shadowBlur = 18; ctx.shadowColor = color
        ctx.beginPath(); ctx.arc(ax,ay,6,0,Math.PI*2); ctx.fillStyle = color; ctx.fill()
        ctx.shadowBlur = 0
        ctx.beginPath(); ctx.arc(ax,ay,3,0,Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill()
        // pill label
        if (label) {
          ctx.font = 'bold 10px sans-serif'
          const tw = ctx.measureText(label).width + 20, th = 22
          const px = Math.max(4, Math.min(ax - tw/2, W-tw-4)), py = ay - 34
          ctx.shadowBlur = 14; ctx.shadowColor = color + '60'
          ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(px,py,tw,th,4); ctx.fill()
          ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
          ctx.fillText(label, px+tw/2, py+15); ctx.textAlign = 'right'
        }
      }
      // live price tag
      if (vis >= 2) {
        const ly = sy(prices[vis-1])
        ctx.setLineDash([3,3]); ctx.strokeStyle = color+'40'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(sx(vis-1), ly); ctx.lineTo(W, ly); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(W-56, ly-11, 52, 22, 3); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('$' + prices[vis-1].toFixed(2), W-30, ly+4); ctx.textAlign = 'right'
      }
      if (fr.current < prices.length) raf.current = requestAnimationFrame(draw)
      else setTimeout(() => { fr.current = 0; raf.current = requestAnimationFrame(draw) }, 3000)
    }
    draw(); return () => cancelAnimationFrame(raf.current)
  }, [seed, type, color, label])
  return <canvas ref={ref} width={580} height={300} style={{ width:'100%', height:'100%', display:'block' }}/>
}

function Spark({ up, seed }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'), W = c.width, H = c.height
    const pts = genPrices(seed, up?'up':'down', 22)
    const lo=Math.min(...pts), hi=Math.max(...pts)+0.1
    const sy = v => H - ((v-lo)/(hi-lo))*H*0.85 - H*0.07
    const sx = i => (i/(pts.length-1))*W
    const col = up ? C.bull : C.bear
    ctx.clearRect(0,0,W,H)
    const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,col+'28'); g.addColorStop(1,'transparent')
    ctx.beginPath(); ctx.moveTo(0,H)
    pts.forEach((p,i)=>{ if(i===0) ctx.lineTo(sx(i),sy(p)); else { const mx=(sx(i-1)+sx(i))/2; ctx.bezierCurveTo(mx,sy(pts[i-1]),mx,sy(p),sx(i),sy(p)) } })
    ctx.lineTo(sx(pts.length-1),H); ctx.closePath(); ctx.fillStyle=g; ctx.fill()
    ctx.beginPath(); ctx.strokeStyle=col; ctx.lineWidth=1.5
    pts.forEach((p,i)=>{ if(i===0) ctx.moveTo(sx(i),sy(p)); else { const mx=(sx(i-1)+sx(i))/2; ctx.bezierCurveTo(mx,sy(pts[i-1]),mx,sy(p),sx(i),sy(p)) } })
    ctx.stroke()
  }, [up, seed])
  return <canvas ref={ref} width={86} height={34} style={{width:86,height:34,flexShrink:0}}/>
}

function Countdown() {
  const [t, setT] = useState({ h:23, m:47, s:12 })
  useEffect(() => {
    const id = setInterval(() => setT(p => {
      let {h,m,s} = p; s--; if(s<0){s=59;m--} if(m<0){m=59;h--} if(h<0)h=23; return{h,m,s}
    }), 1000); return () => clearInterval(id)
  }, [])
  const z = n => String(n).padStart(2,'0')
  return <span style={{fontVariantNumeric:'tabular-nums'}}>{z(t.h)}:{z(t.m)}:{z(t.s)}</span>
}

/* ─── DATA ───────────────────────────────────────────────────── */
const SLIDES = [
  { tag:'CLASSIC PATTERNS', h1:'Catch the setup', h2:'before it runs.', body:'Bull flags, wedges, ascending triangles, pennants — 18+ patterns detected automatically, the moment they form, across 250+ assets.', color:'#2f91ef', label:'Bull Flag · 94%', type:'up', seed:2 },
  { tag:'HARMONIC PATTERNS', h1:'Fibonacci-precise', h2:'reversal detection.', body:'Gartley, Butterfly, Bat, Crab — the exact Fibonacci harmonic setups institutional desks trade. Full entry, stop, and target projections included.', color:'#8b5cf6', label:'Bat Pattern · 89%', type:'wave', seed:5 },
  { tag:'HEAD & SHOULDERS', h1:'Spot distribution', h2:'before the crowd.', body:'Head and shoulders tops and inverse formations with neckline confirmation. Detected with mathematical precision — before most traders recognize the setup.', color:'#10b981', label:'H&S Top · 92%', type:'hs', seed:3 },
  { tag:'ADVANCED ANALYSIS', h1:'Replace five tools', h2:'with one platform.', body:'RSI divergence, MACD crossovers, Bollinger squeeze, and volume analysis — all overlaid with pattern detection in a single unified view.', color:'#f59e0b', label:'Multi-Signal · 88%', type:'trend', seed:7 },
]

const FEATURE_TABS = [
  { tab:'Detect chart patterns', h:'Detect chart patterns automatically', body:'CompoundPulse runs 24/7 across 250+ assets. The moment a bull flag, wedge, triangle, head & shoulders, or harmonic pattern forms — it\'s drawn for you with full level annotations.', pts:['18+ classic and harmonic patterns','Automatic trendline detection','Real-time alerts on pattern break','Entry, stop, and target projections','Supported across stocks, ETFs, crypto'], color:'#2f91ef', type:'up', seed:2 },
  { tab:'Analyze charts & market data', h:'Multi-timeframe technical analysis', body:'Overlay RSI, MACD, Bollinger Bands, volume, and ATR across any timeframe. Pattern detection integrates directly with your indicators — only flagging setups where signals align.', pts:['200+ built-in indicators','Multi-timeframe analysis','Pattern + indicator confluence','Support and resistance auto-detection','Volume profile integration'], color:'#8b5cf6', type:'wave', seed:5 },
  { tab:'Find trade ideas in real-time', h:'Real-time idea generation & scanning', body:'Scan every asset in your watchlist simultaneously. CompoundPulse surfaces setups that match your strategy the moment they print — without you having to look for them manually.', pts:['Real-time multi-asset scanning','Pattern match alerts via email/push','Custom watchlist monitoring','Crypto monitored 24/7','Filter by pattern type and confidence'], color:'#10b981', type:'trend', seed:9 },
  { tab:'Track markets live', h:'Live market dashboard', body:'See real-time quotes, pattern status, and momentum signals across your entire watchlist in one view. Know what\'s moving and why — without switching between platforms.', pts:['Live price feeds for 250+ assets','Pattern status for entire watchlist','Pre-market and after-hours data','Volume alerts on unusual activity','Real-time crypto market depth'], color:'#f59e0b', type:'hs', seed:4 },
]

const TICKER_DATA = [
  {sym:'AAPL',  price:'$213.49', chg:'+1.24%', up:true,  seed:1},
  {sym:'NVDA',  price:'$878.30', chg:'+3.14%', up:true,  seed:2},
  {sym:'TSLA',  price:'$412.00', chg:'+0.07%', up:true,  seed:3},
  {sym:'BTC',   price:'$97,420', chg:'+2.81%', up:true,  seed:4},
  {sym:'ETH',   price:'$3,241',  chg:'-0.92%', up:false, seed:5},
  {sym:'SPY',   price:'$529.10', chg:'+0.41%', up:true,  seed:6},
  {sym:'MSFT',  price:'$418.60', chg:'+0.63%', up:true,  seed:7},
  {sym:'SOL',   price:'$185.40', chg:'+4.22%', up:true,  seed:8},
  {sym:'AMZN',  price:'$225.80', chg:'+1.80%', up:true,  seed:9},
  {sym:'QQQ',   price:'$451.20', chg:'+0.89%', up:true,  seed:10},
  {sym:'GOOGL', price:'$189.45', chg:'+0.52%', up:true,  seed:11},
  {sym:'META',  price:'$612.30', chg:'+1.43%', up:true,  seed:12},
  {sym:'GLD',   price:'$242.10', chg:'+0.32%', up:true,  seed:13},
  {sym:'AMD',   price:'$178.20', chg:'-1.12%', up:false, seed:14},
]

const MARKET_CARDS = [
  {sym:'AAPL',  name:'Apple Inc.',       price:'$213.49', chg:'+1.24%', up:true,  seed:1},
  {sym:'NVDA',  name:'NVIDIA Corp.',     price:'$878.30', chg:'+3.14%', up:true,  seed:2},
  {sym:'TSLA',  name:'Tesla Inc.',       price:'$412.00', chg:'+0.07%', up:true,  seed:3},
  {sym:'MSFT',  name:'Microsoft Corp.',  price:'$418.60', chg:'+0.63%', up:true,  seed:7},
  {sym:'META',  name:'Meta Platforms',   price:'$612.30', chg:'+1.43%', up:true,  seed:12},
  {sym:'BTC',   name:'Bitcoin',          price:'$97,420', chg:'+2.81%', up:true,  seed:4},
  {sym:'ETH',   name:'Ethereum',         price:'$3,241',  chg:'-0.92%', up:false, seed:5},
  {sym:'SOL',   name:'Solana',           price:'$185.40', chg:'+4.22%', up:true,  seed:8},
  {sym:'SPY',   name:'SPDR S&P 500',     price:'$529.10', chg:'+0.41%', up:true,  seed:6},
  {sym:'QQQ',   name:'Invesco QQQ',      price:'$451.20', chg:'+0.89%', up:true,  seed:10},
  {sym:'GLD',   name:'SPDR Gold',        price:'$242.10', chg:'+0.32%', up:true,  seed:13},
  {sym:'AMD',   name:'Adv. Micro Dev.',  price:'$178.20', chg:'-1.12%', up:false, seed:14},
]

const ALL_ASSETS = ['AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','V','JPM','UNH','XOM','MA','JNJ','PG','HD','AVGO','MRK','CVX','ABBV','COST','WMT','KO','PEP','BAC','NFLX','CRM','AMD','ADBE','NOW','SNOW','PLTR','UBER','ABNB','SHOP','SQ','PYPL','CRWD','ZS','SPY','QQQ','IWM','DIA','VTI','VOO','ARKK','XLF','XLE','XLK','GLD','SLV','HYG','SOXL','TQQQ','BTC','ETH','SOL','BNB','ADA','XRP','AVAX','DOT','MATIC','LINK','UNI','ATOM','US10Y','US2Y','US30Y','IEF','SHY','AGG','BND','DXY','OIL','NG','CORN','WHEAT']

const USE_CASES = [
  { h:'Swing trading', body:'Scan 250+ assets simultaneously. Receive an alert the moment a high-probability setup forms. Never manually scan charts again.' },
  { h:'Day trading', body:'Real-time pattern detection with live price action. Intraday flag and triangle setups spotted the moment they print.' },
  { h:'Long-term investing', body:'Use technical pattern analysis to time entries and exits on positions you already believe in fundamentally.' },
  { h:'Algorithmic approach', body:'Pattern signals combined with RSI, MACD, and volume — enabling rule-based entries without writing a single line of code.' },
  { h:'Crypto trading', body:'The only detector covering stocks, ETFs, and crypto in a single dashboard. Crypto markets monitored 24/7 without interruption.' },
  { h:'Portfolio management', body:'Monitor pattern status across your entire portfolio simultaneously. Know which holdings are at key technical inflections.' },
]

const CLIENTS = ['Goldman Sachs','JPMorgan Chase','Morgan Stanley','Bank of America','Merrill Lynch','PIMCO','Citadel','Two Sigma','Renaissance','Bridgewater','Point72','D.E. Shaw','AQR Capital','Millennium Mgmt','Oppenheimer','Jefferies','Cantor Fitzgerald','Baird','Raymond James','Stifel']

const FREE_TOOLS = [
  { h:'Pattern scanner', body:'Get real-time alerts when a bull flag, wedge, triangle, or harmonic pattern forms across your watchlist.' },
  { h:'Position size calculator', body:'Calculate your exact position size based on your account size, stop loss distance, and risk tolerance.' },
  { h:'Compound return calculator', body:'Model the compounding effect of consistent returns. See how small edges compound to significant wealth over time.' },
  { h:'Risk/reward calculator', body:'Input your entry, stop, and target to instantly calculate the risk/reward ratio before placing any trade.' },
]

const STORE_ITEMS = [
  { h:'Pattern scanners', body:'Pre-built scans for every major pattern type — run across all 250+ assets instantly.' },
  { h:'Custom indicators', body:'Technical overlays built specifically to complement pattern detection — divergence, momentum, and flow.' },
  { h:'Strategy templates', body:'Battle-tested strategy frameworks with defined entries, stops, and targets for each major pattern type.' },
]

const NEWS = [
  { tag:'Analysis', date:'Feb 20, 2026', h:'NVDA Breaks Out of Ascending Triangle After Earnings Beat', body:'NVIDIA confirmed an ascending triangle breakout with high volume, targeting $950 based on pattern measurement.' },
  { tag:'Analysis', date:'Feb 19, 2026', h:'BTC Completes Inverse Head & Shoulders — Pattern Target $112K', body:'Bitcoin completed a textbook inverse H&S with a neckline break above $98K, signaling continuation.' },
  { tag:'Analysis', date:'Feb 19, 2026', h:'TSLA Bull Flag Setup — Watch for Break Above $420', body:'Tesla has consolidated in a tight bull flag over 4 sessions. A break above $420 triggers the measured move to $465.' },
]

const LEARNING = [
  { cat:'Patterns', h:'Complete guide to bull flag patterns', body:'Everything you need to know about identifying, trading, and managing bull flag setups — from formation to entry.' },
  { cat:'Harmonics', h:'How to trade Gartley and Butterfly patterns', body:'A step-by-step breakdown of harmonic pattern Fibonacci ratios, entry zones, and target levels.' },
  { cat:'Analysis', h:'Head & shoulders pattern: distribution and reversal', body:'Why the H&S top is one of the most reliable reversal patterns — and how to trade it with precision.' },
]

const COMP_TABLE = [
  ['Real-time pattern detection', true, false, false],
  ['Harmonic Fibonacci patterns', true, false, false],
  ['Crypto asset coverage', true, false, false],
  ['18+ pattern types', true, false, false],
  ['Live price feed integration', true, true, true],
  ['250+ assets covered', true, true, false],
  ['No credit card for trial', true, false, true],
  ['7-day free trial', true, false, false],
  ['Entry, stop & target levels', true, false, false],
  ['Monthly starting price', '$19.99', '$89+', 'Free (limited)'],
]

const FAQ = [
  { q:'How do I start my free trial?', a:'Sign up and your 7-day trial begins immediately. No credit card required. You get full access to every pattern detector the moment you create your account.' },
  { q:'What plans are available after the trial?', a:'Daily access at $4.99. Monthly subscription at $19.99/month. Annual plan at $149/year — that is 38% off the monthly rate.' },
  { q:'Do I need a credit card to try CompoundPulse?', a:'No. Zero payment information is required for the free trial. You decide if you want to subscribe after you have seen what the platform can do.' },
  { q:'What happens when my trial ends?', a:'After 7 days you will be invited to choose a plan. If you do not subscribe, pattern detection locks but your account remains open and you retain your watchlist.' },
  { q:'Can I cancel at any time?', a:'Yes. Cancel at any time from your account settings. You keep access until the end of the billing period you paid for. No long-term contracts, no cancellation fees.' },
  { q:'What assets does CompoundPulse cover?', a:'250+ assets across US stocks on NYSE and Nasdaq, major ETFs including SPY, QQQ, GLD, and sector ETFs, cryptocurrencies including BTC, ETH, and SOL, and US Treasury bonds.' },
  { q:'How current is the pattern detection data?', a:'Pattern detection runs against live price data in real time. Crypto markets are monitored continuously 24/7 since they never close.' },
  { q:'How does CompoundPulse compare to TrendSpider?', a:'CompoundPulse delivers the same institutional-grade pattern detection — bull flags, harmonics, head & shoulders, and more — at roughly one-quarter of TrendSpider\'s starting price.' },
  { q:'Is there a refund policy?', a:'Yes. If you are unsatisfied within 7 days of your first paid subscription, contact us for a full refund. No questions asked.' },
]

/* ─── COMPONENT ──────────────────────────────────────────────── */
export default function LandingPage() {
  const { user, loading } = useAuth()
  const { tickers } = useLiveTickers()
  const [slide, setSlide] = useState(0)
  const [tab, setTab] = useState(0)
  const [faq, setFaq] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s+1) % SLIDES.length), 5500)
    return () => clearInterval(id)
  }, [])

  if (!loading && user) return <Dashboard />

  const S = SLIDES[slide]
  const F = FEATURE_TABS[tab]
  const liveData = (tickers && tickers.length > 4) ? tickers : TICKER_DATA

  const btn = (label, primary, onClick) => (
    <button onClick={onClick} style={{
      background: primary ? C.accent : 'transparent',
      border: `1px solid ${primary ? C.accent : C.b2}`,
      color: primary ? '#fff' : C.t2,
      borderRadius: 5, padding: '11px 22px',
      fontSize: 14, fontWeight: primary ? 700 : 600,
      cursor: 'pointer', whiteSpace: 'nowrap',
      boxShadow: primary ? `0 0 24px ${C.aGlow}` : 'none',
    }}>{label}</button>
  )

  const tag = (label, color) => (
    <div style={{display:'inline-flex',alignItems:'center',gap:7,background:color+'16',border:`1px solid ${color}40`,borderRadius:4,padding:'4px 12px',fontSize:11,color,fontWeight:800,letterSpacing:'0.1em',marginBottom:18}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:color,display:'inline-block',flexShrink:0,animation:'cpPulse 2s infinite'}}/>
      {label}
    </div>
  )

  return (
    <div style={{background:C.bg1,color:C.t1,fontFamily:'"Source Sans Pro","Lato",system-ui,sans-serif',minHeight:'100vh',overflowX:'hidden'}}>

      {/* ─── SALE BANNER ─── */}
      <div style={{background:`linear-gradient(90deg,#0f2340,#0a1a30,#0f2340)`,borderBottom:`1px solid ${C.border}`,padding:'9px 20px',display:'flex',alignItems:'center',justifyContent:'center',gap:18,flexWrap:'wrap',textAlign:'center'}}>
        <span style={{color:C.warn,fontWeight:700,fontSize:13}}>Presidents' Day Sale — 40% off annual plans</span>
        <span style={{color:C.t2,fontSize:13}}>Offer expires in: <span style={{color:C.white,fontWeight:800,fontVariantNumeric:'tabular-nums'}}><Countdown/></span></span>
        <button onClick={()=>setShowPricing(true)} style={{background:'transparent',border:`1px solid ${C.warn}`,color:C.warn,borderRadius:4,padding:'4px 16px',fontSize:11,fontWeight:800,cursor:'pointer',letterSpacing:'0.07em'}}>SEE OFFER DETAILS</button>
      </div>

      {/* ─── NAV ─── */}
      <nav style={{background:C.bg0,borderBottom:`1px solid ${C.border}`,padding:'0 28px',height:58,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:300}}>
        <div style={{fontSize:20,fontWeight:900,letterSpacing:'-0.5px',color:C.white,userSelect:'none'}}>
          Compound<span style={{color:C.accent}}>Pulse</span>
        </div>
        <div className="cp-nav" style={{display:'flex',alignItems:'center',gap:34}}>
          {[['Features',''],['Markets',''],['Pricing','pricing'],['Resources','']].map(([l])=>(
            <span key={l} onClick={()=>l==='Pricing'&&setShowPricing(true)} style={{color:C.t2,cursor:'pointer',fontSize:13,fontWeight:600,letterSpacing:'0.01em'}}
              onMouseEnter={e=>e.currentTarget.style.color=C.white}
              onMouseLeave={e=>e.currentTarget.style.color=C.t2}>{l}</span>
          ))}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{color:C.t3,fontSize:13,marginRight:4}} className="cp-nav">1-833-PATTERNS</span>
          <button onClick={()=>setShowAuth(true)} className="cp-nav" style={{background:'transparent',border:`1px solid ${C.border}`,color:C.t2,borderRadius:4,padding:'7px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>Log in</button>
          <button onClick={()=>setShowPricing(true)} style={{background:C.accent,border:'none',color:'#fff',borderRadius:4,padding:'7px 20px',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:`0 0 20px ${C.aGlow}`}}>Get started now</button>
          <button onClick={()=>setMobileNav(o=>!o)} className="cp-hamburger" style={{display:'none',background:'transparent',border:`1px solid ${C.border}`,color:C.t2,borderRadius:4,padding:'6px 10px',cursor:'pointer',fontSize:15,lineHeight:1}}>&#9776;</button>
        </div>
      </nav>

      {mobileNav && (
        <div style={{background:C.bg0,borderBottom:`1px solid ${C.border}`,padding:'10px 24px',position:'sticky',top:58,zIndex:299}}>
          {['Features','Markets','Pricing','Resources'].map(l=>(
            <div key={l} onClick={()=>{l==='Pricing'&&setShowPricing(true);setMobileNav(false)}} style={{padding:'11px 0',borderBottom:`1px solid ${C.border}`,color:C.t1,fontSize:14,fontWeight:600,cursor:'pointer'}}>{l}</div>
          ))}
          <button onClick={()=>{setShowAuth(true);setMobileNav(false)}} style={{width:'100%',background:'transparent',border:`1px solid ${C.b2}`,color:C.t2,borderRadius:4,padding:10,fontSize:14,fontWeight:600,cursor:'pointer',marginTop:10}}>Log in</button>
        </div>
      )}

      {/* ─── TICKER BAR ─── */}
      <div style={{background:C.dark,borderBottom:`1px solid ${C.border}`,overflow:'hidden',height:36,display:'flex',alignItems:'center'}}>
        <div style={{display:'flex',whiteSpace:'nowrap',animation:'cpScroll 50s linear infinite',alignItems:'center',height:'100%'}}>
          {[...liveData,...liveData].map((t,i)=>(
            <div key={`tk-${i}`} style={{display:'inline-flex',alignItems:'center',gap:9,padding:'0 22px',borderRight:`1px solid ${C.border}`,height:'100%',fontSize:12}}>
              <span style={{color:C.white,fontWeight:800,letterSpacing:'0.04em'}}>{t.sym}</span>
              <span style={{color:C.t2}}>{t.price}</span>
              <span style={{color:t.up?C.bull:C.bear,fontWeight:700}}>{t.up?'+':''}{t.chg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section style={{background:`radial-gradient(ellipse 90% 70% at 65% -5%,${S.color}10 0%,transparent 55%),${C.bg1}`,borderBottom:`1px solid ${C.border}`,padding:'58px 28px 52px'}}>
        <div className="cp-hero" style={{maxWidth:1240,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:56,alignItems:'center'}}>

          {/* Left */}
          <div>
            {tag(S.tag + ' · LIVE', S.color)}
            <h1 className="cp-h1" style={{fontSize:54,fontWeight:900,lineHeight:1.04,letterSpacing:'-2.5px',color:C.white,margin:'0 0 18px'}}>
              {S.h1}<br/><span style={{color:S.color}}>{S.h2}</span>
            </h1>
            <p style={{fontSize:16,color:C.t2,lineHeight:1.8,maxWidth:460,marginBottom:10}}>
              {S.body}
            </p>
            <p style={{fontSize:13,color:C.t3,marginBottom:30}}>Loved by 2,400+ active traders</p>
            <div style={{display:'flex',gap:10,marginBottom:36,flexWrap:'wrap'}}>
              {btn('Get started now', true, ()=>setShowPricing(true))}
              {btn('Explore product', false, ()=>{})}
            </div>

            {/* Stat grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',border:`1px solid ${C.border}`,borderRadius:6,overflow:'hidden',background:C.bg2}}>
              {[['18+','Pattern types'],['250+','Assets'],['89%','Avg. accuracy'],['7 days','Free trial']].map(([v,l],i)=>(
                <div key={l} style={{padding:'15px 10px',textAlign:'center',borderRight:i<3?`1px solid ${C.border}`:'none'}}>
                  <div style={{fontSize:22,fontWeight:900,color:C.white,letterSpacing:'-0.5px',lineHeight:1}}>{v}</div>
                  <div style={{fontSize:10,color:C.t3,marginTop:4,letterSpacing:'0.07em',textTransform:'uppercase'}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Slide nav */}
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:22}}>
              {SLIDES.map((_,i)=>(
                <button key={i} onClick={()=>setSlide(i)} style={{
                  width:i===slide?20:7,height:7,borderRadius:4,border:'none',padding:0,
                  cursor:'pointer',background:i===slide?S.color:C.t4,transition:'all .3s'
                }}/>
              ))}
            </div>
          </div>

          {/* Right — chart (single instance, no duplication) */}
          <div className="cp-chart" style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',boxShadow:`0 8px 60px rgba(0,0,0,.7),0 0 40px ${S.color}0d`}}>
            {/* Chart header */}
            <div style={{background:C.bg3,borderBottom:`1px solid ${C.border}`,padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:32,height:32,background:C.aGlow2,border:`1px solid ${C.b2}`,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:C.accent,letterSpacing:'-0.3px'}}>CP</div>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:C.white,lineHeight:1}}>AAPL</div>
                  <div style={{fontSize:10,color:C.t3,marginTop:2}}>Apple Inc. · NASDAQ</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:C.bull}}>$213.49 +1.24%</div>
              </div>
              <div style={{background:S.color+'20',border:`1px solid ${S.color}50`,borderRadius:4,padding:'3px 10px',fontSize:10,color:S.color,fontWeight:800,whiteSpace:'nowrap'}}>
                {S.label}
              </div>
            </div>

            {/* The chart — rendered once */}
            <div style={{height:300,padding:'10px 8px 2px'}}>
              <HeroChart color={S.color} type={S.type} label={S.label} seed={S.seed}/>
            </div>

            {/* Chart footer */}
            <div style={{background:C.bg3,borderTop:`1px solid ${C.border}`,padding:'7px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11}}>
              <span style={{color:C.t3}}>Pattern auto-detected · Alerts on breakout · No setup required</span>
              <span style={{display:'flex',alignItems:'center',gap:6,color:C.bull,fontWeight:700}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:C.bull,display:'inline-block',animation:'cpPulse 2s infinite'}}/>
                Live
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── METRICS STRIP ─── */}
      <div style={{background:C.bg2,borderBottom:`1px solid ${C.border}`,overflowX:'auto'}}>
        <div style={{display:'flex',minWidth:580,maxWidth:1240,margin:'0 auto'}}>
          {[['18+','Pattern types'],['250+','Assets monitored'],['3','Asset classes'],['Real-time','Detection speed'],['2,400+','Active traders'],['89%','Avg. confidence'],['7 days','Free trial'],['$19.99','/month']].map(([v,l],i,arr)=>(
            <div key={l} style={{flex:1,padding:'12px 8px',textAlign:'center',borderRight:i<arr.length-1?`1px solid ${C.border}`:'none',minWidth:80}}>
              <div style={{fontSize:15,fontWeight:800,color:C.white}}>{v}</div>
              <div style={{fontSize:10,color:C.t3,marginTop:2,whiteSpace:'nowrap'}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── FEATURE TABS (TrendSpider Section 3 equivalent) ─── */}
      <section style={{maxWidth:1240,margin:'0 auto',padding:'80px 28px'}}>
        <div style={{textAlign:'center',marginBottom:54}}>
          <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}}>PLATFORM CAPABILITIES</div>
          <h2 className="cp-h2" style={{fontSize:44,fontWeight:900,color:C.white,margin:'0 0 16px',letterSpacing:'-2px',lineHeight:1.08}}>Stop missing out.<br/><span style={{color:C.accent}}>Start compounding.</span></h2>
          <p style={{fontSize:16,color:C.t2,maxWidth:520,margin:'0 auto',lineHeight:1.8}}>Hundreds of institutional-grade capabilities that elevate every part of your analysis workflow.</p>
        </div>

        {/* Tab nav */}
        <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,marginBottom:0,overflowX:'auto'}}>
          {FEATURE_TABS.map((f,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{
              flexShrink:0,padding:'12px 22px',border:'none',borderBottom:`2px solid ${i===tab?f.color:'transparent'}`,
              cursor:'pointer',fontSize:13,fontWeight:600,background:'transparent',
              color:i===tab?f.color:C.t3,transition:'all .15s',whiteSpace:'nowrap',letterSpacing:'0.01em',
            }}>{f.tab}</button>
          ))}
        </div>

        {/* Tab content: text left, chart right */}
        <div className="cp-feat" style={{display:'grid',gridTemplateColumns:'1fr 1.1fr',background:C.bg2,border:`1px solid ${C.border}`,borderTop:`2px solid ${F.color}`,borderRadius:'0 0 8px 8px',overflow:'hidden',minHeight:380}}>
          <div style={{padding:'36px 32px',borderRight:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:F.color,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>{F.tab}</div>
            <h3 style={{fontSize:26,fontWeight:900,color:C.white,margin:'0 0 16px',letterSpacing:'-0.5px',lineHeight:1.2}}>{F.h}</h3>
            <p style={{fontSize:14,color:C.t2,lineHeight:1.85,marginBottom:24}}>{F.body}</p>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:30}}>
              {F.pts.map(p=>(
                <div key={p} style={{display:'flex',alignItems:'flex-start',gap:11,fontSize:13,color:C.t1}}>
                  <span style={{flexShrink:0,width:18,height:18,borderRadius:'50%',background:F.color+'20',border:`1px solid ${F.color}50`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:F.color,fontWeight:900,marginTop:1}}>&#10003;</span>
                  {p}
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {btn('Get started now', true, ()=>setShowPricing(true))}
              <button style={{background:'transparent',border:'none',color:C.accent,fontSize:13,fontWeight:600,cursor:'pointer',padding:'11px 4px'}}>Explore more ›</button>
            </div>
          </div>
          <div className="cp-feat-chart" style={{background:C.bg3,padding:'16px 14px 8px',height:400,display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:11}}>
              <span style={{color:C.white,fontWeight:700}}>AAPL — Pattern Detection Live</span>
              <span style={{color:F.color,fontWeight:700,display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:F.color,display:'inline-block',animation:'cpPulse 2s infinite'}}/>Active
              </span>
            </div>
            <div style={{flex:1}}>
              <HeroChart color={F.color} type={F.type} label={F.pts[0]} seed={F.seed}/>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REVIEWS STRIP (Section 4 equivalent) ─── */}
      <section style={{background:C.bg2,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:'48px 28px'}}>
        <div style={{maxWidth:1240,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:24,marginBottom:36,flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:36,fontWeight:900,color:C.white,lineHeight:1}}>4.8 <span style={{color:C.warn}}>&#9733;&#9733;&#9733;&#9733;&#9733;</span></div>
              <div style={{fontSize:12,color:C.t3,marginTop:4}}>Rated 4.8 out of 5 · 2,400+ traders</div>
            </div>
            <div style={{flex:1,height:1,background:C.border}}/>
            <button onClick={()=>setShowPricing(true)} style={{background:C.accent,border:'none',color:'#fff',borderRadius:4,padding:'9px 20px',fontSize:13,fontWeight:700,cursor:'pointer'}}>View all reviews</button>
          </div>
          <div className="cp-4col" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[
              {stars:5,q:'Caught 3 bull flags last week I would have completely missed scanning manually.',author:'@traderjoe_fx',role:'Swing Trader'},
              {stars:5,q:'The harmonic detection alone is worth the subscription. I used to spend 2 hours drawing these.',author:'SwingTrader_Pro',role:'Options Trader'},
              {stars:5,q:'H&S detector flagged TSLA 2 days before the breakdown. Could not believe the accuracy.',author:'QuantEdge',role:'Technical Analyst'},
              {stars:5,q:'Same analysis TrendSpider does for $89/month. At $19.99 this is completely underpriced.',author:'CryptoTA_Dave',role:'Crypto Trader'},
            ].map((r,i)=>(
              <div key={i} style={{background:C.bg0,border:`1px solid ${C.border}`,borderRadius:6,padding:'20px 18px'}}>
                <div style={{display:'flex',gap:2,marginBottom:10,color:C.warn,fontSize:13}}>{'★'.repeat(r.stars)}</div>
                <p style={{fontSize:13,color:C.t1,lineHeight:1.75,marginBottom:14,fontStyle:'italic'}}>"{r.q}"</p>
                <div style={{fontSize:12,color:C.t3}}><span style={{color:C.t2,fontWeight:700}}>{r.author}</span> · {r.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI / ADVANCED CAPABILITIES (Section 5 equivalent) ─── */}
      <section style={{background:C.dark,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:'80px 28px'}}>
        <div style={{maxWidth:1240,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:54}}>
            <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}}>DETECTION ENGINE</div>
            <h2 className="cp-h2" style={{fontSize:42,fontWeight:900,color:C.white,margin:'0 0 16px',letterSpacing:'-2px',lineHeight:1.1}}>Institutional-grade pattern detection.<br/><span style={{color:C.accent}}>Built for independent traders.</span></h2>
            <p style={{fontSize:16,color:C.t2,maxWidth:560,margin:'0 auto',lineHeight:1.8}}>CompoundPulse delivers the mathematical precision of professional technical analysis systems — without the $500/month enterprise pricing.</p>
          </div>
          <div className="cp-3col" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {[
              {h:'Detect patterns using mathematical precision',body:'CompoundPulse identifies chart patterns, trendlines, and harmonic ratios using exact geometric rules — not fuzzy heuristics. Every detection meets institutional-grade validation criteria.'},
              {h:'Multi-asset scanning across all markets',body:'Scan stocks, ETFs, and crypto simultaneously, 24/7. The engine never sleeps. You get alerted the moment any asset on your watchlist triggers a pattern confirmation.'},
              {h:'Pattern + indicator confluence',body:'Pattern signals are layered with RSI, MACD, Bollinger Bands, and volume analysis. CompoundPulse only surfaces setups where multiple signals align — reducing false positives significantly.'},
              {h:'Entry, stop, and target projections',body:'Every detected pattern includes the measured move target, recommended stop loss placement, and pattern invalidation level — so you always know your risk before entering.'},
              {h:'Harmonic Fibonacci pattern detection',body:'Gartley, Butterfly, Bat, Crab, and Cypher patterns detected using exact Fibonacci ratios. Entry zones, stop levels, and target projections calculated automatically.'},
              {h:'Real-time alerts and notifications',body:'Receive email and push notifications the moment a pattern confirms, breaks out, or invalidates. React to the market faster without sitting in front of charts all day.'},
            ].map((item,i)=>(
              <div key={i} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:7,padding:'26px 22px',borderTop:`2px solid ${C.accent}`}}>
                <div style={{fontSize:15,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.3}}>{item.h}</div>
                <div style={{fontSize:13,color:C.t2,lineHeight:1.8}}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MARKET DATA PREVIEW (Section 6 + 7 equivalent) ─── */}
      <section style={{maxWidth:1240,margin:'0 auto',padding:'80px 28px'}}>
        <div style={{marginBottom:44}}>
          <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}}>MARKETS AT A GLANCE</div>
          <h2 className="cp-h2" style={{fontSize:38,fontWeight:900,color:C.white,margin:'0 0 12px',letterSpacing:'-1.5px'}}>Live pattern status across 250+ assets.</h2>
          <p style={{fontSize:15,color:C.t2,maxWidth:560,lineHeight:1.8}}>Real-time quotes, pattern status, and momentum signals — across stocks, ETFs, crypto, and bonds.</p>
        </div>
        <div className="cp-3col" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
          {MARKET_CARDS.map((m,i)=>(
            <div key={`mc-${i}`} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:6,padding:'14px 14px 10px',cursor:'pointer',transition:'border-color .15s,transform .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.b2;e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform='none'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:C.white}}>{m.sym}</div>
                  <div style={{fontSize:10,color:C.t3,marginTop:2}}>{m.name}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.white}}>{m.price}</div>
                  <div style={{fontSize:11,color:m.up?C.bull:C.bear,fontWeight:700,marginTop:2}}>{m.up?'+':''}{m.chg}</div>
                </div>
              </div>
              <Spark up={m.up} seed={m.seed}/>
              <div style={{marginTop:8,fontSize:10,color:C.accent,fontWeight:700}}>Pattern active</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
          {ALL_ASSETS.map((sym,i)=>(
            <span key={`a-${i}`} style={{fontSize:10,color:C.t3,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:3,padding:'2px 8px',fontWeight:700,letterSpacing:'0.04em'}}>{sym}</span>
          ))}
          <span style={{fontSize:10,color:C.accent,fontWeight:700,padding:'2px 8px',letterSpacing:'0.04em'}}>+more added weekly</span>
        </div>
      </section>

      {/* ─── COMPARISON (Section 7 equivalent) ─── */}
      <section style={{background:C.bg2,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:'80px 28px'}}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}}>COMPARE FEATURES</div>
            <h2 className="cp-h2" style={{fontSize:40,fontWeight:900,color:C.white,margin:'0 0 14px',letterSpacing:'-2px'}}>TrendSpider-grade analysis.<br/><span style={{color:C.accent}}>At 1/4 the price.</span></h2>
            <p style={{fontSize:15,color:C.t2,lineHeight:1.8}}>See how CompoundPulse stacks up against other products.</p>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:540}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${C.border}`}}>
                  {['Feature','CompoundPulse','TrendSpider','Finviz Free'].map((h,i)=>(
                    <th key={h} style={{padding:'12px 16px',textAlign:i===0?'left':'center',color:i===1?C.accent:C.t3,fontWeight:800,fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',background:i===1?C.aGlow2:'transparent',borderBottom:i===1?`2px solid ${C.accent}`:'none',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMP_TABLE.map(([f,cp,ts,fv],ri)=>(
                  <tr key={f} style={{borderBottom:`1px solid ${C.border}`,background:ri%2===0?'transparent':C.bg3+'50'}}>
                    <td style={{padding:'12px 16px',color:C.t1,fontWeight:600}}>{f}</td>
                    <td style={{padding:'12px 16px',textAlign:'center',background:C.aGlow2,fontWeight:700,color:cp===true?C.bull:cp===false?C.bear:C.white}}>{cp===true?'Yes':cp===false?'No':cp}</td>
                    <td style={{padding:'12px 16px',textAlign:'center',color:ts===true?C.t2:ts===false?C.bear:C.t2,fontWeight:ts===false?700:400}}>{ts===true?'Yes':ts===false?'No':ts}</td>
                    <td style={{padding:'12px 16px',textAlign:'center',color:fv===true?C.t2:fv===false?C.bear:C.t2,fontWeight:fv===false?700:400}}>{fv===true?'Yes':fv===false?'No':fv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{textAlign:'center',marginTop:32}}>
            {btn('Get started — no card required', true, ()=>setShowPricing(true))}
          </div>
        </div>
      </section>

      {/* ─── ALL DEVICES (Section 8 equivalent) ─── */}
      <section style={{maxWidth:1240,margin:'0 auto',padding:'80px 28px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <h2 className="cp-h2" style={{fontSize:38,fontWeight:900,color:C.white,margin:'0 0 14px',letterSpacing:'-1.5px'}}>Available on all your devices.</h2>
          <p style={{fontSize:15,color:C.t2,lineHeight:1.8}}>Access CompoundPulse from any browser, any device, any time.</p>
        </div>
        <div className="cp-3col" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            {h:'Web Application',body:'Full access to all pattern detectors, live market data, and your watchlist from any browser. No installation required.',badge:'Available now'},
            {h:'Mobile Access',body:'CompoundPulse is fully responsive. Monitor your watchlist and receive pattern alerts from your phone or tablet.',badge:'iOS & Android'},
            {h:'Desktop Access',body:'Open CompoundPulse as a Progressive Web App for a native desktop experience with faster load times.',badge:'macOS & Windows'},
          ].map((d,i)=>(
            <div key={i} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:7,padding:'28px 24px'}}>
              <div style={{display:'inline-block',background:C.aGlow2,border:`1px solid ${C.b2}`,borderRadius:3,padding:'3px 10px',fontSize:10,color:C.accent,fontWeight:800,letterSpacing:'0.08em',marginBottom:16}}>{d.badge}</div>
              <div style={{fontSize:16,fontWeight:800,color:C.white,marginBottom:10}}>{d.h}</div>
              <div style={{fontSize:13,color:C.t2,lineHeight:1.8}}>{d.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── USE CASES (Section 9 equivalent) ─── */}
      <section style={{background:C.bg2,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:'80px 28px'}}>
        <div style={{maxWidth:1240,margin:'0 auto'}}>
          <div style={{marginBottom:48}}>
            <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}}>SOLUTIONS BY USE CASE</div>
            <h2 className="cp-h2" style={{fontSize:38,fontWeight:900,color:C.white,margin:'0 0 12px',letterSpacing:'-1.5px'}}>Explore CompoundPulse solutions by use case.</h2>
            <p style={{fontSize:15,color:C.t2,maxWidth:580,lineHeight:1.8}}>CompoundPulse is a broad, capable platform that fits any trading style — from scalping to long-term investing.</p>
            <button style={{background:'transparent',border:'none',color:C.accent,fontSize:13,fontWeight:600,cursor:'pointer',padding:'8px 0',marginTop:4}}>View all use cases ›</button>
          </div>
          <div className="cp-3col" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {USE_CASES.map((u,i)=>(
              <div key={i} style={{background:C.bg0,border:`1px solid ${C.border}`,borderRadius:6,padding:'24px 20px',cursor:'pointer',transition:'border-color .15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.b2}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{fontSize:15,fontWeight:800,color:C.white,marginBottom:10}}>{u.h}</div>
                <div style={{fontSize:13,color:C.t2,lineHeight:1.8,marginBottom:16}}>{u.body}</div>
                <span style={{fontSize:12,color:C.accent,fontWeight:600}}>Learn more ›</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CLIENTS / LOGOS (Section 10 equivalent) ─── */}
      <section style={{background:C.dark,borderBottom:`1px solid ${C.border}`,padding:'48px 28px'}}>
        <div style={{maxWidth:1240,margin:'0 auto',textAlign:'center',marginBottom:32}}>
          <h2 style={{fontSize:26,fontWeight:900,color:C.white,letterSpacing:'-1px'}}>Built for retail. Powerful enough for professional use.</h2>
        </div>
        <div style={{overflow:'hidden'}}>
          <div style={{display:'flex',whiteSpace:'nowrap',animation:'cpScroll 40s linear infinite',alignItems:'center'}}>
            {[...CLIENTS,...CLIENTS].map((n,i)=>(
              <div key={`cl-${i}`} style={{display:'inline-flex',alignItems:'center',padding:'0 40px',borderRight:`1px solid ${C.border}`,height:40}}>
                <span style={{fontSize:12,fontWeight:900,color:C.t3,letterSpacing:'-0.2px'}}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FREE TOOLS (Section 11 equivalent) ─── */}
      <section style={{maxWidth:1240,margin:'0 auto',padding:'80px 28px'}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}}>FREE TOOLS</div>
          <h2 className="cp-h2" style={{fontSize:38,fontWeight:900,color:C.white,margin:'0 0 12px',letterSpacing:'-1.5px'}}>Free scanners, tools & calculators for traders.</h2>
          <p style={{fontSize:15,color:C.t2,maxWidth:540,lineHeight:1.8}}>Access powerful trading tools at no cost — no subscription required.</p>
        </div>
        <div className="cp-4col" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {FREE_TOOLS.map((f,i)=>(
            <div key={i} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:6,padding:'22px 18px',borderTop:`2px solid ${C.b2}`}}>
              <div style={{fontSize:14,fontWeight:800,color:C.white,marginBottom:10}}>{f.h}</div>
              <div style={{fontSize:12,color:C.t2,lineHeight:1.8,marginBottom:14}}>{f.body}</div>
              <span style={{fontSize:12,color:C.accent,fontWeight:600,cursor:'pointer'}}>Access free ›</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── STORE / MARKETPLACE (Section 12 equivalent) ─── */}
      <section style={{background:C.bg2,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:'80px 28px'}}>
        <div style={{maxWidth:1240,margin:'0 auto'}}>
          <div style={{marginBottom:48}}>
            <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}}>TOOLS & RESOURCES</div>
            <h2 className="cp-h2" style={{fontSize:38,fontWeight:900,color:C.white,margin:'0 0 12px',letterSpacing:'-1.5px'}}>Explore indicators, scanners & strategy templates.</h2>
            <p style={{fontSize:15,color:C.t2,maxWidth:560,lineHeight:1.8}}>Pre-built tools designed specifically for CompoundPulse pattern analysis workflows.</p>
            <button style={{background:'transparent',border:'none',color:C.accent,fontSize:13,fontWeight:600,cursor:'pointer',padding:'8px 0',marginTop:4}}>View all tools ›</button>
          </div>
          <div className="cp-3col" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {STORE_ITEMS.map((s,i)=>(
              <div key={i} style={{background:C.dark,border:`1px solid ${C.border}`,borderRadius:7,padding:'28px 24px',cursor:'pointer',transition:'border-color .15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.b2}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{fontSize:11,color:C.accent,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>{['120+ patterns','50+ indicators','30+ strategies'][i]}</div>
                <div style={{fontSize:16,fontWeight:800,color:C.white,marginBottom:10}}>{s.h}</div>
                <div style={{fontSize:13,color:C.t2,lineHeight:1.8,marginBottom:18}}>{s.body}</div>
                <span style={{fontSize:12,color:C.accent,fontWeight:600}}>Browse {s.h.toLowerCase()} ›</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWS (Section 13 equivalent) ─── */}
      <section style={{maxWidth:1240,margin:'0 auto',padding:'80px 28px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:36,flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}}>MARKET ANALYSIS</div>
            <h2 className="cp-h2" style={{fontSize:38,fontWeight:900,color:C.white,margin:0,letterSpacing:'-1.5px'}}>Get the latest pattern alerts & analysis.</h2>
          </div>
          <button style={{background:'transparent',border:'none',color:C.accent,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>View all analysis ›</button>
        </div>
        <div className="cp-3col" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {NEWS.map((n,i)=>(
            <div key={i} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:7,padding:'24px 22px',cursor:'pointer',transition:'border-color .15s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.b2}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:14}}>
                <span style={{background:C.aGlow2,border:`1px solid ${C.b2}`,borderRadius:3,padding:'2px 10px',fontSize:10,color:C.accent,fontWeight:800,letterSpacing:'0.08em'}}>{n.tag}</span>
                <span style={{fontSize:11,color:C.t3}}>{n.date}</span>
              </div>
              <div style={{fontSize:15,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.4}}>{n.h}</div>
              <div style={{fontSize:13,color:C.t2,lineHeight:1.75}}>{n.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LEARNING CENTER (Section 14 equivalent) ─── */}
      <section style={{background:C.bg2,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:'80px 28px'}}>
        <div style={{maxWidth:1240,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:36,flexWrap:'wrap',gap:16}}>
            <div>
              <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:14}}>LEARNING CENTER</div>
              <h2 className="cp-h2" style={{fontSize:38,fontWeight:900,color:C.white,margin:0,letterSpacing:'-1.5px'}}>Learn about markets, patterns & trading.</h2>
            </div>
            <button style={{background:'transparent',border:'none',color:C.accent,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>View all articles ›</button>
          </div>
          <div className="cp-3col" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {LEARNING.map((l,i)=>(
              <div key={i} style={{background:C.bg0,border:`1px solid ${C.border}`,borderRadius:6,padding:'24px 20px',cursor:'pointer',transition:'border-color .15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.b2}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{display:'inline-block',background:C.aGlow2,border:`1px solid ${C.b2}`,borderRadius:3,padding:'2px 10px',fontSize:10,color:C.t3,fontWeight:800,letterSpacing:'0.08em',marginBottom:14}}>{l.cat}</div>
                <div style={{fontSize:15,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.4}}>{l.h}</div>
                <div style={{fontSize:13,color:C.t2,lineHeight:1.75,marginBottom:14}}>{l.body}</div>
                <span style={{fontSize:12,color:C.accent,fontWeight:600}}>Read more ›</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{maxWidth:820,margin:'0 auto',padding:'80px 28px'}}>
        <div style={{textAlign:'center',marginBottom:52}}>
          <h2 className="cp-h2" style={{fontSize:38,fontWeight:900,color:C.white,margin:'0 0 12px',letterSpacing:'-1.5px'}}>Frequently asked questions.</h2>
          <p style={{fontSize:15,color:C.t2,lineHeight:1.8}}>Everything you need to know before you get started.</p>
        </div>
        {FAQ.map((item,i)=>(
          <div key={i} style={{borderBottom:`1px solid ${C.border}`}}>
            <button onClick={()=>setFaq(faq===i?null:i)} style={{width:'100%',textAlign:'left',padding:'18px 0',background:'none',border:'none',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}>
              <span style={{fontSize:15,fontWeight:700,color:faq===i?C.accent:C.white,lineHeight:1.4}}>{item.q}</span>
              <span style={{color:C.t3,fontSize:24,fontWeight:300,flexShrink:0,transition:'transform .2s',transform:faq===i?'rotate(45deg)':'none',lineHeight:1}}>+</span>
            </button>
            {faq===i && <div style={{paddingBottom:20,fontSize:14,color:C.t2,lineHeight:1.85,paddingRight:32}}>{item.a}</div>}
          </div>
        ))}
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{background:`radial-gradient(ellipse 70% 90% at 50% 50%,${C.aGlow} 0%,transparent 65%),${C.dark}`,borderTop:`1px solid ${C.border}`,padding:'100px 28px'}}>
        <div style={{maxWidth:580,margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:22}}>NO CREDIT CARD REQUIRED</div>
          <h2 className="cp-h2" style={{fontSize:50,fontWeight:900,color:C.white,margin:'0 0 18px',letterSpacing:'-2.5px',lineHeight:1.06}}>
            Gain clarity.<br/><span style={{color:C.accent}}>Start compounding.</span>
          </h2>
          <p style={{fontSize:16,color:C.t2,marginBottom:38,lineHeight:1.8}}>7 days free. Full access to every pattern detector. Cancel anytime. No card required to start.</p>
          <button onClick={()=>setShowPricing(true)} style={{background:C.accent,border:'none',color:'#fff',borderRadius:5,padding:'15px 0',fontSize:16,fontWeight:800,width:'100%',maxWidth:380,display:'block',margin:'0 auto 14px',cursor:'pointer',boxShadow:`0 0 60px ${C.aGlow},0 4px 20px rgba(0,0,0,.4)`}}>
            Get started now — it's free
          </button>
          <p style={{fontSize:13,color:C.t3}}>$4.99 / day &nbsp;·&nbsp; $19.99 / month &nbsp;·&nbsp; $149 / year &nbsp;·&nbsp; Cancel anytime</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{background:C.bg0,borderTop:`1px solid ${C.border}`,padding:'28px 28px'}}>
        <div style={{maxWidth:1240,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:32,marginBottom:32,flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:20,fontWeight:900,color:C.white,marginBottom:12}}>Compound<span style={{color:C.accent}}>Pulse</span></div>
              <p style={{fontSize:13,color:C.t3,lineHeight:1.8,maxWidth:260}}>Institutional-grade pattern detection for independent traders. 18+ patterns. 250+ assets. Real-time.</p>
            </div>
            {[
              {h:'Platform',links:['Pattern Detection','Live Markets','Pricing','Free Trial']},
              {h:'Resources',links:['Learning Center','Pattern Guide','Blog','API Docs']},
              {h:'Company',links:['About','Contact','Privacy Policy','Terms of Service']},
            ].map(col=>(
              <div key={col.h}>
                <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:14}}>{col.h}</div>
                {col.links.map(l=><div key={l} style={{fontSize:13,color:C.t2,marginBottom:10,cursor:'pointer'}} onMouseEnter={e=>e.target.style.color=C.white} onMouseLeave={e=>e.target.style.color=C.t2}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:20,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:10,fontSize:12,color:C.t3}}>
            <span>© 2026 CompoundPulse. All rights reserved.</span>
            <span>Not financial advice. Past performance does not guarantee future results.</span>
          </div>
        </div>
      </footer>

      {/* ─── GLOBAL STYLES ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box}
        body,html{margin:0;padding:0}
        @keyframes cpScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes cpPulse{0%,100%{opacity:1}50%{opacity:.2}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${C.bg0}}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}

        @media(max-width:991px){
          .cp-hero{grid-template-columns:1fr!important;gap:36px!important}
          .cp-chart{display:none!important}
          .cp-h1{font-size:36px!important;letter-spacing:-1px!important}
          .cp-h2{font-size:26px!important;letter-spacing:-0.5px!important}
          .cp-nav{display:none!important}
          .cp-hamburger{display:flex!important;align-items:center!important}
          .cp-feat{grid-template-columns:1fr!important}
          .cp-feat-chart{display:none!important}
          .cp-4col{grid-template-columns:1fr 1fr!important}
          .cp-3col{grid-template-columns:1fr!important}
        }
        @media(max-width:600px){
          .cp-h1{font-size:30px!important}
          .cp-h2{font-size:24px!important}
          .cp-4col{grid-template-columns:1fr!important}
        }
      `}</style>

      {showAuth && <AuthModal isOpen={showAuth} onClose={()=>setShowAuth(false)} onSuccess={()=>setShowAuth(false)}/>}
      {showPricing && <PricingModal isOpen={showPricing} onClose={()=>setShowPricing(false)}/>}
    </div>
  )
}