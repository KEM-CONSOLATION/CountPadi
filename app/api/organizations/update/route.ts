import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    // Allow superadmin or tenant admin (for their own org)
    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isSuperAdmin = profile.role === 'superadmin'
    const isTenantAdmin = profile.role === 'admin' || profile.role === 'tenant_admin'

    if (!isSuperAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      organization_id,
      name,
      logo_url,
      brand_color,
      business_type,
      opening_time,
      closing_time,
      subdomain,
    } = body

    if (!organization_id || !name) {
      return NextResponse.json({ error: 'organization_id and name are required' }, { status: 400 })
    }

    // Tenant admin can only update their own organization
    if (isTenantAdmin && !isSuperAdmin) {
      if (profile.organization_id !== organization_id) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update your own organization' },
          { status: 403 }
        )
      }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Service role key not found' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const updateData: any = {
      name,
      slug,
      updated_at: new Date().toISOString(),
    }

    if (logo_url !== undefined) {
      updateData.logo_url = logo_url || null
    }

    if (brand_color !== undefined) {
      // Validate hex color format if provided
      if (brand_color && typeof brand_color === 'string') {
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
        if (!hexColorRegex.test(brand_color)) {
          return NextResponse.json(
            { error: 'Invalid brand color format. Must be a valid hex color (e.g., #3B82F6)' },
            { status: 400 }
          )
        }
        // Normalize to uppercase
        updateData.brand_color = brand_color.toUpperCase()
      } else {
        updateData.brand_color = null
      }
    }

    if (business_type !== undefined) {
      updateData.business_type = business_type || null
    }

    if (opening_time !== undefined) {
      // Validate time format (HH:MM:SS or HH:MM) - allow empty string to set to null
      if (opening_time && typeof opening_time === 'string' && opening_time.trim() !== '') {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:([0-5][0-9]))?$/
        if (!timeRegex.test(opening_time)) {
          return NextResponse.json(
            {
              error: 'Invalid opening time format. Use HH:MM:SS or HH:MM (e.g., 08:00:00 or 08:00)',
            },
            { status: 400 }
          )
        }
        // Normalize to HH:MM:SS format
        const parts = opening_time.split(':')
        updateData.opening_time = parts.length === 2 ? `${opening_time}:00` : opening_time
      } else {
        // Empty string or null means no automatic calculation - use on-demand
        updateData.opening_time = null
      }
    }

    if (closing_time !== undefined) {
      // Validate time format (HH:MM:SS or HH:MM) - allow empty string to set to null
      if (closing_time && typeof closing_time === 'string' && closing_time.trim() !== '') {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:([0-5][0-9]))?$/
        if (!timeRegex.test(closing_time)) {
          return NextResponse.json(
            {
              error: 'Invalid closing time format. Use HH:MM:SS or HH:MM (e.g., 22:00:00 or 22:00)',
            },
            { status: 400 }
          )
        }
        // Normalize to HH:MM:SS format
        const parts = closing_time.split(':')
        updateData.closing_time = parts.length === 2 ? `${closing_time}:00` : closing_time
      } else {
        // Empty string or null means no automatic calculation - use on-demand
        updateData.closing_time = null
      }
    }

    // Handle subdomain update
    if (subdomain !== undefined) {
      const reservedSubdomains = [
        'www',
        'api',
        'admin',
        'app',
        'mail',
        'ftp',
        'test',
        'staging',
        'dev',
        'blog',
        'support',
        'help',
        'docs',
        'status',
        'cdn',
        'assets',
        'static',
        'media',
      ]

      if (subdomain && subdomain.trim() !== '') {
        const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
        const cleanSubdomain = subdomain.toLowerCase().trim()

        if (!subdomainRegex.test(cleanSubdomain)) {
          return NextResponse.json(
            {
              error:
                'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only. Must start and end with alphanumeric characters.',
            },
            { status: 400 }
          )
        }

        if (reservedSubdomains.includes(cleanSubdomain)) {
          return NextResponse.json(
            { error: `Subdomain "${cleanSubdomain}" is reserved and cannot be used.` },
            { status: 400 }
          )
        }

        // Check if subdomain is taken by another organization
        const { data: existing } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .eq('subdomain', cleanSubdomain)
          .neq('id', organization_id)
          .single()

        if (existing) {
          return NextResponse.json({ error: 'Subdomain already taken' }, { status: 400 })
        }

        updateData.subdomain = cleanSubdomain
      } else {
        // Empty string means remove subdomain
        updateData.subdomain = null
      }
    }

    const { data: organization, error } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
      .eq('id', organization_id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Organization slug already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, organization })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update organization'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
