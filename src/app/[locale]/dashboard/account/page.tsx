import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AccountPageClient } from '@/components/account/account-page-client-simple'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connect')
  }

  return (
    <div className="p-4 md:p-6">
      <AccountPageClient user={user} />
    </div>
  )
}