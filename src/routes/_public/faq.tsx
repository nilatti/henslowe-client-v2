import { createFileRoute } from '@tanstack/react-router'
import FrequentlyAskedQuestions from '../../features/info/components/FrequentlyAskedQuestions'
import { usePageTitle } from '../../hooks/usePageTitle'

export const Route = createFileRoute('/_public/faq')({
  component: function FaqRoute() {
    usePageTitle('FAQ')
    return <FrequentlyAskedQuestions />
  },
})
