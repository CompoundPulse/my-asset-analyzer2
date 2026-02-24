import { useState } from 'react'
import { useAuth } from '../app/hooks/useAuth'
import PricingModal from './PricingModal'
import AuthModal from './AuthModal'

export default function SubscriptionGate({ children, featureName = 'this feature' }) {
  const { user, isActive, loading, isTrial, trialDaysLeft } = useAuth()
  const [showPricing, setShowPricing] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  if (loading) return (
    <div style={{
      backgroundColor: '#1E222D', border: '1px solid #2A2E39',
      borderRadius: 8, padding: 32, textAlign: 'center',
    }}>
      <div style={{ color: '#787B86', fontSize: 13 }}>Loading...</div>
    </div>
  )

  // Active subscriber or trial — show content
  if (isActive) {
    return (
      <>
        {/* Trial banner */}
        {isTrial && trialDaysLeft() > 0 && (
          <div style={{
            backgroundColor: 'rgba(41,98,255,0.08)',
            border: '1px solid rgba(41,98,255,0.2)',
            borderRadius: 6, padding: '8px 14px',
            marginBottom: 8, display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: '#7B9EFF' }}>
              🎯 Free trial · <strong>{trialDaysLeft()} day{trialDaysLeft() !== 1 ? 's' : ''}</strong> remaining
            </span>
            <button
              onClick={() => setShowPricing(true)}
              style={{
                fontSize: 11, color: '#2962FF', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Subscribe →
            </button>
          </div>
        )}
        {children}
        <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
      </>
    )
  }

  // Not subscribed — show paywall
  return (
    <>
      <div style={{
        backgroundColor: '#131722',
        border: '1px solid #2A2E39',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        {/* Blurred preview */}
        <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(19,23,34,0.3) 0%, rgba(19,23,34,0.95) 100%)',
            zIndex: 2,
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            filter: 'blur(4px)',
            opacity: 0.4,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #2A2E39 40px, #2A2E39 41px), repeating-linear-gradient(90deg, transparent, transparent 80px, #2A2E39 80px, #2A2E39 81px)',
          }} />

          {/* Lock content */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#D1D4DC', marginBottom: 6 }}>
              {featureName} is a Pro feature
            </div>
            <div style={{ fontSize: 13, color: '#787B86', marginBottom: 20, maxWidth: 320 }}>
              Get full access to all pattern detectors with a CompoundPulse subscription.
              Monthly & Annual plans include a 7-day free trial.
            </div>

            {!user ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowAuth(true)}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#2962FF', color: '#fff',
                    border: 'none', borderRadius: 8,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Sign Up Free
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#1E222D', color: '#D1D4DC',
                    border: '1px solid #2A2E39', borderRadius: 8,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPricing(true)}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#2962FF', color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Start 7-Day Free Trial
              </button>
            )}
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #2A2E39',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: '#4C525E' }}>
            Compound<span style={{ color: '#2962FF' }}>Pulse</span> Pro
          </span>
          <span style={{ fontSize: 12, color: '#787B86' }}>
            From $4.99/day · Cancel anytime
          </span>
        </div>
      </div>

      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => { setShowAuth(false); setShowPricing(true) }}
        initialMode="signup"
      />
    </>
  )
}