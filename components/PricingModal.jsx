import { useState } from 'react'
import { useAuth } from '../app/hooks/useAuth'

const PLANS = [
  {
    id: 'daily',
    label: 'Daily',
    price: '$4.99',
    per: '/day',
    priceEnvKey: 'NEXT_PUBLIC_STRIPE_PRICE_DAILY',
    trial: false,
    badge: null,
    description: 'Try it for a day',
  },
  {
    id: 'weekly',
    label: 'Weekly',
    price: '$9.99',
    per: '/week',
    priceEnvKey: 'NEXT_PUBLIC_STRIPE_PRICE_WEEKLY',
    trial: false,
    badge: null,
    description: 'Short-term access',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$19.99',
    per: '/month',
    priceEnvKey: 'NEXT_PUBLIC_STRIPE_PRICE_MONTHLY',
    trial: true,
    badge: 'MOST POPULAR',
    badgeColor: '#2962FF',
    description: '7-day free trial included',
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$149',
    per: '/year',
    priceEnvKey: 'NEXT_PUBLIC_STRIPE_PRICE_ANNUAL',
    trial: true,
    badge: 'BEST VALUE',
    badgeColor: '#26A69A',
    description: 'Save 37% · 7-day free trial',
    savings: '~$12.42/mo',
  },
]

const FEATURES = [
  'Classic Chart Pattern Detector',
  'Advanced Multi-Timeframe Analysis',
  'Harmonic Pattern Detection (XABCD)',
  'Head & Shoulders Detector',
  'Real-time TradingView charts',
  'Fibonacci & S/R levels',
  'Pattern target projections',
  'Cancel anytime',
]

export default function PricingModal({ isOpen, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  if (!isOpen) return null

  const handleSubscribe = async () => {
    if (!user) {
      setError('Please sign in first')
      return
    }
    setLoading(true)
    setError('')
    try {
      const plan = PLANS.find(p => p.id === selectedPlan)
      const priceId = process.env[plan.priceEnvKey]

      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, email: user.email }),
      })
      const { url, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)
      window.location.href = url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const selected = PLANS.find(p => p.id === selectedPlan)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, overflowY: 'auto',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        backgroundColor: '#131722',
        border: '1px solid #2A2E39',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#2962FF', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>
            COMPOUNDPULSE PRO
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#D1D4DC' }}>
            Unlock Full Pattern Analysis
          </div>
          <div style={{ fontSize: 13, color: '#787B86', marginTop: 6 }}>
            Professional-grade chart pattern detection for serious traders
          </div>
        </div>

        {/* Trial banner */}
        <div style={{
          margin: '20px 0',
          padding: '10px 16px',
          backgroundColor: 'rgba(41,98,255,0.08)',
          border: '1px solid rgba(41,98,255,0.25)',
          borderRadius: 8,
          textAlign: 'center',
          fontSize: 13,
          color: '#7B9EFF',
        }}>
          🎯 Monthly & Annual plans include a <strong style={{ color: '#fff' }}>7-day free trial</strong> — cancel before it ends and pay nothing
        </div>

        {/* Plan selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {PLANS.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              style={{
                position: 'relative',
                padding: '14px 12px',
                backgroundColor: selectedPlan === plan.id ? 'rgba(41,98,255,0.12)' : '#1E222D',
                border: `2px solid ${selectedPlan === plan.id ? '#2962FF' : '#2A2E39'}`,
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -10, right: 8,
                  backgroundColor: plan.badgeColor,
                  color: '#fff', fontSize: 9, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 10,
                  letterSpacing: '0.08em',
                }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#D1D4DC', marginBottom: 2 }}>
                {plan.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: selectedPlan === plan.id ? '#2962FF' : '#fff' }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: 11, color: '#787B86' }}>{plan.per}</span>
              </div>
              {plan.savings && (
                <div style={{ fontSize: 10, color: '#26A69A', marginTop: 2 }}>{plan.savings}</div>
              )}
              <div style={{ fontSize: 11, color: '#4C525E', marginTop: 3 }}>{plan.description}</div>
            </button>
          ))}
        </div>

        {/* Features */}
        <div style={{
          backgroundColor: '#1E222D', borderRadius: 10,
          padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#787B86', marginBottom: 12, letterSpacing: '0.08em' }}>
            EVERYTHING INCLUDED
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ color: '#26A69A', fontSize: 14, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12, color: '#D1D4DC' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.3)',
            borderRadius: 6, padding: '10px 12px', marginBottom: 16,
            fontSize: 13, color: '#EF5350',
          }}>
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 0',
            backgroundColor: loading ? '#2A2E39' : '#2962FF',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.2px',
          }}
        >
          {loading ? 'Redirecting to checkout...' : (
            selected?.trial
              ? `Start 7-Day Free Trial → ${selected.price}${selected.per} after`
              : `Subscribe ${selected?.price}${selected?.per}`
          )}
        </button>

        <div style={{ marginTop: 12, fontSize: 11, color: '#4C525E', textAlign: 'center' }}>
          Secured by Stripe · Cancel anytime from your account settings
        </div>
      </div>
    </div>
  )
}