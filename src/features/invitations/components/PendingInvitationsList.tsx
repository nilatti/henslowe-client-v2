import { useQuery } from '@tanstack/react-query'
import { invitationsQueryOptions, useRevokeInvitation } from '../api/invitations'
import { Card, Button, ConfirmDialog } from '../../../components/ui'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'

interface PendingInvitationsListProps {
  productionId?: number
  theaterId?: number
}

export function PendingInvitationsList({ productionId, theaterId }: PendingInvitationsListProps) {
  const invalidateKey = ['invitations', { theaterId, productionId }]
  const { data: invitations } = useQuery(invitationsQueryOptions({ theaterId, productionId }))
  const revoke = useRevokeInvitation(invalidateKey)
  const { target: confirmToken, open: requestRevoke, close: clearRevoke } = useConfirmDelete<string>()

  const pending = (invitations ?? []).filter(i => i.status === 'pending')
  if (pending.length === 0) return null

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Pending invitations</h3>
      <Card>
        <ul className="divide-y divide-gray-100">
          {pending.map(invitation => (
            <li key={invitation.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <span className="font-medium text-gray-900">{invitation.specialization.title}</span>
                <span className="text-gray-500 ml-2">{invitation.email}</span>
              </div>
              <Button variant="danger" onClick={() => requestRevoke(invitation.token)}>
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      {confirmToken !== null && (
        <ConfirmDialog
          message="Revoke this invitation?"
          isDestructive
          confirmLabel="Revoke"
          onConfirm={async () => {
            await revoke.mutateAsync(confirmToken)
            clearRevoke()
          }}
          onCancel={clearRevoke}
        />
      )}
    </div>
  )
}
