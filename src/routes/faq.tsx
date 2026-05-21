import { createFileRoute } from '@tanstack/react-router'
import FrequentlyAskedQuestions from '../features/info/components/FrequentlyAskedQuestions'

export const Route = createFileRoute('/faq')({
  component: FrequentlyAskedQuestions,
})
