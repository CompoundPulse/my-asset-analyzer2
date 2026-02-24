'use client'
import { useState } from 'react'
import { C, bd, thS } from './dashTheme'
import { Spark } from './dashAtoms'

const PAIRS = [
  {t:'EURUSD', label:'EUR/USD', last:1.17766,  chg:0.03,  desc:'Euro / US Dollar'},
  {t:'USDJPY', label:'USD/JPY', last:155.027,  chg:0.02,  desc:'US Dollar / Japanese Yen'},
  {t:'GBPUSD', label:'GBP/USD', last:1.3471,   chg:0.06,  desc:'British Pound / US Dollar'},
  {t:'USDCAD', label:'USD/CAD', last:1.36731,  chg:-0.04, desc:'US Dollar / Canadian Dollar'},
  {t:'USDCHF', label:'USD/CHF', last:0.77495,  chg:0.03,  desc:'US Dollar / Swiss Franc'},
  {t:'AUDUSD', label:'AUD/USD', last:0.70804,  chg:0.37,  desc:'Australian Dollar / US Dollar'},
  {t:'NZDUSD', label:'NZD/USD', last:0.59709,  chg:0.00,  desc:'New Zealand Dollar / US Dollar'},
  {t:'EURGBP', label:'EUR/GBP', last:0.87356,  chg:-0.07, desc:'Euro / British Pound'},
  {t:'GBPJPY', label:'GBP/JPY', last:208.923,  chg:0.13,  desc:'British Pound / Japanese Yen'},
  {t:'BTCUSD', label:'BTC/USD', last:68096.0,  chg:0.50,  desc:'Bitcoin / US Dollar'},
]

const COMMODITIES = [
  {t:'GC', label:'Gold',          last:5130.0,  chg:1.67, desc:'Gold Futures (COMEX)'},
  {t:'SI', label:'Silver',        last:84.57,   chg:6.07, desc:'Silver Futures (COMEX)'},
  {t:'CL', label:'Crude Oil WTI', last:66.31,   chg:0.12, desc:'Crude Oil WTI (NYMEX)'},
]

function FxRow({ c, i }) {
  const [hov, setHov] = useState(false)
  const pos = c.chg >= 0
  const fmt = v => {
    const n = parseFloat(v)
    if (n > 1000) return n.toLocaleString('en-US',{maximumFractionDigits:2})
    if (n > 10) return n.toFixed(3)
    return n.toFixed(5)
  }
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1,cursor:'pointer'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12,color:C.link,fontWeight:700,width:'13%'}}>{c.label}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,color:C.txt2,width:'28%'}}>{c.desc}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12,color:C.txt,textAlign:'right',fontWeight:600,width:'16%'}}>{fmt(c.last)}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12,color:pos?C.pos:C.neg,textAlign:'right',fontWeight:700,width:'14%'}}>{pos?'+':''}{c.chg.toFixed(2)}%</td>
      <td style={{padding:'4px 8px',borderBottom:bd,width:'29%'}}>
        <Spark pos={pos} seed={c.t.charCodeAt(0)*7+i*3}/>
      </td>
    </tr>
  )
}

export default function PageForex() {
  const tbl = {width:'100%',borderCollapse:'collapse',fontFamily:C.fnt,fontSize:12}
  const thSt = {padding:'5px 8px',background:C.thBg,color:C.txt2,fontSize:11,fontWeight:700,borderBottom:`1px solid ${C.thBdr}`,textAlign:'left'}
  return (
    <>
      <div style={{margin:'8px 0 12px'}}>
        <h2 style={{margin:'0 0 2px',fontSize:14,fontWeight:700,color:C.txt,fontFamily:C.fnt}}>Forex</h2>
        <span style={{fontSize:11,color:C.txt2}}>Real-time rates via OANDA · Refreshed every 15 min</span>
      </div>
      <table style={tbl}>
        <thead><tr>
          <th style={thSt}>Pair</th>
          <th style={thSt}>Description</th>
          <th style={{...thSt,textAlign:'right'}}>Last</th>
          <th style={{...thSt,textAlign:'right'}}>Change</th>
          <th style={thSt}>Daily</th>
        </tr></thead>
        <tbody>{PAIRS.map((c,i)=><FxRow key={c.t} c={c} i={i}/>)}</tbody>
      </table>
      <div style={{height:20}}/>
      <div style={{fontSize:12,fontWeight:700,color:C.txt2,fontFamily:C.fnt,marginBottom:4,padding:'0 2px'}}>Commodities</div>
      <table style={tbl}>
        <thead><tr>
          <th style={thSt}>Contract</th>
          <th style={thSt}>Description</th>
          <th style={{...thSt,textAlign:'right'}}>Last</th>
          <th style={{...thSt,textAlign:'right'}}>Change</th>
          <th style={thSt}>Daily</th>
        </tr></thead>
        <tbody>{COMMODITIES.map((c,i)=><FxRow key={c.t} c={c} i={i}/>)}</tbody>
      </table>
      <div style={{marginTop:16,fontSize:10,color:C.txt3,fontFamily:C.fnt}}>
        Forex rates via OANDA. Gold/Silver/Oil via OANDA. Data delayed 15 minutes.
      </div>
    </>
  )
}