import { createFileRoute } from '@tanstack/react-router'
import IndividualAccount from '../../features/billing/components/IndividualAccount'
import { usePageTitle } from '../../hooks/usePageTitle'

export const Route = createFileRoute('/_authenticated/account')({
  component: function AccountRoute() {
    usePageTitle('Account')
    return <IndividualAccount />
  },
})
