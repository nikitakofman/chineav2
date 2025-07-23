import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon?: React.ReactNode
  iconBackground?: string
  iconColor?: string
}

export function StatsCard({ 
  value, 
  subtitle, 
  icon, 
  iconBackground = 'bg-primary/10',
  iconColor = 'text-primary'
}: StatsCardProps) {
  return (
    <Card className="p-6 border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {icon && (
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBackground)}>
            <div className={cn("w-6 h-6", iconColor)}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}