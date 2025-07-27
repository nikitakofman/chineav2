import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {/* Main Revenue Card Skeleton */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>

        {/* Stats Cards Skeletons */}
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-12 mt-1" />
            </CardContent>
          </Card>
        ))}

        {/* Chart Skeleton */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>

        {/* Quick Actions Skeleton */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Skeleton */}
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              <div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}