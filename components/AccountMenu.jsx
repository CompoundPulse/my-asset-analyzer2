import { useState } from 'react'
import { useAuth } from '../app/hooks/useAuth'
import PricingModal from './PricingModal'
import AuthModal from './AuthModal'

export default function AccountMenu() {
  const { user, profile, isActive, isTrial, trialDaysLeft, signOut } = useAuth()
  const [showPricing, setShowPricing] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const { url, error } = await res.json()
      if (url) window.location.href = url
      else alert(error || 'Something went wrong')
    } catch (e) {
      alert('Failed to open billing portal')
    }
    setPortalLoading(false)
  }

  if (!user) {
    return (
      <>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowAuth(true)}
            style={{
              padding: '7px 16px',
              backgroundColor: 'transparent',
              color: '#D1D4DC', border: '1px solid #2A2E39',
              borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setShowAuth(true)}
            style={{
              padding: '7px 16px',
              backgroundColor: '#2962FF',
              color: '#fff', border: 'none',
              borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Get Access
          </button>
        </div>
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
          initialMode="signup"
        />
      </>
    )
  }

  const statusColor = isActive ? '#26A69A' : '#EF5350'
  const statusLabel = isTrial
    ? `Trial · ${trialDaysLeft()}d left`
    : isActive ? 'Pro' : 'Free'

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            backgroundColor: '#1E222D', border: '1px solid #2A2E39',
            borderRadius: 8, cursor: 'pointer',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            backgroundColor: '#2962FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user.email?.[0]?.toUpperCase()}
          </div>
          {/* Status dot */}
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: statusColor, flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: '#D1D4DC', fontWeight: 600 }}>
            {statusLabel}
          </span>
          <span style={{ fontSize: 10, color: '#4C525E' }}>▾</span>
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: '110%',
            backgroundColor: '#1E222D', border: '1px solid #2A2E39',
            borderRadius: 8, minWidth: 220,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 500, overflow: 'hidden',
          }}>
            {/* User info */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #2A2E39' }}>
              <div style={{ fontSize: 12, color: '#D1D4DC', fontWeight: 600 }}>
                {user.email}
              </div>
              <div style={{ fontSize: 11, color: statusColor, marginTop: 3 }}>
                {isActive ? (isTrial ? `Free trial · ${trialDaysLeft()} days left` : 'Pro subscriber') : 'No active subscription'}
              </div>
            </div>

            {/* Menu items */}
            {!isActive && (
              <MenuItem
                onClick={() => { setShowPricing(true); setMenuOpen(false) }}
                label="⚡ Upgrade to Pro"
                color="#2962FF"
              />
            )}
            {isActive && (
              <MenuItem
                onClick={() => { handleManageSubscription(); setMenuOpen(false) }}
                label={portalLoading ? 'Loading...' : '💳 Manage Subscription'}
                sublabel="Cancel, update payment"
              />
            )}
            {!isActive && (
              <MenuItem
                onClick={() => { setShowPricing(true); setMenuOpen(false) }}
                label="💳 Billing"
              />
            )}
            <div style={{ borderTop: '1px solid #2A2E39' }}>
              <MenuItem
                onClick={() => { signOut(); setMenuOpen(false) }}
                label="Sign Out"
                color="#EF5350"
              />
            </div>
          </div>
        )}
      </div>

      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
    </>
  )
}

function MenuItem({ onClick, label, sublabel, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '10px 16px',
        backgroundColor: 'transparent', border: 'none',
        textAlign: 'left', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2A2E39'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={{ fontSize: 13, color: color || '#D1D4DC', fontWeight: 500 }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ fontSize: 11, color: '#4C525E' }}>{sublabel}</span>
      )}
    </button>
  )
}