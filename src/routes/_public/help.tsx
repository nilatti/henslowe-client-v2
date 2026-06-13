import { createFileRoute } from '@tanstack/react-router'
import Help from '../../features/info/components/Help'
import { usePageTitle } from '../../hooks/usePageTitle'

export const Route = createFileRoute('/_public/help')({
  component: function HelpRoute() {
    usePageTitle('Help')
    return <Help />
  },
})
