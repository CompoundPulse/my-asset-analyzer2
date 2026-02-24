'use client'
import { useState } from 'react'
import { C, bd } from './dashTheme'
import { Spark } from './dashAtoms'

const COINS = [
  {t:'BTCUSD',  label:'BTC/USD',  name:'Bitcoin',         last:68096.0,  chg:0.50,  mcap:'1.34T'},
  {t:'ETHUSD',  label:'ETH/USD',  name:'Ethereum',        last:1978.89,  chg:0.93,  mcap:'238.4B'},
  {t:'BNBUSD',  label:'BNB/USD',  name:'BNB',             last:630.5,    chg:0.50,  mcap:'88.7B'},
  {t:'SOLUSD',  label:'SOL/USD',  name:'Solana',          last:85.28,    chg:1.11,  mcap:'40.2B'},
  {t:'ADAUSD',  label:'ADA/USD',  name:'Cardano',         last:0.2832,   chg:0.00,  mcap:'9.9B'},
  {t:'AVAXUSD', label:'AVAX/USD', name:'Avalanche',       last:9.27,     chg:1.20,  mcap:'3.8B'},
  {t:'DOGEUSD', label:'DOGE/USD', name:'Dogecoin',        last:0.09994,  chg:0.14,  mcap:'14.6B'},
  {t:'TRXUSD',  label:'TRX/USD',  name:'TRON',            last:0.28576,  chg:0.49,  mcap:'24.6B'},
  {t:'LINKUSD', label:'LINK/USD', name:'Chainlink',       last:8.948,    chg:0.83,  mcap:'5.3B'},
  {t:'DOTUSD',  label:'DOT/USD',  name:'Polkadot',        last:1.384,    chg:2.90,  mcap:'2.1B'},
  {t:'NEARUSD', label:'NEAR/USD', name:'NEAR Protocol',   last:1.088,    chg:1.97,  mcap:'1.2B'},
  {t:'LTCUSD',  label:'LTC/USD',  name:'Litecoin',        last:54.91,    chg:-0.09, mcap:'4.1B'},
  {t:'BCHUSD',  label:'BCH/USD',  name:'Bitcoin Cash',    last:568.43,   chg:0.59,  mcap:'11.2B'},
  {t:'AAVEUSD', label:'AAVE/USD', name:'Aave',            last:122.59,   chg:5.52,  mcap:'1.8B'},
  {t:'HBARUSD', label:'HBAR/USD', name:'Hedera',          last:0.10026,  chg:0.46,  mcap:'3.9B'},
  {t:'ICPUSD',  label:'ICP/USD',  name:'Internet Computer',last:2.237,   chg:2.61,  mcap:'1.0B'},
  {t:'SUIUSD',  label:'SUI/USD',  name:'Sui',             last:0.9579,   chg:0.58,  mcap:'2.8B'},
  {t:'TONUSD',  label:'TON/USD',  name:'Toncoin',         last:1.33,     chg:0.23,  mcap:'3.3B'},
  {t:'TAOUSD',  label:'TAO/USD',  name:'Bittensor',       last:181.0,    chg:1.06,  mcap:'1.3B'},
  {t:'SHIBUSD', label:'SHIB/USD', name:'Shiba Inu',       last:0.0000065,chg:0.78,  mcap:'3.8B'},
]

function CoinRow({ c, i }) {
  const [hov, setHov] = useState(false)
  const pos = c.chg >= 0
  const fmt = v => {
    const n = parseFloat(v)
    if (n >= 10000) return n.toLocaleString('en-US',{maximumFractionDigits:0})
    if (n >= 1000)  return n.toLocaleString('en-US',{maximumFractionDigits:2})
    if (n >= 1)     return n.toFixed(2)
    if (n >= 0.001) return n.toFixed(5)
    return n.toExponential(2)
  }
  return (
    <tr style={{background:hov?C.hov:i%2?C.alt:C.bg1,cursor:'pointer'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:'4px 6px',borderBottom:`1px solid ${C.bg3}`,fontSize:12,color:C.link,fontWeight:700,whiteSpace:'nowrap'}}>{c.label}</td>
      <td style={{padding:'4px 6px',borderBottom:`1px solid ${C.bg3}`,fontSize:11,color:C.txt2}}>{c.name}</td>
      <td style={{padding:'4px 8px',borderBottom:`1px solid ${C.bg3}`,fontSize:12,color:C.txt,textAlign:'right',fontWeight:600,whiteSpace:'nowrap'}}>{fmt(c.last)}</td>
      <td style={{padding:'4px 8px',borderBottom:`1px solid ${C.bg3}`,fontSize:12,color:pos?C.pos:C.neg,textAlign:'right',fontWeight:700,whiteSpace:'nowrap'}}>{pos?'+':''}{c.chg.toFixed(2)}%</td>
      <td style={{padding:'4px 8px',borderBottom:`1px solid ${C.bg3}`,fontSize:11,color:C.txt2,textAlign:'right',whiteSpace:'nowrap'}}>{c.mcap}</td>
      <td style={{padding:'4px 8px',borderBottom:`1px solid ${C.bg3}`}}>
        <Spark pos={pos} seed={c.t.charCodeAt(0)*7+(c.t.charCodeAt(1)||3)+i*3}/>
      </td>
    </tr>
  )
}

export default function PageCrypto() {
  const tbl = {width:'100%',borderCollapse:'collapse',fontFamily:C.fnt}
  const thSt = {padding:'5px 8px',background:C.thBg,color:C.txt2,fontSize:11,fontWeight:700,borderBottom:`1px solid ${C.thBdr}`,textAlign:'left'}
  return (
    <>
      <div style={{margin:'8px 0 12px'}}>
        <h2 style={{margin:'0 0 2px',fontSize:14,fontWeight:700,color:C.txt,fontFamily:C.fnt}}>Crypto</h2>
        <span style={{fontSize:11,color:C.txt2}}>Cryptocurrency prices · Updated every 15 min</span>
      </div>
      <table style={tbl}>
        <thead><tr>
          <th style={thSt}>Pair</th>
          <th style={thSt}>Name</th>
          <th style={{...thSt,textAlign:'right'}}>Last</th>
          <th style={{...thSt,textAlign:'right'}}>Change</th>
          <th style={{...thSt,textAlign:'right'}}>Mkt Cap</th>
          <th style={thSt}>Daily</th>
        </tr></thead>
        <tbody>{COINS.map((c,i)=><CoinRow key={c.t} c={c} i={i}/>)}</tbody>
      </table>
      <div style={{marginTop:12,fontSize:10,color:C.txt3,fontFamily:C.fnt}}>
        Cryptocurrency data. Market data delayed 15 minutes. Not financial advice.
      </div>
    </>
  )
}