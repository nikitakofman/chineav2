import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function SoldItemsLoading() {
  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold">
          <Skeleton className="h-8 w-32" />
        </h1>

        {/* Sold Header - matching SoldHeader component */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-6 w-4 mx-2" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
          <Skeleton className="h-10 w-32 self-end" />
        </div>

        {/* Search Filters and View Toggle - matching SearchFilters component exactly */}
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

        {/* Table View - matching SoldItemsGroupedTable */}
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2 w-[50px]"><Skeleton className="h-4 w-4" /></th>
                  <th className="p-2 text-left"><Skeleton className="h-4 w-12" /></th>
                  <th className="p-2 text-left"><Skeleton className="h-4 w-20" /></th>
                  <th className="p-2 text-left"><Skeleton className="h-4 w-20" /></th>
                  <th className="p-2 text-left"><Skeleton className="h-4 w-16" /></th>
                  <th className="p-2 text-left"><Skeleton className="h-4 w-12" /></th>
                  <th className="p-2 text-left"><Skeleton className="h-4 w-12" /></th>
                  <th className="p-2 text-right"><Skeleton className="h-4 w-20" /></th>
                  <th className="p-2 text-right"><Skeleton className="h-4 w-16" /></th>
                  <th className="p-2 text-left"><Skeleton className="h-4 w-16" /></th>
                  <th className="p-2 text-left"><Skeleton className="h-4 w-16" /></th>
                  <th className="p-2 text-right"><Skeleton className="h-4 w-20" /></th>
                  <th className="p-2 text-right"><Skeleton className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody>
                {/* Invoice Group 1 */}
                <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                  <td className="p-2"><Skeleton className="h-8 w-2 mx-auto rounded-full" /></td>
                  <td className="p-2"><Skeleton className="h-10 w-10 rounded" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-12" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-8" /></td>
                  <td className="p-2 text-right"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-2 text-right"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-2 text-right"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </td>
                </tr>
                <tr className="bg-blue-50/50 dark:bg-blue-950/20 border-b">
                  <td className="p-2"><Skeleton className="h-full w-2 mx-auto" /></td>
                  <td className="p-2"><Skeleton className="h-10 w-10 rounded" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-12" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-8" /></td>
                  <td className="p-2 text-right"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-2 text-right"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                </tr>
                {/* Invoice Group 2 */}
                <tr className="bg-gray-50/50 dark:bg-gray-950/20 border-b">
                  <td className="p-2"><Skeleton className="h-8 w-2 mx-auto rounded-full" /></td>
                  <td className="p-2"><Skeleton className="h-10 w-10 rounded" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-12" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-8" /></td>
                  <td className="p-2 text-right"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-2 text-right"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-2"></td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination - no visible pagination in sold items currently */}
      </div>
    </div>
  )
}