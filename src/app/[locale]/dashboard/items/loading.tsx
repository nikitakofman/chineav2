import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function ItemsLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        {/* Items Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-6 w-4 mx-2" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
          <Skeleton className="h-10 w-32 self-end" />
        </div>

        {/* Search Filters and View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex w-full flex-col lg:flex-row gap-4">
              {/* Search Input with Icon - matching SearchFilters component exactly */}
              <div className="flex-1 relative">
                {/* Search Icon */}
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                {/* Input field */}
                <Skeleton className="h-10 w-full bg-white rounded-md pl-10 pr-4" />
              </div>
              {/* Category Select with trigger styling */}
              <div className="w-full lg:w-[200px]">
                <Skeleton className="h-10 w-full bg-white rounded-md" />
              </div>
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

        {/* Results Count */}
        <div>
          <Skeleton className="h-4 w-48 mb-4" />
          
          {/* Table View Skeleton - matching ItemsTable columns */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left">
                      {/* Image */}
                      <Skeleton className="h-4 w-12" />
                    </th>
                    <th className="p-4 text-left">
                      {/* Item Number */}
                      <Skeleton className="h-4 w-24" />
                    </th>
                    <th className="p-4 text-left">
                      {/* Description */}
                      <Skeleton className="h-4 w-24" />
                    </th>
                    <th className="p-4 text-left">
                      {/* Category */}
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="p-4 text-left">
                      {/* Purchase Price */}
                      <Skeleton className="h-4 w-28" />
                    </th>
                    <th className="p-4 text-left">
                      {/* Location */}
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="p-4 text-left">
                      {/* Created At */}
                      <Skeleton className="h-4 w-24" />
                    </th>
                    <th className="p-4 text-right">
                      {/* Actions */}
                      <Skeleton className="h-4 w-16" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(10)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-4">
                        <Skeleton className="h-10 w-10 rounded" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-24" />
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
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20" />
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
        </div>

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