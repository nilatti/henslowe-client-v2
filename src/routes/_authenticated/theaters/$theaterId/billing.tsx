import { Suspense, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { theaterSkeletonQueryOptions, useCreateSeatSubscriptionCheckout } from '../../../../features/theaters/api/theaters'
import { stripePricesQueryOptions } from '../../../../features/billing/api/billing'
import { useUserRoleForTheater, useIsSuperAdmin } from '../../../../hooks/useUserRole'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import { PageHeader, Card, Button, LoadingSpinner } from '../../../../components/ui'

export const Route = createFileRoute('/_authenticated/theaters/$theaterId/billing')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(theaterSkeletonQueryOptions(Number(params.theaterId))),
  component: function TheaterBillingRoute() {
    const { theaterId } = Route.useParams()
    return <TheaterBilling theaterId={Number(theaterId)} />
  },
})

function TheaterBilling({ theaterId }: { theaterId: number }) {
  const { data: theater } = useSuspenseQuery(theaterSkeletonQueryOptions(theaterId))
  const role = useUserRoleForTheater(theaterId)
  const isSuperAdmin = useIsSuperAdmin()
  const isAdmin = role === 'admin' || isSuperAdmin
  usePageTitle(`${theater.name} — Billing`)

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-gray-600">Only theater admins can manage billing.</p>
      </div>
    )
  }

  const isActive = theater.subscription_status === 'active'

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <PageHeader title={`${theater.name} — Team billing`} />
      <Card className="p-6">
        <p className="text-sm text-gray-600 mb-4">
          Turning this on lets you send invitations where <strong>{theater.name}</strong> covers the
          subscription cost instead of the invitee, for both theater and production roles. The cost
          scales automatically with how many people you're currently sponsoring.
        </p>

        <div className={`rounded px-3 py-2 text-sm mb-4 border ${
          isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          Status: <strong>{isActive ? 'Active' : theater.subscription_status || 'Not set up'}</strong>
        </div>

        {!isActive && (
          <Suspense fallback={<LoadingSpinner />}>
            <SetupBillingButton theaterId={theaterId} />
          </Suspense>
        )}
      </Card>
    </div>
  )
}

function SetupBillingButton({ theaterId }: { theaterId: number }) {
  const { data: prices } = useSuspenseQuery(stripePricesQueryOptions)
  const checkout = useCreateSeatSubscriptionCheckout(theaterId)
  const [redirecting, setRedirecting] = useState(false)
  const price = prices[0]

  async function handleSetup() {
    if (!price) return
    setRedirecting(true)
    const { stripeUrl } = await checkout.mutateAsync(price.price)
    window.location.href = stripeUrl
  }

  return (
    <Button onClick={handleSetup} disabled={redirecting || !price}>
      {redirecting ? 'Redirecting…' : 'Set up team billing'}
    </Button>
  )
}
