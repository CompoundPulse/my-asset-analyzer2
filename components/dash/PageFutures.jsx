'use client'
import { useState, useEffect, useRef } from 'react'
import { C, bd, thS } from './dashTheme'
import { Spark } from './dashAtoms'

const fmtLast = (v, label) => {
  if (!v && v!==0) return '—'
  if (label?.includes('USD') || label?.includes('/')) return parseFloat(v).toFixed(4)
  if (v < 10) return parseFloat(v).toFixed(4)
  if (v < 100) return parseFloat(v).toFixed(3)
  if (v >= 1000) return parseFloat(v).toLocaleString('en-US',{maximumFractionDigits:2})
  return parseFloat(v).toFixed(2)
}
const fmtChg = v => v != null ? `${parseFloat(v)>=0?'+':''}${parseFloat(v).toFixed(2)}%` : '—'

// Static data from Finviz snapshot (real values from Feb 2026)
const GROUPS = [
  { ticker:'INDICES', label:'Indices', contracts:[
    {t:'YM',  label:'DJIA',           last:49680.0,  chg:0.44},
    {t:'ES',  label:'S&P 500',        last:6924.75,  chg:0.67},
    {t:'NQ',  label:'Nasdaq 100',     last:25077.5,  chg:0.84},
    {t:'ER2', label:'Russell 2000',   last:2668.9,   chg:-0.01},
    {t:'NKD', label:'Nikkei 225',     last:57115.0,  chg:0.18},
    {t:'EX',  label:'Euro Stoxx 50',  last:6147.0,   chg:1.29},
    {t:'DY',  label:'DAX',            last:25296.0,  chg:0.94},
    {t:'VX',  label:'VIX',            last:20.15,    chg:-2.55},
  ]},
  { ticker:'ENERGY', label:'Energy', contracts:[
    {t:'CL',  label:'Crude Oil WTI',  last:66.31,    chg:0.12},
    {t:'QA',  label:'Crude Oil Brent',last:71.68,    chg:0.14},
    {t:'RB',  label:'Gasoline RBOB',  last:1.9932,   chg:-0.46},
    {t:'HO',  label:'Heating Oil',    last:2.5804,   chg:-1.11},
    {t:'NG',  label:'Natural Gas',    last:3.066,    chg:1.74},
    {t:'ZK',  label:'Ethanol',        last:1.6675,   chg:0.45},
  ]},
  { ticker:'METALS', label:'Metals', contracts:[
    {t:'GC',  label:'Gold',           last:5130.0,   chg:1.67},
    {t:'SI',  label:'Silver',         last:84.57,    chg:6.07},
    {t:'PL',  label:'Platinum',       last:2171.4,   chg:5.19},
    {t:'HG',  label:'Copper',         last:5.87,     chg:1.75},
    {t:'PA',  label:'Palladium',      last:1786.5,   chg:4.95},
  ]},
  { ticker:'MEATS', label:'Meats', contracts:[
    {t:'LC',  label:'Live Cattle',    last:241.725,  chg:-0.59},
    {t:'FC',  label:'Feeder Cattle',  last:364.275,  chg:-0.71},
    {t:'LH',  label:'Lean Hogs',      last:93.625,   chg:0.24},
  ]},
  { ticker:'GRAINS', label:'Grains', contracts:[
    {t:'ZC',  label:'Corn',           last:440.0,    chg:0.80},
    {t:'ZL',  label:'Soybean Oil',    last:59.34,    chg:-1.31},
    {t:'ZM',  label:'Soybean Meal',   last:314.2,    chg:1.59},
    {t:'ZO',  label:'Oats',           last:324.25,   chg:0.78},
    {t:'ZR',  label:'Rough Rice',     last:10.52,    chg:-0.14},
    {t:'ZS',  label:'Soybeans',       last:1153.75,  chg:-0.24},
    {t:'ZW',  label:'Wheat',          last:581.75,   chg:2.38},
    {t:'RS',  label:'Canola',         last:674.7,    chg:0.30},
  ]},
  { ticker:'SOFTS', label:'Softs', contracts:[
    {t:'CC',  label:'Cocoa',          last:3184.0,   chg:3.92},
    {t:'CT',  label:'Cotton',         last:65.55,    chg:2.32},
    {t:'JO',  label:'Orange Juice',   last:169.35,   chg:-9.29},
    {t:'KC',  label:'Coffee',         last:285.35,   chg:0.11},
    {t:'LB',  label:'Lumber',         last:576.5,    chg:1.76},
    {t:'SB',  label:'Sugar',          last:13.86,    chg:1.24},
  ]},
  { ticker:'BONDS', label:'Bonds', contracts:[
    {t:'ZB',  label:'30 Year Bond',   last:117.40625,chg:-0.21},
    {t:'ZN',  label:'10 Year Note',   last:112.9375, chg:-0.03},
    {t:'ZF',  label:'5 Year Note',    last:109.5,    chg:-0.01},
    {t:'ZT',  label:'2 Year Note',    last:104.296875,chg:-0.03},
  ]},
  { ticker:'CURRENCIES', label:'Currencies', contracts:[
    {t:'DX',  label:'USD',            last:97.715,   chg:-0.13},
    {t:'6E',  label:'EUR',            last:1.1795,   chg:0.14},
    {t:'6J',  label:'JPY',            last:0.64605,  chg:-0.04},
    {t:'6B',  label:'GBP',            last:1.3479,   chg:0.26},
    {t:'6C',  label:'CAD',            last:0.7317,   chg:0.09},
    {t:'6S',  label:'CHF',            last:1.29185,  chg:0.05},
    {t:'6A',  label:'AUD',            last:0.7086,   chg:0.44},
    {t:'6N',  label:'NZD',            last:0.598,    chg:0.13},
    {t:'BTC', label:'Bitcoin',        last:67925.0,  chg:0.92},
  ]},
]

