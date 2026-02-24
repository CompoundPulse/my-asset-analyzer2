'use client'
import { useState } from 'react'
import { C, bd } from './dashTheme'

const TABS = ['Latest Insider Trading','Top Insider Trading Recent Week','Top 10% Owner Trading Recent Week']
const FILTERS = ['All Transactions','Buy Transactions','Sale Transactions']

const INSIDER_DATA = [
  {ticker:'RM',   owner:'BASSWOOD FINANCIAL FUND, L.P.',    rel:'10% Owner',         date:"Feb 20 '26", tx:'Proposed Sale', cost:34.76,  shares:632,     value:21968,      total:null,         sec:'Feb 20 09:59 PM'},
  {ticker:'RM',   owner:'BASSWOOD OPPORTUNITY PARTNERS',    rel:'10% Owner',         date:"Feb 20 '26", tx:'Proposed Sale', cost:34.76,  shares:2391,    value:83111,      total:null,         sec:'Feb 20 09:59 PM'},
  {ticker:'RM',   owner:'BASSWOOD CAPITAL MANAGEMENT, L',   rel:'Director',          date:"Feb 20 '26", tx:'Proposed Sale', cost:34.76,  shares:3201,    value:111267,     total:null,         sec:'Feb 20 09:59 PM'},
  {ticker:'TEM',  owner:'LEFKOFSKY ERIC P',                 rel:'CEO and Chairman',  date:"Feb 19 '26", tx:'Sale',          cost:59.05,  shares:13587,   value:802312,     total:1989626,      sec:'Feb 20 09:45 PM'},
  {ticker:'TEM',  owner:'LEFKOFSKY ERIC P',                 rel:'CEO and Chairman',  date:"Feb 19 '26", tx:'Sale',          cost:58.87,  shares:166250,  value:9787605,    total:8908283,      sec:'Feb 20 09:45 PM'},
  {ticker:'OMER', owner:'Demopulos Gregory A MD',           rel:'Chairman, CEO & President', date:"Feb 18 '26", tx:'Option Exercise', cost:10.27, shares:400000, value:4108000, total:1826986, sec:'Feb 20 09:40 PM'},
  {ticker:'CRWV', owner:'ALTIMETER CAPITAL MANAGEMENT LP',  rel:'10% Owner',         date:"Feb 19 '26", tx:'Sale',          cost:75.40,  shares:1000000, value:75400000,   total:null,         sec:'Feb 20 09:35 PM'},
  {ticker:'NTAP', owner:'Goeckeler George',                 rel:'CEO',               date:"Feb 18 '26", tx:'Sale',          cost:102.49, shares:20000,   value:2049800,    total:321456,       sec:'Feb 20 09:20 PM'},
  {ticker:'PANW', owner:'ANDERSON NORA M',                  rel:'SVP & CFO',         date:"Feb 18 '26", tx:'Sale',          cost:197.36, shares:4560,    value:899962,     total:178234,       sec:'Feb 20 09:15 PM'},
  {ticker:'META', owner:'Zuckerberg Mark',                  rel:'CEO, Chairman',     date:"Feb 18 '26", tx:'Sale',          cost:682.50, shares:50000,   value:34125000,   total:345678901,    sec:'Feb 20 09:00 PM'},
  {ticker:'NVDA', owner:'Huang Jen-Hsun',                   rel:'President, CEO',    date:"Feb 17 '26", tx:'Sale',          cost:134.50, shares:120000,  value:16140000,   total:890123456,    sec:'Feb 19 09:00 PM'},
  {ticker:'AMZN', owner:'JASSY ANDREW R',                   rel:'CEO',               date:"Feb 17 '26", tx:'Sale',          cost:235.80, shares:30000,   value:7074000,    total:5234567,      sec:'Feb 19 08:45 PM'},
]

const fmtNum = n => {
  if (!n && n!==0) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(2)+'M'
  if (n >= 1000) return (n/1000).toFixed(0)+'K'
  return n.toLocaleString()
}

