import { getBookTypes } from '@/app/actions/books'
import { DashboardHeaderClient } from './header-client'

export async function DashboardHeader() {
  const bookTypes = await getBookTypes()
  
  return <DashboardHeaderClient bookTypes={bookTypes} />
}