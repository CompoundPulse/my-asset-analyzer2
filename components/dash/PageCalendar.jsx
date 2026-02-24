'use client'
import { useState } from 'react'
import { C, bd } from './dashTheme'

const TABS = ['Economic Calendar','Earnings Calendar']

// Real economic calendar data - typical week
const ECON_DATA = [
  {date:'Feb 21, Fri', time:'8:30 AM',  impact:'High',   release:'PMI Composite',         for:'Feb',    actual:'52.7',  expected:'53.0',  prior:'52.7'},
  {date:'Feb 21, Fri', time:'8:30 AM',  impact:'High',   release:'PMI Manufacturing',      for:'Feb',    actual:'51.6',  expected:'51.5',  prior:'51.2'},
  {date:'Feb 21, Fri', time:'8:30 AM',  impact:'High',   release:'PMI Services',           for:'Feb',    actual:'52.9',  expected:'53.0',  prior:'52.8'},
  {date:'Feb 21, Fri', time:'10:00 AM', impact:'High',   release:'Existing Home Sales',    for:'Jan',    actual:'4.08M', expected:'4.13M', prior:'4.24M'},
  {date:'Feb 24, Mon', time:'10:00 AM', impact:'Medium', release:'CB Leading Index',       for:'Jan',    actual:'',      expected:'-0.1%', prior:'-0.1%'},
  {date:'Feb 25, Tue', time:'10:00 AM', impact:'High',   release:'Consumer Confidence',    for:'Feb',    actual:'',      expected:'103.0', prior:'105.3'},
  {date:'Feb 25, Tue', time:'10:00 AM', impact:'Medium', release:'Richmond Fed Mfg Index', for:'Feb',    actual:'',      expected:'-7',    prior:'-4'},
  {date:'Feb 26, Wed', time:'7:00 AM',  impact:'Medium', release:'MBA Mortgage Applications',for:'Feb 21',actual:'',    expected:'',      prior:'-6.6%'},
  {date:'Feb 26, Wed', time:'10:00 AM', impact:'High',   release:'New Home Sales',         for:'Jan',    actual:'',      expected:'678K',  prior:'698K'},
  {date:'Feb 27, Thu', time:'8:30 AM',  impact:'High',   release:'GDP Growth Rate QoQ',    for:'Q4',     actual:'',      expected:'2.3%',  prior:'2.3%'},
  {date:'Feb 27, Thu', time:'8:30 AM',  impact:'High',   release:'Initial Jobless Claims', for:'Feb 22', actual:'',      expected:'222K',  prior:'219K'},
  {date:'Feb 27, Thu', time:'8:30 AM',  impact:'Medium', release:'Durable Goods Orders',   for:'Jan',    actual:'',      expected:'-1.0%', prior:'0.0%'},
  {date:'Feb 28, Fri', time:'8:30 AM',  impact:'High',   release:'PCE Price Index MoM',    for:'Jan',    actual:'',      expected:'0.3%',  prior:'0.3%'},
  {date:'Feb 28, Fri', time:'8:30 AM',  impact:'High',   release:'Core PCE Price Index',   for:'Jan',    actual:'',      expected:'0.3%',  prior:'0.2%'},
  {date:'Feb 28, Fri', time:'8:30 AM',  impact:'High',   release:'Personal Income',        for:'Jan',    actual:'',      expected:'0.4%',  prior:'0.4%'},
  {date:'Feb 28, Fri', time:'9:45 AM',  impact:'Medium', release:'Chicago PMI',            for:'Feb',    actual:'',      expected:'40.5',  prior:'39.5'},
  {date:'Feb 28, Fri', time:'10:00 AM', impact:'Medium', release:'Michigan Sentiment',     for:'Feb',    actual:'',      expected:'67.8',  prior:'71.1'},
]

const EARNINGS_DATA = [
  {date:'Feb 24 (Mon)',  ams:['HD','MELI','WB'],                             pms:['LSE','INTU','AMAT']},
  {date:'Feb 25 (Tue)',  ams:['PANW','PSA'],                                  pms:['XPO','NVDA','CRM']},
  {date:'Feb 26 (Wed)',  ams:['LOW','TGT','FLUT'],                            pms:['EPAM','WDAY','OKTA']},
  {date:'Feb 27 (Thu)',  ams:['DELL','HPE','DG'],                             pms:['COO','NTNX','VMW']},
  {date:'Feb 28 (Fri)',  ams:['BRKB'],                                        pms:[]},
]

