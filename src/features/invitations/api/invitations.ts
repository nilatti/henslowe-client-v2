import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { CreateInvitationPayload, InvitationDetail, InvitationSummary } from '../types/invitation'

export const invitationQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ['invitations', token],
    queryFn: (): Promise<InvitationDetail> =>
      api.get(`/api/v1/invitations/${token}`).then(r => r.data),
    retry: false,
  })

interface InvitationsScope {
  theaterId?: number
  productionId?: number
}

export const invitationsQueryOptions = ({ theaterId, productionId }: InvitationsScope) =>
  queryOptions({
    queryKey: ['invitations', { theaterId, productionId }],
    queryFn: (): Promise<InvitationSummary[]> =>
      api.get('/api/v1/invitations', {
        params: { theater_id: theaterId, production_id: productionId },
      }).then(r => r.data),
  })

export function useCreateInvitation(invalidateKey: unknown[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInvitationPayload): Promise<InvitationSummary> => {
      const path = data.theater_id
        ? `/api/v1/theaters/${data.theater_id}/invitations`
        : `/api/v1/productions/${data.production_id}/invitations`
      return api.post(path, { invitation: data }).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
    },
  })
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post(`/api/v1/invitations/${token}/accept`).then(r => r.data),
  })
}

export function useRevokeInvitation(invalidateKey: unknown[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => api.delete(`/api/v1/invitations/${token}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
    },
  })
}
