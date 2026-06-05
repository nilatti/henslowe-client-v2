import { createFileRoute, redirect } from '@tanstack/react-router'
import { CreateUserForm } from '../../../features/users/components/CreateUserForm'
import { Card, PageHeader } from '../../../components/ui'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/_authenticated/users/new')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.user?.is_superadmin) {
      throw redirect({ to: '/' })
    }
  },
  component: () => (
    <div>
      <PageHeader title="Add person" />
      <Card className="p-6 max-w-3xl">
        <CreateUserForm />
      </Card>
    </div>
  ),
})
