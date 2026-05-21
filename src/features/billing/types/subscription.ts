export interface UserSubscription {
  id: string
  name: string
  description: string | null
  subscription_id: string
  amount: number
  current_period_start: number
  current_period_end: number
  status: string
  cancel_at_period_end: boolean
  interval: string
  price_id: string
}

export interface StripePrice {
  id: string
  name: string
  description: string | null
  price: string
  amount: number
}
