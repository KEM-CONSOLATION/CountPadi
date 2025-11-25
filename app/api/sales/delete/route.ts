import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { searchParams } = new URL(request.url)
    const sale_id = searchParams.get('sale_id')
    const item_id = searchParams.get('item_id')
    const quantity = searchParams.get('quantity')

    if (!sale_id || !item_id || !quantity) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
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

    // Delete sale record
    const { error: deleteError } = await supabaseAdmin
      .from('sales')
      .delete()
      .eq('id', sale_id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Restore item quantity (add back the deleted sale quantity)
    const newQuantity = item.quantity + parseFloat(quantity)
    const { error: updateError } = await supabaseAdmin
      .from('items')
      .update({ quantity: newQuantity })
      .eq('id', item_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update item quantity' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updatedQuantity: newQuantity })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete sales'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

