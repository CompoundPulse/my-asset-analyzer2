// PageCharts.jsx — wraps existing AssetAnalyzer
'use client'
import dynamic from 'next/dynamic'
import { C } from './dashTheme'

const AssetAnalyzer = dynamic(() => import('../AssetAnalyzer'), { ssr:false, loading:()=>(
  <div style={{padding:40,textAlign:'center',color:C.txt,fontFamily:C.fnt}}>Loading charts…</div>
)})

export default function PageCharts() {
  return (
    <div style={{padding:'12px 0'}}>
      <div style={{marginBottom:8,fontSize:15,fontWeight:700,color:'var(--cp-txt)',fontFamily:C.fnt}}>Charts & Analysis</div>
      <AssetAnalyzer/>
    </div>
  )
}