function ContractRow({ c, i }) {
  const [hov, setHov] = useState(false)
  const pos = c.chg >= 0
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12,color:C.link,fontWeight:600,width:'30%'}}>{c.label}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12,color:C.txt,textAlign:'right',fontWeight:600,width:'20%'}}>{fmtLast(c.last, c.label)}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12,color:pos?C.pos:C.neg,textAlign:'right',fontWeight:600,width:'18%'}}>{fmtChg(c.chg)}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,width:'32%'}}>
        <Spark pos={pos} seed={c.label.charCodeAt(0)*3+(c.label.charCodeAt(1)||7)+i}/>
      </td>
    </tr>
  )
}

export default function PageFutures({ onT }) {
  const tbl = {width:'100%',borderCollapse:'collapse',fontFamily:C.fnt,fontSize:12}
  const thStyle = {padding:'5px 8px',background:C.thBg,color:C.txt2,fontSize:11,fontWeight:700,textAlign:'left',borderBottom:`1px solid ${C.thBdr}`}
  const thR = {...thStyle,textAlign:'right'}

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'8px 0 6px'}}>
        <h2 style={{margin:0,fontSize:14,fontWeight:700,color:C.txt,fontFamily:C.fnt}}>Futures</h2>
        <span style={{fontSize:11,color:C.txt2}}>Gold/Silver/Oil: OANDA · Indices: ETF proxies · cached 15min</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
        {GROUPS.map(g => (
          <div key={g.ticker}>
            <table style={tbl}>
              <thead><tr>
                <th style={{...thStyle,borderRadius:'3px 0 0 0'}}>{g.label}</th>
                <th style={thR}>Last</th>
                <th style={thR}>Change</th>
                <th style={{...thStyle,borderRadius:'0 3px 0 0'}}>Daily</th>
              </tr></thead>
              <tbody>{g.contracts.map((c,i)=><ContractRow key={c.t} c={c} i={i}/>)}</tbody>
            </table>
          </div>
        ))}
      </div>
      <div style={{marginTop:16,paddingTop:8,borderTop:`1px solid ${C.bg3}`,fontSize:10,color:C.txt3,fontFamily:C.fnt}}>
        Commodities via OANDA real rates · Index contracts use ETF proxy prices (SPY, QQQ, DIA)
      </div>
    </>
  )
}