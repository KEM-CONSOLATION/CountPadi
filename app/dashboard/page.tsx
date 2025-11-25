import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/DashboardLayout'
import OpeningStockForm from '@/components/OpeningStockForm'
import ClosingStockForm from '@/components/ClosingStockForm'
import SalesForm from '@/components/SalesForm'

export default async function DashboardPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Record your daily inventory activities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <OpeningStockForm />
          </div>
          <div className="lg:col-span-1">
            <ClosingStockForm />
          </div>
          <div className="lg:col-span-1">
            <SalesForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

