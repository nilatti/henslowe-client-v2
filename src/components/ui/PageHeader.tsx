interface PageHeaderProps {
  title: React.ReactNode
  action?: React.ReactNode
}
export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  )
}
