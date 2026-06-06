import { createFileRoute } from '@tanstack/react-router'
import IndividualAccount from '../../features/billing/components/IndividualAccount'

export const Route = createFileRoute('/_authenticated/account')({
  component: IndividualAccount,
})
