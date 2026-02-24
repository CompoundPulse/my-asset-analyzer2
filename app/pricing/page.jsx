// app/pricing/page.tsx
// Redirect /pricing to the SPA homepage which handles Pricing via internal nav
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PricingRedirect() {
  const router = useRouter()
  useEffect(() => {
    // Redirect to home, fire nav event after mount
    router.replace('/')
    // Small delay so the SPA has time to mount
    const t = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('cp:nav', { detail: 'Pricing' }))
    }, 300)
    return () => clearTimeout(t)
  }, [])
  return <div style={{ background: '#131722', minHeight: '100vh' }} />
}