import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const branch_id = searchParams.get('branch_id') // optional filter
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Get profile for org and branch permissions
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, branch_id, role')
      .eq('id', user_id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User is not linked to an organization' }, { status: 400 })
    }

    if (profile.role === 'superadmin') {
      return NextResponse.json({ error: 'Superadmins cannot view transfers' }, { status: 403 })
    }

    const organizationId = profile.organization_id
    const effectiveBranchId =
      profile.role === 'admin' && !profile.branch_id ? null : profile.branch_id || null

    let query = supabaseAdmin
      .from('branch_transfers')
      .select(
        `
        *,
        item:items(*),
        from_branch:branches!branch_transfers_from_branch_id_fkey(*),
        to_branch:branches!branch_transfers_to_branch_id_fkey(*),
        performed_by_profile:profiles(*)
      `
      )
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)

    if (from_date) {
      query = query.gte('date', from_date)
    }
    if (to_date) {
      query = query.lte('date', to_date)
    }

    // Branch filter: tenant admin can see all; branch users see only transfers involving their branch
    if (effectiveBranchId) {
      query = query.or(
        `from_branch_id.eq.${effectiveBranchId},to_branch_id.eq.${effectiveBranchId}`,
        { foreignTable: 'branch_transfers' }
      )
    } else if (branch_id) {
      query = query.or(`from_branch_id.eq.${branch_id},to_branch_id.eq.${branch_id}`, {
        foreignTable: 'branch_transfers',
      })
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, transfers: data || [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list transfers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

