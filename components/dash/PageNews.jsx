'use client'
import { useState, useEffect, useRef } from 'react'
import { C, bd } from './dashTheme'

const TABS = ['Market News','Market Pulse','Stocks News','ETF News','Crypto News','News','Blogs']
const VIEW_BY = ['Time','Source','Ticker']

const SAMPLE_NEWS = [
  {t:'05:30AM', h:'Commerce is becoming fragmented, and prices on the basic building blocks of the economy are more volatile', src:'Bloomberg',  url:'#'},
  {t:'05:28AM', h:'For India, Buying Russian Oil Just Got More Complicated', src:'Bloomberg',  url:'#'},
  {t:'05:12AM', h:'Brazil, India Seal Rare Earth Deal Amid Global Supply Strains', src:'Bloomberg',  url:'#'},
  {t:'05:02AM', h:'Fred Segal Has a New Owner. This Time It\'s Aritzia.', src:'WSJ',         url:'#'},
  {t:'04:30AM', h:'Trump Doubles Down on Closing Tax Loophole on Cheap Imports', src:'Reuters',     url:'#'},
  {t:'04:07AM', h:'Indian Opposition Calls For Modi to Put US Trade Deal on Hold', src:'Bloomberg',  url:'#'},
  {t:'03:15AM', h:'Stocks Rise Anew, Bonds Fall on Trump Tariff Talk: Markets Wrap', src:'Bloomberg',  url:'#'},
  {t:'02:55AM', h:"From 'buy America' to 'bye America', Wall Street exodus gathers pace", src:'Reuters',     url:'#'},
  {t:'12:00AM', h:"'Murky Waters' for Global Businesses After Trump's Tariff Loss", src:'Bloomberg',  url:'#'},
  {t:'Feb-20',  h:'South Korea Says US Trade Deal Still Intact After Tariff Ruling', src:'Reuters',     url:'#'},
  {t:'Feb-20',  h:"Supreme Court tariff ruling clouds Fed's rate path after a year of upheaval", src:'Reuters',     url:'#'},
  {t:'Feb-20',  h:'Mexico, Canada Get Exemption to 10% US Levy But USMCA Risk Looms', src:'Bloomberg',  url:'#'},
  {t:'Feb-20',  h:'Stock Market News, Feb. 20, 2026: Trump Says He Signed Order Imposing 10% Tariff', src:'AP',          url:'#'},
  {t:'Feb-20',  h:'The economy is in pretty good shape, Jason Katz says', src:'CNBC',        url:'#'},
  {t:'Feb-20',  h:'Stocks jump following tariff ruling as Trump vows new trade action', src:'Reuters',     url:'#'},
  {t:'Feb-20',  h:"Don't expect lower prices now that the Supreme Court has ruled against Trump's tariffs", src:'MarketWatch',  url:'#'},
  {t:'Feb-20',  h:"'It will not be automatic or immediate': Companies brace for messy tariff refund process", src:'WSJ',         url:'#'},
]

function NewsRow({ n, i, viewBy }) {
  const [hov, setHov] = useState(false)
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,color:C.txt2,whiteSpace:'nowrap',verticalAlign:'top',width:72}}>{n.t}</td>
      <td style={{padding:'4px 8px',borderBottom:bd,verticalAlign:'top'}}>
        <a href={n.url} target="_blank" rel="noopener noreferrer"
          style={{color:C.txt,textDecoration:'none',fontSize:13,lineHeight:'1.4'}}
          onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
          onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
          {n.h}
        </a>
      </td>
      <td style={{padding:'4px 8px',borderBottom:bd,fontSize:11,color:C.txt2,whiteSpace:'nowrap',verticalAlign:'top',textAlign:'right',width:100}}>{n.src}</td>
    </tr>
  )
}

export default function PageNews() {
  const [tab, setTab]     = useState('Market News')
  const [viewBy, setViewBy] = useState('Time')
  const [news, setNews]   = useState(SAMPLE_NEWS)
  const [loading, setLoading] = useState(false)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetch('/api/market-data?section=news')
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        if (d.news?.length) {
          setNews(d.news.map(n => ({t: n.time, h: n.h, src: n.src, url: n.url || '#'})))
        }
      })
      .catch(() => {})
  }, [])

  const tbl = {width:'100%',borderCollapse:'collapse',fontFamily:C.fnt}

  return (
    <>
      {/* Tabs */}
      <div style={{display:'flex',alignItems:'center',borderBottom:`1px solid ${C.bg3}`,margin:'4px 0 0',gap:0}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            background:'transparent', border:'none',
            borderBottom:t===tab?`2px solid ${C.link}`:'2px solid transparent',
            color:t===tab?C.link:C.txt2, fontSize:12, fontWeight:700,
            padding:'6px 12px', cursor:'pointer', fontFamily:C.fnt, marginBottom:-1,
          }}>{t}</button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,padding:'0 8px',fontSize:11,color:C.txt2}}>
          View by:
          {VIEW_BY.map(v=>(
            <button key={v} onClick={()=>setViewBy(v)} style={{
              background:v===viewBy?C.bg3:'transparent', border:`1px solid ${C.bg3}`,
              color:v===viewBy?C.txt:C.txt2, fontSize:10, fontWeight:700,
              padding:'2px 7px', borderRadius:2, cursor:'pointer', fontFamily:C.fnt,
            }}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{marginTop:8}}>
        <table style={tbl}>
          <thead><tr>
            <th style={{padding:'4px 8px',background:C.thBg,color:C.txt2,fontSize:11,fontWeight:700,borderBottom:`1px solid ${C.thBdr}`,textAlign:'left',width:72}}>Time</th>
            <th style={{padding:'4px 8px',background:C.thBg,color:C.txt2,fontSize:11,fontWeight:700,borderBottom:`1px solid ${C.thBdr}`,textAlign:'left'}}>Headlines</th>
            <th style={{padding:'4px 8px',background:C.thBg,color:C.txt2,fontSize:11,fontWeight:700,borderBottom:`1px solid ${C.thBdr}`,textAlign:'right',width:100}}>Source</th>
          </tr></thead>
          <tbody>
            {news.map((n,i)=><NewsRow key={i} n={n} i={i} viewBy={viewBy}/>)}
          </tbody>
        </table>
      </div>
    </>
  )
}