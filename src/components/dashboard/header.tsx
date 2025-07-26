import { getBookTypes } from '@/app/actions/books'
import { DashboardHeaderClient } from './header-client'

interface DashboardHeaderProps {
  unreadNotificationCount: number
}

export async function DashboardHeader({ unreadNotificationCount }: DashboardHeaderProps) {
  const bookTypes = await getBookTypes()
  
  return <DashboardHeaderClient bookTypes={bookTypes} unreadNotificationCount={unreadNotificationCount} />
}