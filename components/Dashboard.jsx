'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../app/hooks/useAuth'
import AccountMenu from './AccountMenu'
import { C } from './dash/dashTheme'
import DashSearch    from './dash/DashSearch'
import PageHome      from './dash/PageHome'
import PageQuote     from './dash/PageQuote'
import PageNews      from './dash/PageNews'
import PageScreener  from './dash/PageScreener'
import PageCharts    from './dash/PageCharts'
import PageMaps      from './dash/PageMaps'
import PageGroups    from './dash/PageGroups'
import PagePortfolio from './dash/PagePortfolio'
import PageInsider   from './dash/PageInsider'
import PageFutures   from './dash/PageFutures'
import PageForex     from './dash/PageForex'
import PageCrypto    from './dash/PageCrypto'
import PageCalendar  from './dash/PageCalendar'
import PageBacktests from './dash/PageBacktests'
import PagePricing   from './dash/PagePricing'

const NAV = ['Home','News','Screener','Charts','Maps','Groups','Portfolio','Insider','Futures','Forex','Crypto','Calendar','Backtests','Pricing']
const FONT = "'Lato','Verdana','Arial','Tahoma',sans-serif"

// Navbar always dark #4c5261 regardless of theme (Finviz exact)
function NavLink({ label, active, onClick, borderLeft }) {
  const [hov, setHov] = useState(false)
  return (
    <a href="#" onClick={e=>{e.preventDefault();onClick()}} style={{
      display:'flex', alignItems:'center', padding:'0 7px', height:30,
      fontSize:13, fontWeight:700, whiteSpace:'nowrap', fontFamily:FONT,
      textDecoration:'none', flexShrink:0, boxSizing:'border-box',
      color: '#fff',
      background: active||hov ? '#62697d' : 'transparent',
      borderBottom: active ? '2px solid #4fa4f4' : '2px solid transparent',
      borderLeft: borderLeft ? '1px solid #444a57' : 'none',
    }} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      {label}
    </a>
  )
}

