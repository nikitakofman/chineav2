import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function IncidentsLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold">
          <Skeleton className="h-8 w-32" />
        </h1>

        {/* Incidents Header - matching IncidentsHeader component */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-6 w-4 mx-2" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-4 w-80 mt-1" />
          </div>
        </div>

        {/* Search Filters and View Toggle - matching exact layout */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex w-full flex-col lg:flex-row gap-4">
            {/* Search Input with Icon */}
            <div className="flex-1 relative">
              {/* Search Icon */}
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              {/* Input field */}
              <Skeleton className="h-10 w-full bg-white rounded-md pl-10 pr-4" />
            </div>
            {/* Category Select */}
            <div className="w-full lg:w-[200px]">
              <Skeleton className="h-10 w-full bg-white rounded-md" />
            </div>
            {/* Date Range Picker */}
            <div className="w-full lg:w-[240px]">
              <Skeleton className="h-10 w-full bg-white rounded-md" />
            </div>
          </div>
          {/* View Toggle buttons */}
          <div className="flex justify-center sm:justify-end">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1">
              <Skeleton className="h-8 w-12 rounded" />
              <Skeleton className="h-8 w-12 rounded ml-1" />
            </div>
          </div>
        </div>

        {/* Table View Skeleton - matching IncidentsTable */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left"><Skeleton className="h-4 w-16" /></th>
                  <th className="p-4 text-left"><Skeleton className="h-4 w-12" /></th>
                  <th className="p-4 text-left"><Skeleton className="h-4 w-24" /></th>
                  <th className="p-4 text-left"><Skeleton className="h-4 w-20" /></th>
                  <th className="p-4 text-left"><Skeleton className="h-4 w-16" /></th>
                  <th className="p-4 text-left"><Skeleton className="h-4 w-16" /></th>
                  <th className="p-4 text-left"><Skeleton className="h-4 w-24" /></th>
                  <th className="p-4 text-right"><Skeleton className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div>
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        <div className="flex justify-center">
          <div className="flex gap-1">
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}