'use client'
import { useState } from 'react'
import { C } from './dashTheme'
import { useAuth } from '../../app/hooks/useAuth'

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{flexShrink:0,marginTop:2}}>
    <circle cx="10" cy="10" r="10" fill="#7c3aed" opacity="0.15"/>
    <path d="M6 10l3 3 5-5" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const CheckGray = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{flexShrink:0,marginTop:2}}>
    <path d="M6 10l3 3 5-5" stroke="var(--cp-txt3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

async function startCheckout(priceId, user) {
  if (!user) {
    // Not logged in — redirect to register
    window.dispatchEvent(new CustomEvent('cp:nav', { detail: 'Register' }))
    return
  }
  try {
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId: user.id,
        email: user.email,
      }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      console.error('Stripe error:', data.error)
      alert('Could not start checkout. Please try again.')
    }
  } catch (err) {
    console.error('Checkout error:', err)
    alert('Could not connect to payment service. Please try again.')
  }
}

const PLANS = [
  {
    name:'Free', price:0, period:'', sub:'Always free',
    color:'var(--cp-txt2)', ctaStyle:'outline', cta:'Get Started', priceId:null,
    features:['15-min delayed data','Basic screener','Forex & Futures','50 portfolios / 50 tickers','3 years financial history','20 screener presets'],
  },
  {
    name:'Pro', price:29, period:'/mo', sub:'7-day free trial',
    color:'#7c3aed', badge:'Most Popular', ctaStyle:'solid', cta:'Start Free Trial', priceId:'price_1T308QBCkivbmRhWDd3WE4TK',
    features:['Real-time quotes, charts & screener','Real-time maps & groups','Intraday charts (1m–4H)','Multi-layout charts + studies','Email & push alerts','Ad-free experience','Export to CSV / API access','Full ETF holdings breakdown','Advanced screener filters','200 screener presets','100 portfolios / 500 tickers','8 years financial history','Correlated stocks','Strategy backtester','Early access to features'],
  },
  {
    name:'Pro Annual', price:19, period:'/mo', sub:'$228/yr — save 35%',
    color:'#0d7353', badge:'Best Value', ctaStyle:'solid', cta:'Start Free Trial', priceId:'price_1T309jBCkivbmRhW0Ef4HPsF',
    features:['Everything in Pro','Lowest per-month price','Priority support'],
  },
  {
    name:'Team', price:79, period:'/mo', sub:'Up to 5 members',
    color:'#0369a1', ctaStyle:'outline', cta:'Contact Sales', priceId:null, isTeam:true,
    features:['Everything in Pro Annual','Shared watchlists & alerts','Team portfolio view','Dedicated account manager','API access'],
  },
]

const COMPARE = [
  {label:'Quotes, Charts, Screener', free:'Delayed', pro:'Real-time'},
  {label:'Maps & Groups',            free:'Delayed', pro:'Real-time'},
  {label:'Intraday Charts',          free:false,     pro:true},
  {label:'Multi-layout Charts',      free:false,     pro:true},
  {label:'Fundamental Charts',       free:false,     pro:true},
  {label:'Email / Push Alerts',      free:false,     pro:true},
  {label:'Ad-Free Interface',        free:false,     pro:true},
  {label:'Export / API',             free:false,     pro:true},
  {label:'Full ETF Holdings',        free:false,     pro:true},
  {label:'Advanced Screener',        free:false,     pro:true},
  {label:'Screener Presets',         free:'20',      pro:'200'},
  {label:'Portfolios',               free:'50',      pro:'100'},
  {label:'Tickers per Portfolio',    free:'50',      pro:'500'},
  {label:'Financial History',        free:'3 Years', pro:'8 Years'},
  {label:'Backtester',               free:false,     pro:true},
  {label:'Correlated Stocks',        free:false,     pro:true},
  {label:'Layout Customization',     free:'Basic',   pro:'Full'},
  {label:'Early Feature Access',     free:false,     pro:true},
]

const FAQ = [
  {q:'Is there a free trial?', a:'Yes — Pro and Pro Annual both include a 7-day free trial with no credit card required. You get full access to every feature from day one.'},
  {q:'Do I need a credit card to start?', a:'No. There is no payment information required to begin your free 7-day trial. You decide later whether to subscribe.'},
  {q:'What happens after my trial ends?', a:'Your trial does not auto-renew or charge you — no payment is collected during it. If you choose to subscribe, plans renew automatically each billing period and can be cancelled anytime.'},
  {q:'What are the plan prices?', a:'Free (always free), Pro ($29/mo), Pro Annual ($19/mo billed at $228/yr), Team ($79/mo for up to 5 members). All paid plans unlock the full Pro feature suite.'},
  {q:'Can I cancel anytime?', a:'Yes. Cancel from your account settings at any time. You keep Pro access until the end of your current billing period.'},
  {q:'Where does market data come from?', a:'Quotes and fundamentals via Finnhub. Historical charts via Yahoo Finance. Forex via ExchangeRate-API. All data is for informational purposes only and not financial advice.'},
  {q:'How does the backtester work?', a:'We pull up to 1 year of daily price history and run your selected strategy rules (SMA crossover, RSI, Bollinger Bands, MACD, Momentum) against historical data. Results show hypothetical past performance only.'},
]

