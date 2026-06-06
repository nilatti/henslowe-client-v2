import { useNavigate } from '@tanstack/react-router'
import { TheaterForm } from './TheaterForm'
import { Card, PageHeader } from '../../../components/ui'

export function NewTheaterPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Theater" />
      <Card className="p-6">
        <TheaterForm
          onSuccess={id =>
            void navigate({
              to: id ? '/theaters/$theaterId' : '/theaters',
              params: id ? { theaterId: String(id) } : undefined,
            } as never)
          }
          onCancel={() => void navigate({ to: '/theaters' } as never)}
        />
      </Card>
    </div>
  )
}
