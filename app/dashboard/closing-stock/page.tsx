import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/DashboardLayout'
import DailyStockReport from '@/components/DailyStockReport'

export default async function ClosingStockPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profileError) {
    await supabase.auth.signOut()
    redirect('/login?error=unauthorized')
  }

  return (
    <DashboardLayout user={profile}>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Closing Stock</h1>
          <p className="mt-2 text-gray-600">Automatically calculated: Opening Stock - Total Sales</p>
        </div>

        <DailyStockReport type="closing" />
      </div>
    </DashboardLayout>
  )
}

