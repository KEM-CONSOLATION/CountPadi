'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { useBranchStore } from '@/lib/stores/branchStore'
import { useEffect } from 'react'

export default function BranchSelector() {
  const { isTenantAdmin, organizationId, profile } = useAuth()
  const { currentBranch, availableBranches, setCurrentBranch, fetchBranches, loading } =
    useBranchStore()

  useEffect(() => {
    if (isTenantAdmin && organizationId) {
      fetchBranches(organizationId).then(() => {
        // If user has an assigned branch and nothing is selected yet, default to that branch
        if (profile?.branch_id && !currentBranch) {
          const assigned = availableBranches.find(b => b.id === profile.branch_id)
          if (assigned) {
            setCurrentBranch(assigned)
          }
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTenantAdmin, organizationId, profile?.branch_id])

  // Only show for admins (tenant-level)
  if (!isTenantAdmin) {
    return null
  }

  // If no branches available, don't show selector
  if (availableBranches.length === 0 && !loading) {
    return null
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2 min-w-0" data-tour="branch-selector">
      <label
        htmlFor="branch-selector"
        className="hidden sm:inline text-sm font-medium text-gray-700 whitespace-nowrap"
      >
        Branch:
      </label>
      <select
        id="branch-selector"
        value={currentBranch?.id || ''}
        onChange={e => {
          const branch = availableBranches.find(b => b.id === e.target.value)
          setCurrentBranch(branch || null)
        }}
        aria-label="Select branch"
        className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white cursor-pointer min-h-[36px] sm:min-h-[44px] touch-manipulation max-w-[120px] sm:max-w-[180px] md:max-w-none"
        disabled={loading}
        style={{ textOverflow: 'ellipsis' }}
      >
        <option value="">All Branches</option>
        {availableBranches.map(branch => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      {loading && (
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 flex-shrink-0"></div>
      )}
    </div>
  )
}
