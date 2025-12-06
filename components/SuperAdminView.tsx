'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Organization, Profile } from '@/types/database'

interface OrganizationMetrics {
  total_items: number
  total_sales: number
  total_revenue: number
  total_users: number
  total_expenses: number
}

interface OrganizationWithStaff extends Organization {
  user_count?: number
  created_by_profile?: Profile
  metrics?: OrganizationMetrics
  staff?: Profile[]
  admins?: Profile[]
}

export default function SuperAdminView() {
  const [organizations, setOrganizations] = useState<OrganizationWithStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newOrg, setNewOrg] = useState({ name: '', adminEmail: '', adminPassword: '', adminName: '' })
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          created_by_profile:profiles!organizations_created_by_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const orgsWithData = await Promise.all(
        (data || []).map(async (org) => {
          const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)

          const { count: itemCount } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)

          const { count: saleCount, data: salesData } = await supabase
            .from('sales')
            .select('total_price')
            .eq('organization_id', org.id)

          const { count: expenseCount, data: expensesData } = await supabase
            .from('expenses')
            .select('amount')
            .eq('organization_id', org.id)

          const totalRevenue = salesData?.reduce((sum, sale) => sum + (parseFloat(sale.total_price?.toString() || '0') || 0), 0) || 0
          const totalExpenses = expensesData?.reduce((sum, exp) => sum + (parseFloat(exp.amount?.toString() || '0') || 0), 0) || 0

          const { data: allUsers } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', org.id)
            .order('role', { ascending: false })
            .order('created_at', { ascending: false })

          const admins = allUsers?.filter(u => u.role === 'admin') || []
          const staff = allUsers?.filter(u => u.role === 'staff') || []

          return {
            ...org,
            user_count: userCount || 0,
            metrics: {
              total_items: itemCount || 0,
              total_sales: saleCount || 0,
              total_revenue: totalRevenue,
              total_users: userCount || 0,
              total_expenses: totalExpenses,
            },
            admins,
            staff,
          }
        })
      )

      setOrganizations(orgsWithData)
    } catch (error) {
      console.error('Error fetching organizations:', error)
      setMessage({ type: 'error', text: 'Failed to fetch organizations' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrg.name,
          user_id: user.id,
        }),
      })

      const orgData = await response.json()
      if (!response.ok) throw new Error(orgData.error || 'Failed to create organization')

      if (newOrg.adminEmail && newOrg.adminPassword) {
        const adminResponse = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newOrg.adminEmail,
            password: newOrg.adminPassword,
            fullName: newOrg.adminName || null,
            role: 'admin',
            organization_id: orgData.organization.id,
          }),
        })

        const adminData = await adminResponse.json()
        if (!adminResponse.ok) {
          throw new Error(`Organization created but admin creation failed: ${adminData.error}`)
        }
      }

      setMessage({ type: 'success', text: 'Organization and admin created successfully' })
      setNewOrg({ name: '', adminEmail: '', adminPassword: '', adminName: '' })
      setShowCreateOrg(false)
      fetchOrganizations()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create organization' 
      })
    } finally {
      setCreating(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrg) return

    setCreating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newOrg.adminEmail,
          password: newOrg.adminPassword,
          fullName: newOrg.adminName || null,
          role: 'admin',
          organization_id: selectedOrg,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create admin')

      setMessage({ type: 'success', text: 'Admin created successfully' })
      setNewOrg({ name: '', adminEmail: '', adminPassword: '', adminName: '' })
      setShowCreateAdmin(false)
      setSelectedOrg(null)
      fetchOrganizations()
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create admin' 
      })
    } finally {
      setCreating(false)
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          new_password: newPassword,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to reset password')

      setMessage({ type: 'success', text: 'Password reset successfully' })
      setNewPassword('')
      setResettingPassword(null)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to reset password' 
      })
    } finally {
      setCreating(false)
    }
  }

  const toggleOrgExpansion = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs)
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId)
    } else {
      newExpanded.add(orgId)
    }
    setExpandedOrgs(newExpanded)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-500">Loading organizations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Super Admin Dashboard</h1>
        <p className="text-red-100">System-wide overview and organization management</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Organizations</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{organizations.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {organizations.reduce((sum, org) => sum + (org.user_count || 0), 0)}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue (All Orgs)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ₦{organizations.reduce((sum, org) => sum + (org.metrics?.total_revenue || 0), 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => {
            setShowCreateOrg(true)
            setShowCreateAdmin(false)
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Organization
        </button>
        <button
          onClick={() => {
            setShowCreateAdmin(true)
            setShowCreateOrg(false)
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Create Organization Admin
        </button>
      </div>

      {showCreateOrg && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Organization</h2>
          <form onSubmit={handleCreateOrganization} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={newOrg.name}
                onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email (Optional)</label>
              <input
                type="email"
                value={newOrg.adminEmail}
                onChange={(e) => setNewOrg({ ...newOrg, adminEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>
            {newOrg.adminEmail && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
                  <input
                    type="password"
                    value={newOrg.adminPassword}
                    onChange={(e) => setNewOrg({ ...newOrg, adminPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    minLength={6}
                    required={!!newOrg.adminEmail}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Full Name (Optional)</label>
                  <input
                    type="text"
                    value={newOrg.adminName}
                    onChange={(e) => setNewOrg({ ...newOrg, adminName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Organization'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateOrg(false)
                  setNewOrg({ name: '', adminEmail: '', adminPassword: '', adminName: '' })
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showCreateAdmin && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Organization Admin</h2>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <select
                value={selectedOrg || ''}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Select organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
              <input
                type="email"
                value={newOrg.adminEmail}
                onChange={(e) => setNewOrg({ ...newOrg, adminEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
              <input
                type="password"
                value={newOrg.adminPassword}
                onChange={(e) => setNewOrg({ ...newOrg, adminPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Full Name (Optional)</label>
              <input
                type="text"
                value={newOrg.adminName}
                onChange={(e) => setNewOrg({ ...newOrg, adminName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !selectedOrg}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Admin'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateAdmin(false)
                  setSelectedOrg(null)
                  setNewOrg({ name: '', adminEmail: '', adminPassword: '', adminName: '' })
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Organizations</h2>
        
        {organizations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No organizations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleOrgExpansion(org.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                      <div className="flex gap-6 mt-2 text-sm text-gray-600">
                        <span>Users: {org.metrics?.total_users || 0}</span>
                        <span>Items: {org.metrics?.total_items || 0}</span>
                        <span>Sales: {org.metrics?.total_sales || 0}</span>
                        <span>Revenue: ₦{(org.metrics?.total_revenue || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span>Expenses: ₦{(org.metrics?.total_expenses || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {expandedOrgs.has(org.id) ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedOrgs.has(org.id) && (
                  <div className="px-6 py-4 bg-white border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          Admins ({org.admins?.length || 0})
                        </h4>
                        {org.admins && org.admins.length > 0 ? (
                          <div className="space-y-2">
                            {org.admins.map((admin) => (
                              <div key={admin.id} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{admin.email}</p>
                                  {admin.full_name && (
                                    <p className="text-xs text-gray-500">{admin.full_name}</p>
                                  )}
                                </div>
                                <PasswordResetButton
                                  userId={admin.id}
                                  userEmail={admin.email}
                                  resettingPassword={resettingPassword}
                                  setResettingPassword={setResettingPassword}
                                  newPassword={newPassword}
                                  setNewPassword={setNewPassword}
                                  onResetPassword={handleResetPassword}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No admins</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Staff ({org.staff?.length || 0})
                        </h4>
                        {org.staff && org.staff.length > 0 ? (
                          <div className="space-y-2">
                            {org.staff.map((staff) => (
                              <div key={staff.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{staff.email}</p>
                                  {staff.full_name && (
                                    <p className="text-xs text-gray-500">{staff.full_name}</p>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(staff.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No staff</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PasswordResetButton({
  userId,
  userEmail,
  resettingPassword,
  setResettingPassword,
  newPassword,
  setNewPassword,
  onResetPassword,
}: {
  userId: string
  userEmail: string
  resettingPassword: string | null
  setResettingPassword: (id: string | null) => void
  newPassword: string
  setNewPassword: (pwd: string) => void
  onResetPassword: (userId: string) => Promise<void>
}) {
  if (resettingPassword === userId) {
    return (
      <div className="flex gap-1 items-center">
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          className="w-32 px-2 py-1 border border-gray-300 rounded text-xs"
          minLength={6}
        />
        <button
          onClick={() => onResetPassword(userId)}
          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
        >
          Save
        </button>
        <button
          onClick={() => {
            setResettingPassword(null)
            setNewPassword('')
          }}
          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setResettingPassword(userId)}
      className="text-xs text-red-600 hover:text-red-900 px-2 py-1 hover:bg-red-50 rounded"
    >
      Reset Password
    </button>
  )
}
