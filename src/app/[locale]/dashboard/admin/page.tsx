import { AdminPageClient } from '@/components/admin/admin-page-client'
import { getUsers, getNotifications } from '@/app/actions/admin'

export default async function AdminPage() {
  const [users, notifications] = await Promise.all([
    getUsers(),
    getNotifications()
  ])

  return <AdminPageClient users={users} notifications={notifications} />
}