function PromoBanner() {
  const [on, setOn] = useState(true)
  if (!on) return null
  return (
    <div style={{
      background:'#5e36b8',
      display:'flex', justifyContent:'center', alignItems:'center',
      padding:'8px 16px', flexShrink:0, position:'relative',
    }}>
      <p style={{color:'#fff', fontSize:13, margin:0, fontWeight:500}}>
        <b style={{color:'#fff'}}>New:</b> Analyst ratings now visible directly on CompoundPulse charts.
      </p>
      <span style={{color:'rgba(255,255,255,0.7)', fontSize:20, cursor:'pointer', lineHeight:1, position:'absolute', right:16}}
        onClick={()=>setOn(false)}>×</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [nav, setNav]     = useState('Home')
  const [quote, setQuote] = useState(null)
  const [time, setTime]   = useState('')
  const [isDark, setIsDark] = useState(true)

  const toggleTheme = (e) => {
    e.preventDefault()
    const html = document.documentElement
    if (isDark) {
      html.classList.remove('dark')
      html.classList.add('light')
      setIsDark(false)
    } else {
      html.classList.remove('light')
      html.classList.add('dark')
      setIsDark(true)
    }
  }

  useEffect(()=>{
    const tick=()=>setTime(new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true}))
    tick(); const id=setInterval(tick,30000); return ()=>clearInterval(id)
  },[])

  useEffect(()=>{
    const handler = (e) => { setNav(e.detail); setQuote(null) }
    window.addEventListener('cp:nav', handler)
    return () => window.removeEventListener('cp:nav', handler)
  },[])

  const goTicker = useCallback(t=>{ setQuote(t.toUpperCase()); setNav('Quote') },[])
  const goNav    = useCallback(n=>{ setNav(n); setQuote(null) },[])

  const pagesRef = useRef(null)
  if (!pagesRef.current) {
    pagesRef.current = {
      Home:      <PageHome      onT={t=>{ setQuote(t.toUpperCase()); setNav('Quote') }}/>,
      News:      <PageNews      onT={t=>{ setQuote(t.toUpperCase()); setNav('Quote') }}/>,
      Screener:  <PageScreener  onT={t=>{ setQuote(t.toUpperCase()); setNav('Quote') }}/>,
      Charts:    <PageCharts/>,
      Maps:      <PageMaps      onT={t=>{ setQuote(t.toUpperCase()); setNav('Quote') }}/>,
      Groups:    <PageGroups/>,
      Portfolio: <PagePortfolio onT={t=>{ setQuote(t.toUpperCase()); setNav('Quote') }}/>,
      Insider:   <PageInsider   onT={t=>{ setQuote(t.toUpperCase()); setNav('Quote') }}/>,
      Futures:   <PageFutures/>,
      Forex:     <PageForex/>,
      Crypto:    <PageCrypto    onT={t=>{ setQuote(t.toUpperCase()); setNav('Quote') }}/>,
      Calendar:  <PageCalendar  onT={t=>{ setQuote(t.toUpperCase()); setNav('Quote') }}/>,
      Backtests: <PageBacktests onT={t=>{ setQuote(t.toUpperCase()); setNav('Quote') }}/>,
      Pricing:   <PagePricing/>,
    }
  }

  const active = quote ? 'Home' : nav

  return (
    <div style={{
      background: 'var(--fv-900)',
      fontFamily: FONT,
      color: 'var(--fv-50)',
      fontSize: 13,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* HEADER — bg matches fv-800: dark=#22262f / light=#ffffff */}
      <div style={{
        background: 'var(--fv-800)',
        borderBottom: '1px solid var(--fv-600)',
        width: '100%',
        minHeight: 96,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        padding: '0 2.5%',
      }}>
        {/* Logo: fv-50 = #f3f3f5 in dark, #14161d in light — always readable */}
        <a href="#" onClick={e=>{e.preventDefault();goNav('Home')}} style={{textDecoration:'none', flexShrink:0, marginRight:16}}>
          <span style={{fontSize:22, fontWeight:900, color:'var(--fv-50)', fontFamily:FONT}}>Compound</span>
          <span style={{fontSize:22, fontWeight:900, color:'#4fa4f4', fontFamily:FONT}}>Pulse</span>
        </a>

        <div style={{flex:1, maxWidth:340}}>
          <DashSearch onT={goTicker}/>
        </div>

        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:12, flexShrink:0}}>
          <span style={{fontSize:11, color:'var(--fv-400)', whiteSpace:'nowrap'}}>{time}</span>
          {user && <AccountMenu/>}
        </div>
      </div>

      {/* NAVBAR — always #4c5261 (Finviz exact) */}
      <div style={{
        background: '#4c5261',
        height: 30,
        display: 'flex',
        alignItems: 'stretch',
        overflowX: 'auto',
        overflowY: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,.2)',
        flexShrink: 0,
        width: '100%',
      }}>
        <div style={{display:'flex', alignItems:'stretch', width:'95%', maxWidth:1425, margin:'0 auto'}}>
          {NAV.map(n=>(
            <NavLink key={n} label={n} active={active===n} onClick={()=>goNav(n)}/>
          ))}
          <div style={{flex:1}}/>

          {/* Theme toggle */}
          <a href="#" onClick={toggleTheme} style={{
            display:'flex', alignItems:'center', gap:5, padding:'0 8px',
            height:30, borderLeft:'1px solid #444a57', textDecoration:'none', flexShrink:0,
          }}>
            <div style={{
              position:'relative', display:'flex', width:36, height:18,
              borderRadius:999, border:'1px solid #555c6e',
              background: isDark ? '#22262f' : '#d0d3da',
              overflow:'hidden', flexShrink:0,
            }}>
              <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', background: !isDark ? '#4c5261' : 'transparent', borderRadius:'999px 0 0 999px'}}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill={!isDark ? '#fff' : '#7a8094'}>
                  <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
                </svg>
              </div>
              <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', background: isDark ? '#4c5261' : 'transparent', borderRadius:'0 999px 999px 0'}}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill={isDark ? '#fff' : '#7a8094'}>
                  <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
                </svg>
              </div>
            </div>
            <span style={{fontSize:11, fontWeight:600, color:'#fff', fontFamily:'Arial,sans-serif'}}>Theme</span>
          </a>

          {['Help','Login','Register'].map((n,i)=>(
            <NavLink key={n} label={n} active={false} onClick={()=>{}} borderLeft={i===0}/>
          ))}
        </div>
      </div>

      <PromoBanner/>

      {/* CONTENT */}
      <div style={{
        flex: 1,
        width: '95%',
        maxWidth: 1425,
        margin: '0 auto',
        minWidth: 0,
        background: 'var(--fv-900)',
      }}>
        <div style={{display: quote ? 'block' : 'none'}}>
          {quote && <PageQuote key={quote} ticker={quote} onBack={()=>{setQuote(null);setNav('Home')}}/>}
        </div>
        {Object.entries(pagesRef.current).map(([key, el])=>(
          <div key={key} style={{display: !quote && nav===key ? 'block' : 'none'}}>
            {el}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{
        background: 'var(--fv-800)',
        borderTop: '1px solid var(--fv-600)',
        padding: '32px 16px',
        fontSize: 11,
        color: 'var(--fv-400)',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        © 2026 CompoundPulse · Market data delayed 15 min · Not financial advice
      </div>
    </div>
  )
}