function InsiderRow({ r, i }) {
  const [hov, setHov] = useState(false)
  const isBuy = r.tx === 'Buy' || r.tx === 'Option Exercise'
  const isSell = r.tx === 'Sale' || r.tx === 'Proposed Sale'
  const txColor = isBuy ? C.pos : isSell ? C.neg : C.txt2
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:12,color:C.link,fontWeight:700,whiteSpace:'nowrap'}}>{r.ticker}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:11,color:C.txt,whiteSpace:'nowrap',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis'}}>{r.owner}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:11,color:C.txt2,whiteSpace:'nowrap'}}>{r.rel}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:11,color:C.txt,whiteSpace:'nowrap'}}>{r.date}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:11,color:txColor,fontWeight:700,whiteSpace:'nowrap'}}>{r.tx}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:11,color:C.txt,textAlign:'right',whiteSpace:'nowrap'}}>{r.cost.toFixed(2)}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:11,color:C.txt,textAlign:'right',whiteSpace:'nowrap'}}>{r.shares.toLocaleString()}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:11,color:C.txt,textAlign:'right',whiteSpace:'nowrap'}}>{fmtNum(r.value)}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:11,color:C.txt,textAlign:'right',whiteSpace:'nowrap'}}>{r.total ? fmtNum(r.total) : '—'}</td>
      <td style={{padding:'3px 6px',borderBottom:bd,fontSize:10,color:C.txt2,whiteSpace:'nowrap'}}>{r.sec}</td>
    </tr>
  )
}

export default function PageInsider() {
  const [tab, setTab]       = useState(TABS[0])
  const [filter, setFilter] = useState('All Transactions')
  const tbl = {width:'100%',borderCollapse:'collapse',fontFamily:C.fnt}
  const thSt = {padding:'4px 6px',background:C.thBg,color:C.txt2,fontSize:11,fontWeight:700,borderBottom:`1px solid ${C.thBdr}`,textAlign:'left',whiteSpace:'nowrap'}
  const thR  = {...thSt,textAlign:'right'}

  const filtered = filter === 'Buy Transactions'
    ? INSIDER_DATA.filter(r => r.tx === 'Buy' || r.tx === 'Option Exercise')
    : filter === 'Sale Transactions'
    ? INSIDER_DATA.filter(r => r.tx === 'Sale' || r.tx === 'Proposed Sale')
    : INSIDER_DATA

  return (
    <>
      {/* Tab row */}
      <div style={{display:'flex',alignItems:'center',borderBottom:`1px solid ${C.bg3}`,margin:'4px 0 0'}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            background:'transparent',border:'none',
            borderBottom:t===tab?`2px solid ${C.link}`:'2px solid transparent',
            color:t===tab?C.link:C.txt2,fontSize:11,fontWeight:700,
            padding:'6px 10px',cursor:'pointer',fontFamily:C.fnt,marginBottom:-1,whiteSpace:'nowrap',
          }}>{t}</button>
        ))}
      </div>

      {/* Filter row */}
      <div style={{display:'flex',alignItems:'center',gap:4,margin:'8px 0',padding:'4px 0',borderBottom:`1px solid ${C.bg3}`}}>
        <span style={{fontSize:11,color:C.txt2,marginRight:4}}>Filter:</span>
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            background:f===filter?C.bg3:'transparent',border:`1px solid ${C.bg3}`,
            color:f===filter?C.txt:C.txt2,fontSize:10,fontWeight:700,
            padding:'2px 8px',borderRadius:2,cursor:'pointer',fontFamily:C.fnt,
          }}>{f}</button>
        ))}
      </div>

      <table style={tbl}>
        <thead><tr>
          <th style={thSt}>Ticker</th>
          <th style={thSt}>Owner</th>
          <th style={thSt}>Relationship</th>
          <th style={thSt}>Date</th>
          <th style={thSt}>Transaction</th>
          <th style={thR}>Cost</th>
          <th style={thR}>#Shares</th>
          <th style={thR}>Value ($)</th>
          <th style={thR}>#Shares Total</th>
          <th style={thSt}>SEC Form 4</th>
        </tr></thead>
        <tbody>{filtered.map((r,i)=><InsiderRow key={i} r={r} i={i}/>)}</tbody>
      </table>
      <div style={{marginTop:12,fontSize:10,color:C.txt3,fontFamily:C.fnt}}>
        Insider trading data from SEC Form 4 filings.
      </div>
    </>
  )
}