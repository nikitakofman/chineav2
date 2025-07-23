import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all subscriptions for this user
    const subscriptions = await prisma.subscriptions.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email
      },
      subscriptions: subscriptions.map(sub => ({
        ...sub,
        created_at: sub.created_at?.toISOString(),
        updated_at: sub.updated_at?.toISOString(),
        current_period_start: sub.current_period_start?.toISOString(),
        current_period_end: sub.current_period_end?.toISOString(),
        cancel_at: sub.cancel_at?.toISOString(),
        canceled_at: sub.canceled_at?.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching debug info:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}