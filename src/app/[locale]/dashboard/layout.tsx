import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { BookProvider } from '@/contexts/book-context'
import { MobileSidebarProvider } from '@/contexts/mobile-sidebar-context'
import { checkUserBooks } from '@/app/actions/books'
import { getUnreadNotificationCount } from '@/app/actions/notifications'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connect')
  }

  // Get user's books
  const books = await checkUserBooks()
  
  // Get user's categories
  const categories = await prisma.category.findMany({
    where: {
      user_id: user.id
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Get unread notification count
  const unreadNotificationCount = await getUnreadNotificationCount()

  return (
    <BookProvider initialBooks={books}>
      <MobileSidebarProvider>
        <div className="min-h-screen bg-muted/30">
          <DashboardHeader unreadNotificationCount={unreadNotificationCount} />
          <div className="flex flex-1 h-[calc(100vh-73px)]">
            <DashboardSidebar categories={categories} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </MobileSidebarProvider>
    </BookProvider>
  )
}