function PlanCard({ plan }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const solid = plan.ctaStyle === 'solid'

  const handleCTA = async () => {
    if (plan.isTeam) { window.open('mailto:hello@compoundpulse.com?subject=Team Plan Inquiry','_blank'); return }
    if (!plan.priceId) return
    setLoading(true)
    await startCheckout(plan.priceId, user)
    setLoading(false)
  }
  return (
    <div style={{
      width:210, flexShrink:0, position:'relative',
      border:`2px solid ${plan.name==='Pro'?'#7c3aed':'var(--cp-bg3)'}`,
      borderRadius:10, padding:'24px 18px',
      background: plan.name==='Pro' ? 'rgba(124,58,237,0.06)' : 'var(--cp-bg1)',
      boxShadow: plan.name==='Pro' ? '0 4px 24px rgba(124,58,237,0.15)' : 'none',
    }}>
      {plan.badge && (
        <div style={{position:'absolute',top:-13,left:'50%',transform:'translateX(-50%)',
          background:plan.color,color:'#fff',fontSize:10,fontWeight:700,
          padding:'3px 12px',borderRadius:20,whiteSpace:'nowrap'}}>
          {plan.badge}
        </div>
      )}
      <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.08em',color:plan.color,marginBottom:8}}>{plan.name.toUpperCase()}</div>
      <div style={{marginBottom:4}}>
        <span style={{fontSize:36,fontWeight:900,color:'var(--cp-txt)',lineHeight:1}}>
          {plan.price===0?'Free':`$${plan.price}`}
        </span>
        {plan.price>0 && <span style={{fontSize:13,color:'var(--cp-txt2)',marginLeft:2}}>{plan.period}</span>}
      </div>
      <div style={{fontSize:11,color:'var(--cp-txt2)',marginBottom:18}}>{plan.sub}</div>
      <button onClick={handleCTA} disabled={loading} style={{
        width:'100%',padding:'10px',fontSize:13,fontWeight:700,fontFamily:C.fnt,
        borderRadius:6,cursor:loading?'wait':'pointer',border:`1px solid ${solid?plan.color:plan.color}`,
        background:solid?plan.color:'transparent',color:solid?'#fff':plan.color,
        opacity:loading?0.7:1,
      }}
        onMouseEnter={e=>!loading&&(e.currentTarget.style.opacity='0.82')}
        onMouseLeave={e=>e.currentTarget.style.opacity=loading?'0.7':'1'}
      >{loading ? 'Loading…' : plan.cta}</button>
      <div style={{marginTop:18,display:'flex',flexDirection:'column',gap:8}}>
        {plan.features.map(f=>(
          <div key={f} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
            {solid ? <Check/> : <CheckGray/>}
            <span style={{fontSize:12,color:'var(--cp-txt2)',lineHeight:1.5}}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BottomCTA() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    await startCheckout('price_1T308QBCkivbmRhWDd3WE4TK', user)
    setLoading(false)
  }
  return (
    <button onClick={handleClick} disabled={loading}
      style={{background:'#7c3aed',color:'#fff',border:'none',fontSize:15,fontWeight:700,
        padding:'13px 38px',borderRadius:8,cursor:loading?'wait':'pointer',fontFamily:C.fnt,
        boxShadow:'0 4px 20px rgba(124,58,237,0.4)',opacity:loading?0.7:1}}
      onMouseEnter={e=>!loading&&(e.currentTarget.style.opacity='0.88')}
      onMouseLeave={e=>e.currentTarget.style.opacity=loading?'0.7':'1'}
    >{loading ? 'Loading…' : 'Start Free Trial'}</button>
  )
}

export default function PagePricing() {
  const [faqOpen, setFaqOpen] = useState({})

  return (
    <div style={{background:'var(--cp-bg0)',color:'var(--cp-txt)',fontFamily:C.fnt,paddingBottom:60}}>

      {/* HERO */}
      <div style={{
        background:'linear-gradient(180deg,#1a0a3c 0%,var(--cp-bg0) 100%)',
        textAlign:'center', padding:'52px 24px 44px',
      }}>
        <div style={{
          display:'inline-block',fontSize:11,fontWeight:700,letterSpacing:'0.1em',
          color:'#a78bfa',background:'rgba(124,58,237,0.15)',
          border:'1px solid rgba(124,58,237,0.3)',borderRadius:20,padding:'4px 14px',marginBottom:18,
        }}>COMPOUNDPULSE PRO</div>
        <h1 style={{margin:'0 0 14px',fontSize:38,fontWeight:900,lineHeight:1.15,color:'#fff'}}>
          Professional Market Intelligence,<br/>No Compromise.
        </h1>
        <p style={{margin:'0 auto 28px',maxWidth:520,fontSize:15,color:'rgba(255,255,255,0.6)',lineHeight:1.65}}>
          Real-time data · Advanced screener · Multi-layout charts · Pattern detection · Strategy backtester · Ad-free
        </p>
        <a href="#cp-subscribe" onClick={e=>{e.preventDefault();document.getElementById('cp-subscribe')?.scrollIntoView({behavior:'smooth'})}}
          style={{
            display:'inline-block',background:'#7c3aed',color:'#fff',
            fontSize:16,fontWeight:700,fontFamily:C.fnt,
            padding:'13px 34px',borderRadius:8,textDecoration:'none',
            boxShadow:'0 4px 20px rgba(124,58,237,0.4)',
          }}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.88'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}
        >Try Pro Free for 7 Days</a>
        <div style={{marginTop:10,fontSize:12,color:'rgba(255,255,255,0.4)'}}>No credit card required.</div>
      </div>

      {/* FEATURES GRID */}
      <div style={{maxWidth:920,margin:'0 auto',padding:'44px 24px 0'}}>
        <h2 style={{textAlign:'center',fontSize:22,fontWeight:800,margin:'0 0 8px',color:'var(--cp-txt)'}}>
          Everything You Need to Trade Smarter
        </h2>
        <p style={{textAlign:'center',color:'var(--cp-txt2)',fontSize:13,margin:'0 0 28px'}}>
          One Pro plan unlocks every feature below.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:14}}>
          {[
            {title:'Real-Time Data',desc:'Live quotes, charts, screener, maps and groups — zero delays.'},
            {title:'Multi-Layout Charts',desc:'Up to 4 simultaneous charts with full technical studies, saved automatically.'},
            {title:'Advanced Screener',desc:'200+ filters, custom presets, ETF filters and benchmark insights.'},
            {title:'Smart Alerts',desc:'Price, insider activity, ratings, news and SEC filings via email or push.'},
            {title:'ETF Deep Dive',desc:'Full holdings breakdown, structural metrics and treemap visualization.'},
            {title:'Strategy Backtester',desc:'Test SMA, RSI, Bollinger Bands, MACD and Momentum on real historical data.'},
            {title:'100% Ad-Free',desc:'Clean, distraction-free interface built for serious traders.'},
            {title:'Export & API',desc:'Export screener, portfolio and news data to CSV or access via API.'},
          ].map(f=>(
            <div key={f.title} style={{background:'var(--cp-bg1)',border:'1px solid var(--cp-bg3)',borderRadius:8,padding:'18px 16px'}}>
              <div style={{fontWeight:700,fontSize:13,color:'var(--cp-txt)',marginBottom:5}}>{f.title}</div>
              <div style={{fontSize:12,color:'var(--cp-txt2)',lineHeight:1.55}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING CARDS */}
      <div id="cp-subscribe" style={{maxWidth:920,margin:'0 auto',padding:'52px 24px 0'}}>
        <h2 style={{textAlign:'center',fontSize:24,fontWeight:800,margin:'0 0 6px',color:'var(--cp-txt)'}}>
          Start Your Pro Account Today
        </h2>
        <p style={{textAlign:'center',color:'var(--cp-txt2)',fontSize:13,margin:'0 0 32px'}}>
          All paid plans include a 7-day free trial. No credit card required.
        </p>
        <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center'}}>
          {PLANS.map(p=><PlanCard key={p.name} plan={p}/>)}
        </div>
        <p style={{textAlign:'center',color:'var(--cp-txt3)',fontSize:12,marginTop:18}}>
          After trial: $29/mo monthly or $19/mo billed annually ($228/yr) · Cancel anytime · Stripe-secured payments
        </p>
      </div>

      {/* COMPARISON TABLE */}
      <div style={{maxWidth:720,margin:'0 auto',padding:'52px 24px 0'}}>
        <h2 style={{textAlign:'center',fontSize:20,fontWeight:800,margin:'0 0 20px',color:'var(--cp-txt)'}}>
          Free vs Pro — Full Feature Comparison
        </h2>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,fontFamily:C.fnt}}>
          <thead>
            <tr style={{background:'var(--cp-bg2)'}}>
              <th style={{padding:'10px 14px',textAlign:'left',border:'1px solid var(--cp-bg3)',color:'var(--cp-txt)',fontWeight:700}}>Feature</th>
              <th style={{padding:'10px 14px',textAlign:'center',border:'1px solid var(--cp-bg3)',color:'var(--cp-txt2)',fontWeight:700,width:100}}>Free</th>
              <th style={{padding:'10px 14px',textAlign:'center',border:'1px solid var(--cp-bg3)',color:'#a78bfa',fontWeight:700,width:100}}>Pro ★</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((row,i)=>(
              <tr key={row.label} style={{background:i%2===0?'var(--cp-bg1)':'var(--cp-bg0)'}}>
                <td style={{padding:'8px 14px',border:'1px solid var(--cp-bg3)',color:'var(--cp-txt2)'}}>{row.label}</td>
                <td style={{padding:'8px 14px',border:'1px solid var(--cp-bg3)',textAlign:'center'}}>
                  {row.free===false ? <span style={{color:'var(--cp-txt3)'}}>—</span>
                   : row.free===true ? <span style={{color:'var(--cp-pos)',fontWeight:700}}>✓</span>
                   : <span style={{color:'var(--cp-txt2)'}}>{row.free}</span>}
                </td>
                <td style={{padding:'8px 14px',border:'1px solid var(--cp-bg3)',textAlign:'center'}}>
                  {row.pro===true
                    ? <span style={{color:'#a78bfa',fontWeight:700,fontSize:15}}>✓</span>
                    : <span style={{color:'#a78bfa',fontWeight:700}}>{row.pro}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TRUST BAR */}
      <div style={{maxWidth:700,margin:'40px auto 0',padding:'0 24px',display:'flex',gap:28,flexWrap:'wrap',justifyContent:'center'}}>
        {['Stripe-Secured','No Card for Trial','Cancel Anytime','Instant Access'].map(label=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:7,color:'var(--cp-txt2)',fontSize:13}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#7c3aed" opacity="0.18"/><path d="M4 7l2 2 4-4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{maxWidth:700,margin:'52px auto 0',padding:'0 24px'}}>
        <h2 style={{textAlign:'center',fontSize:20,fontWeight:800,margin:'0 0 20px',color:'var(--cp-txt)'}}>
          Frequently Asked Questions
        </h2>
        {FAQ.map((f,i)=>(
          <div key={i} style={{border:'1px solid var(--cp-bg3)',borderTop:i===0?'1px solid var(--cp-bg3)':'none',marginBottom:0,overflow:'hidden',
            borderRadius:i===0?'6px 6px 0 0':i===FAQ.length-1?'0 0 6px 6px':'0',
          }}>
            <div onClick={()=>setFaqOpen(p=>({...p,[i]:!p[i]}))}
              style={{
                padding:'13px 18px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',
                background:faqOpen[i]?'var(--cp-bg2)':'var(--cp-bg1)',
                fontWeight:600,fontSize:13,color:'var(--cp-txt)',userSelect:'none',
                borderTop:i>0?'1px solid var(--cp-bg3)':'none',
              }}>
              <span>{f.q}</span>
              <span style={{color:'#7c3aed',fontSize:20,lineHeight:1,marginLeft:12}}>{faqOpen[i]?'−':'+'}</span>
            </div>
            {faqOpen[i]&&(
              <div style={{padding:'12px 18px 14px',fontSize:13,color:'var(--cp-txt2)',lineHeight:1.65,background:'var(--cp-bg0)'}}>
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* BOTTOM CTA */}
      <div style={{
        textAlign:'center',padding:'52px 24px 0',marginTop:52,
        background:'linear-gradient(180deg,var(--cp-bg0) 0%,#1a0a3c 100%)',
      }}>
        <h2 style={{fontSize:26,fontWeight:900,color:'#fff',margin:'0 0 10px'}}>Ready to trade with an edge?</h2>
        <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,margin:'0 0 24px'}}>Start your free 7-day Pro trial — no card needed.</p>
      <BottomCTA />
        <div style={{marginTop:20,fontSize:11,color:'rgba(255,255,255,0.3)',paddingBottom:40}}>
          CompoundPulse · Market data for informational purposes only · Not financial advice · Prices subject to change
        </div>
      </div>

    </div>
  )
}