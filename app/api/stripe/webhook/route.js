import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Required for Stripe webhooks in App Router
export const dynamic = 'force-dynamic'

const updateProfile = async (customerId, updates) => {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.warn('No profile found for customer:', customerId)
    return
  }

  await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', profile.id)
}

export async function POST(req) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription)
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null

          await updateProfile(session.customer, {
            subscription_status: subscription.status,
            subscription_tier: subscription.items.data[0]?.price?.recurring?.interval,
            trial_ends_at: trialEnd,
            subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        await updateProfile(subscription.customer, {
          subscription_status: subscription.status,
          subscription_tier: subscription.items.data[0]?.price?.recurring?.interval,
          trial_ends_at: trialEnd,
          subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await updateProfile(subscription.customer, {
          subscription_status: 'canceled',
          subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await updateProfile(invoice.customer, {
          subscription_status: 'past_due',
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}