import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/DashboardLayout'
import BranchManagement from '@/components/BranchManagement'

export default async function BranchesPage() {
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

  // Only admins (tenant_admin) can access branches page
  // Branch managers manage their branch operations but cannot create/manage branches
  if (profile.role !== 'admin' && profile.role !== 'tenant_admin') {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout user={profile}>
      <div className="p-6">
        <BranchManagement />
      </div>
    </DashboardLayout>
  )
}
