import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const organization_id = searchParams.get('organization_id')
    const branch_id = searchParams.get('branch_id')

    let query = supabaseAdmin.from('sales').select('*').order('created_at', { ascending: false })

    if (date) {
      query = query.eq('date', date)
    }

    if (organization_id) {
      query = query.eq('organization_id', organization_id)
    }

    // Handle branch_id filtering
    // For organizations created before branches, we need to check both:
    // 1. Sales with the selected branch_id
    // 2. Sales with NULL branch_id (legacy records)
    // This ensures we don't lose historical data
    if (branch_id) {
      // Use .or() to include both branch-specific and NULL branch_id records
      query = query.or(`branch_id.eq.${branch_id},branch_id.is.null`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sales: data || [],
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