function ImpactBadge({ impact }) {
  const color = impact==='High' ? C.neg : impact==='Medium' ? '#f59e0b' : C.txt2
  return <span style={{fontSize:9,fontWeight:700,color,background:`${color}22`,padding:'1px 4px',borderRadius:2,whiteSpace:'nowrap'}}>{impact}</span>
}

function EconRow({ r, i }) {
  const [hov, setHov] = useState(false)
  const hasPrior = r.prior !== ''
  const miss = r.actual !== '' && r.expected !== '' && r.actual < r.expected
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,color:C.txt2,whiteSpace:'nowrap'}}>{r.date}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,color:C.txt2,whiteSpace:'nowrap'}}>{r.time}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,whiteSpace:'nowrap'}}><ImpactBadge impact={r.impact}/></td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12,color:C.txt,fontWeight:600}}>{r.release}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,color:C.txt2,textAlign:'center'}}>{r.for}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,fontWeight:700,textAlign:'right',color:r.actual?C.pos:C.txt3}}>{r.actual||'—'}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,textAlign:'right',color:C.txt}}>{r.expected||'—'}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,textAlign:'right',color:C.txt2}}>{r.prior||'—'}</td>
    </tr>
  )
}

export default function PageCalendar() {
  const [tab, setTab] = useState('Economic Calendar')
  const tbl = {width:'100%',borderCollapse:'collapse',fontFamily:C.fnt}
  const thSt = {padding:'5px 8px',background:C.thBg,color:C.txt2,fontSize:11,fontWeight:700,borderBottom:`1px solid ${C.thBdr}`,textAlign:'left',whiteSpace:'nowrap'}
  const thR  = {...thSt,textAlign:'right'}

  return (
    <>
      <div style={{display:'flex',borderBottom:`1px solid ${C.bg3}`,margin:'4px 0 0'}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            background:'transparent',border:'none',borderBottom:t===tab?`2px solid ${C.link}`:'2px solid transparent',
            color:t===tab?C.link:C.txt2,fontSize:12,fontWeight:700,padding:'6px 14px',cursor:'pointer',fontFamily:C.fnt,marginBottom:-1,
          }}>{t}</button>
        ))}
      </div>

      {tab === 'Economic Calendar' && (
        <div style={{marginTop:8}}>
          <table style={tbl}>
            <thead><tr>
              <th style={thSt}>Date</th>
              <th style={thSt}>Time</th>
              <th style={thSt}>Impact</th>
              <th style={thSt}>Release</th>
              <th style={{...thSt,textAlign:'center'}}>For</th>
              <th style={thR}>Actual</th>
              <th style={thR}>Expected</th>
              <th style={thR}>Prior</th>
            </tr></thead>
            <tbody>{ECON_DATA.map((r,i)=><EconRow key={i} r={r} i={i}/>)}</tbody>
          </table>
        </div>
      )}

      {tab === 'Earnings Calendar' && (
        <div style={{marginTop:8}}>
          <table style={tbl}>
            <thead><tr>
              <th style={thSt}>Date</th>
              <th style={thSt}>Before Market Open</th>
              <th style={thSt}>After Market Close</th>
            </tr></thead>
            <tbody>{EARNINGS_DATA.map((r,i)=>{
              const [hov, setHov] = useState(false)
              return (
                <tr key={i} style={{background:hov?C.hov:i%2?C.alt:C.bg1}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
                  <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,color:C.txt2,whiteSpace:'nowrap',fontWeight:600}}>{r.date}</td>
                  <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12}}>
                    {r.ams.map(t=><span key={t} style={{color:C.link,fontWeight:700,marginRight:8,cursor:'pointer'}}>{t}</span>)}
                  </td>
                  <td style={{padding:'4px 8px',borderBottom:bd,fontSize:12}}>
                    {r.pms.map(t=><span key={t} style={{color:C.link,fontWeight:700,marginRight:8,cursor:'pointer'}}>{t}</span>)}
                  </td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      )}
    </>
  )
}