import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { specializationsQueryOptions } from '../../specializations/queries'
import { useCreateInvitation } from '../../invitations/api/invitations'
import type { PaymentResponsibility } from '../../invitations/types/invitation'
import { FormField, FormActions, inputClass } from '../../../components/ui'

interface InviteFormProps {
  productionId?: number
  theaterId?: number
  invalidateKey: unknown[]
  onSuccess: () => void
  onCancel: () => void
}

export function InviteForm({ productionId, theaterId, invalidateKey, onSuccess, onCancel }: InviteFormProps) {
  const { data: specializations } = useSuspenseQuery(specializationsQueryOptions())
  const invitableSpecializations = specializations
    .filter(s => s.title !== 'Actor' && s.title !== 'Auditioner')
    .sort((a, b) => a.title.localeCompare(b.title))

  const create = useCreateInvitation(invalidateKey)
  const [email, setEmail] = useState('')
  const [specializationId, setSpecializationId] = useState(0)
  const [paymentResponsibility, setPaymentResponsibility] = useState<PaymentResponsibility>('self_pays')
  const [error, setError] = useState<string | null>(null)

  // All non-Actor/Auditioner specializations currently require payment (see Job#user_must_be_subscribed_for_paid_role).
  const requiresPayment = specializationId > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !specializationId) return
    try {
      await create.mutateAsync({
        email,
        specialization_id: specializationId,
        payment_responsibility: requiresPayment ? paymentResponsibility : 'self_pays',
        theater_id: theaterId,
        production_id: productionId,
      })
      onSuccess()
    } catch {
      setError('Could not send that invitation. Check the email and role and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Email" required>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
          placeholder="person@example.com"
        />
      </FormField>

      <FormField label="Role" required>
        <select
          value={specializationId}
          onChange={e => setSpecializationId(Number(e.target.value))}
          className={inputClass}
        >
          <option value={0}>Select role</option>
          {invitableSpecializations.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </FormField>

      {requiresPayment && (
        <FormField label="Who pays for their subscription?">
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={paymentResponsibility === 'self_pays'}
                onChange={() => setPaymentResponsibility('self_pays')}
              />
              They subscribe themselves
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={paymentResponsibility === 'theater_pays'}
                onChange={() => setPaymentResponsibility('theater_pays')}
              />
              The theater covers it
            </label>
          </div>
        </FormField>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <FormActions
        isSubmitting={create.isPending}
        isEditing={false}
        onCancel={onCancel}
        submitLabel="Send invitation"
        submitDisabled={!email || !specializationId}
      />
    </form>
  )
}
