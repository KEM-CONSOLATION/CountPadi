import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const subdomain = request.nextUrl.searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Supabase env vars missing' },
        { status: 500 }
      )
    }

    // Use service role to bypass RLS for this lookup
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const cleanSubdomain = subdomain.toLowerCase().trim()

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('id, name, logo_url, brand_color, subdomain')
      .eq('subdomain', cleanSubdomain)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No organization found - subdomain not set or doesn't exist
        console.log(`No organization found for subdomain: "${cleanSubdomain}"`)
        return NextResponse.json({ organization: null }, { status: 200 })
      }
      console.error('Error fetching organization by subdomain:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!organization) {
      console.log(`Organization not found for subdomain: "${cleanSubdomain}"`)
      return NextResponse.json({ organization: null }, { status: 200 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organization'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

