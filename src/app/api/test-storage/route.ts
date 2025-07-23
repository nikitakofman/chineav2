import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test if we can list files in the uploads bucket
    const { data, error } = await supabase.storage
      .from('uploads')
      .list('', {
        limit: 1
      })

    if (error) {
      console.error('Storage test error:', error)
      return NextResponse.json({ 
        error: 'Storage access failed', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Storage access works',
      user: user.email,
      bucketAccess: true
    })
  } catch (error) {
    console.error('Test storage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}