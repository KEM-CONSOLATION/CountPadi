import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const body = await request.json()
    const { sale_id, item_id, quantity, price_per_unit, total_price, date, description, old_quantity } = body

    if (!sale_id || !item_id || !quantity || !date || old_quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current item quantity
    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('quantity')
      .eq('id', item_id)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Calculate the difference: restore old quantity, then subtract new quantity
    const quantityDiff = parseFloat(quantity) - parseFloat(old_quantity)
    const newQuantity = item.quantity - quantityDiff

    // Validate new quantity doesn't go negative
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: `Cannot update. Available stock after adjustment: ${item.quantity + parseFloat(old_quantity)}` },
        { status: 400 }
      )
    }

    // Update sale record
    const { error: saleError } = await supabaseAdmin
      .from('sales')
      .update({
        item_id,
        quantity: parseFloat(quantity),
        price_per_unit: parseFloat(price_per_unit) || 0,
        total_price: parseFloat(total_price) || 0,
        date,
        description: description || null,
      })
      .eq('id', sale_id)

    if (saleError) {
      return NextResponse.json({ error: saleError.message }, { status: 500 })
    }

    // Update item quantity
    const { error: updateError } = await supabaseAdmin
      .from('items')
      .update({ quantity: newQuantity })
      .eq('id', item_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update item quantity' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updatedQuantity: newQuantity })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update sales'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

