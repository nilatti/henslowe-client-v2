import { Suspense, useEffect, useRef, useState } from 'react'
import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { usePageTitle } from '../../hooks/usePageTitle'
import { invitationQueryOptions, useAcceptInvitation } from '../../features/invitations/api/invitations'
import { stripePricesQueryOptions, redirectToCheckout } from '../../features/billing/api/billing'
import { LoadingSpinner, PageHeader, Card, Button } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const RETRY_INTERVAL_MS = 2000
const MAX_RETRIES = 8

type AcceptState =
  | 'attempting'
  | 'accepted'
  | 'payment_required_self'
  | 'payment_required_theater'
  | 'unavailable'
  | 'error'

export const Route = createFileRoute('/_public/invitations/$token')({
  loader: async ({ params, context: { queryClient } }) => {
    try {
      await queryClient.ensureQueryData(invitationQueryOptions(params.token))
    } catch {
      throw notFound()
    }
  },
  notFoundComponent: () => (
    <div className="max-w-xl mx-auto px-4 py-8">
      <p className="text-gray-600">This invitation link isn't valid, or it's already been used.</p>
    </div>
  ),
  component: InvitationAcceptRoute,
})

function InvitationAcceptRoute() {
  const { token } = Route.useParams()
  const { data: invitation } = useSuspenseQuery(invitationQueryOptions(token))
  const { isAuthenticated } = useAuth()
  const accept = useAcceptInvitation()
  const loginRedirected = useRef(false)
  const attempted = useRef(false)
  const [state, setState] = useState<AcceptState>(
    invitation.status === 'pending' ? 'attempting' : 'unavailable'
  )

  const orgName = invitation.theater?.name ?? 'the production'
  usePageTitle(`Accept invitation — ${orgName}`)

  const cameFromCheckout = new URLSearchParams(window.location.search).get('checkout') === 'return'

  async function attemptAccept(retriesLeft: number) {
    setState('attempting')
    try {
      await accept.mutateAsync(token)
      setState('accepted')
    } catch (err) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      const messages = Object.values(data ?? {}).flat()

      if (messages.includes('invitation_no_longer_available')) {
        setState('unavailable')
        return
      }
      if (messages.includes('theater_billing_not_configured')) {
        // Not something a short retry loop can resolve — the theater admin needs to set up billing separately.
        setState('payment_required_theater')
        return
      }
      if (messages.includes('payment_required')) {
        if (retriesLeft > 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS))
          return attemptAccept(retriesLeft - 1)
        }
        setState(invitation.payment_responsibility === 'self_pays' ? 'payment_required_self' : 'payment_required_theater')
        return
      }
      setState('error')
    }
  }

  useEffect(() => {
    if (!isAuthenticated && !loginRedirected.current) {
      loginRedirected.current = true
      localStorage.setItem('redirect_after_login', `/invitations/${token}`)
      window.location.href = `${VITE_API_URL}/auth/google_oauth2`
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    if (!isAuthenticated || attempted.current || invitation.status !== 'pending') return
    attempted.current = true
    void attemptAccept(cameFromCheckout ? MAX_RETRIES : 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, invitation.status])

  if (!isAuthenticated) return <LoadingSpinner />

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <PageHeader title={`Join ${orgName}`} />
      <Card className="p-6">
        <p className="text-sm text-gray-600 mb-4">
          {invitation.invited_by.first_name} {invitation.invited_by.last_name} invited you to join{' '}
          <strong>{orgName}</strong> as <strong>{invitation.specialization.title}</strong>.
        </p>

        {(state === 'attempting') && (
          <div className="py-4">
            <LoadingSpinner />
            {cameFromCheckout && (
              <p className="text-sm text-gray-500 text-center mt-2">Finishing setup…</p>
            )}
          </div>
        )}

        {state === 'accepted' && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-3">
            <p className="font-medium mb-2">You're in!</p>
            {invitation.theater && (
              <Link to="/theaters/$theaterId" params={{ theaterId: String(invitation.theater.id) }} className="underline">
                Go to {invitation.theater.name} →
              </Link>
            )}
            {invitation.production && (
              <Link to="/productions/$productionId" params={{ productionId: String(invitation.production.id) }} className="underline">
                Go to the production →
              </Link>
            )}
          </div>
        )}

        {state === 'payment_required_self' && (
          <Suspense fallback={<LoadingSpinner />}>
            <PaymentRequiredSelf token={token} />
          </Suspense>
        )}

        {state === 'payment_required_theater' && (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-3">
            <p className="font-medium mb-1">Billing isn't set up yet</p>
            <p>
              {orgName} is covering this role, but hasn't finished setting up billing.
              Check back soon, or contact them directly.
            </p>
          </div>
        )}

        {state === 'unavailable' && (
          <p className="text-sm text-gray-600">
            This invitation is no longer available — it may have expired, been revoked, or already been accepted.
          </p>
        )}

        {state === 'error' && (
          <p className="text-sm text-red-600">
            Something went wrong accepting this invitation. Please try again or contact {orgName}.
          </p>
        )}
      </Card>
    </div>
  )
}

function PaymentRequiredSelf({ token }: { token: string }) {
  const { data: prices } = useSuspenseQuery(stripePricesQueryOptions)
  const [redirecting, setRedirecting] = useState(false)
  const price = prices[0]

  async function handleSubscribe() {
    if (!price) return
    setRedirecting(true)
    await redirectToCheckout(price.price, `/invitations/${token}?checkout=return`)
  }

  return (
    <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-3">
      <p className="font-medium mb-1">Subscription required</p>
      <p className="mb-3">This role requires an active Henslowe subscription.</p>
      <Button onClick={handleSubscribe} disabled={redirecting || !price}>
        {redirecting ? 'Redirecting…' : 'Subscribe to accept'}
      </Button>
    </div>
  )
}
