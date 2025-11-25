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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get all items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('items')
      .select('*')
      .order('name')

    if (itemsError || !items) {
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    // Calculate previous date
    const prevDate = new Date(date)
    prevDate.setDate(prevDate.getDate() - 1)
    const prevDateStr = prevDate.toISOString().split('T')[0]

    // Get previous day's closing stock
    const { data: prevClosingStock } = await supabaseAdmin
      .from('closing_stock')
      .select('item_id, quantity')
      .eq('date', prevDateStr)

    // Get today's sales
    const { data: todaySales } = await supabaseAdmin
      .from('sales')
      .select('item_id, quantity')
      .eq('date', date)

    // Calculate opening and closing stock for each item
    const report = items.map((item) => {
      // Opening stock = previous day's closing stock, or item's current quantity if no closing stock
      const prevClosing = prevClosingStock?.find((cs) => cs.item_id === item.id)
      const openingStock = prevClosing ? prevClosing.quantity : item.quantity

      // Calculate total sales for today
      const itemSales = todaySales?.filter((s) => s.item_id === item.id) || []
      const totalSales = itemSales.reduce((sum, s) => sum + parseFloat(s.quantity.toString()), 0)

      // Closing stock = opening stock - sales
      const closingStock = Math.max(0, openingStock - totalSales)

      return {
        item_id: item.id,
        item_name: item.name,
        item_unit: item.unit,
        current_quantity: item.quantity,
        opening_stock: openingStock,
        sales: totalSales,
        closing_stock: closingStock,
      }
    })

    return NextResponse.json({ success: true, date, report })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate report'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

