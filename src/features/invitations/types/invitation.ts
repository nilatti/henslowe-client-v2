export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'
export type PaymentResponsibility = 'theater_pays' | 'self_pays'

export interface InvitationDetail {
  email: string
  status: InvitationStatus
  payment_responsibility: PaymentResponsibility
  expires_at: string
  specialization: { id: number; title: string }
  theater: { id: number; name: string } | null
  production: { id: number; start_date: string | null; end_date: string | null } | null
  invited_by: { id: number; first_name: string; last_name: string }
}

export interface CreateInvitationPayload {
  email: string
  specialization_id: number
  payment_responsibility: PaymentResponsibility
  theater_id?: number
  production_id?: number
}

export interface InvitationSummary {
  id: number
  email: string
  status: InvitationStatus
  payment_responsibility: PaymentResponsibility
  expires_at: string
  token: string
  specialization: { id: number; title: string }
}
