import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const body = await request.json()
    const { item_id, quantity, price_per_unit, total_price, date, description, user_id } = body

    if (!item_id || !quantity || !date || !user_id) {
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

    // Validate quantity doesn't exceed available stock
    if (parseFloat(quantity) > item.quantity) {
      return NextResponse.json(
        { error: `Cannot record sales of ${quantity}. Available stock: ${item.quantity}` },
        { status: 400 }
      )
    }

    // Create sale record
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
        item_id,
        quantity: parseFloat(quantity),
        price_per_unit: parseFloat(price_per_unit) || 0,
        total_price: parseFloat(total_price) || 0,
        date,
        recorded_by: user_id,
        description: description || null,
      })
      .select()
      .single()

    if (saleError) {
      return NextResponse.json({ error: saleError.message }, { status: 500 })
    }

    // Update item quantity (subtract sold quantity)
    const newQuantity = item.quantity - parseFloat(quantity)
    const { error: updateError } = await supabaseAdmin
      .from('items')
      .update({ quantity: newQuantity })
      .eq('id', item_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update item quantity' }, { status: 500 })
    }

    return NextResponse.json({ success: true, sale, updatedQuantity: newQuantity })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to record sales'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

