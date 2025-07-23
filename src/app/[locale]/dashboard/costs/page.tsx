import { getTranslations } from 'next-intl/server'
import { getCostsEventTypes, getCostsWithEventTypes } from '@/app/actions/costs'
import { getSelectedBookId } from '@/app/actions/books'
import { CostsPageClient } from '@/components/costs/costs-page-client'
import { redirect } from 'next/navigation'

export default async function CostsPage() {
  const t = await getTranslations()
  
  // Get selected book ID from cookie
  const selectedBookId = await getSelectedBookId()
  
  if (!selectedBookId) {
    redirect('/books/setup')
  }
  
  const costEventTypes = await getCostsEventTypes()
  const costs = await getCostsWithEventTypes(selectedBookId)

  return (
    <div className="p-4 md:p-6">
      <CostsPageClient 
        costEventTypes={costEventTypes}
        initialCosts={costs}
      />
    </div>
  )
}