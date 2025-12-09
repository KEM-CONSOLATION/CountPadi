import { useAuthStore } from '@/lib/stores/authStore'
import { useOrganizationStore } from '@/lib/stores/organizationStore'
import { useBranchStore } from '@/lib/stores/branchStore'

/**
 * Custom hook to access auth, organization, and branch data
 * This hook provides easy access to user, profile, organization, and branch data
 * without needing to make multiple API calls
 */
export function useAuth() {
  const { user, profile, organizationId, loading, initialized, initialize } = useAuthStore()
  const { organization } = useOrganizationStore()
  const { currentBranch, availableBranches, setCurrentBranch, fetchBranches } = useBranchStore()

  return {
    user,
    profile,
    organizationId,
    organization,
    currentBranch,
    availableBranches,
    setCurrentBranch,
    fetchBranches,
    loading,
    initialized,
    initialize,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isSuperAdmin: profile?.role === 'superadmin',
    isStaff: profile?.role === 'staff',
    // Branch helpers
    branchId: currentBranch?.id || null,
    hasMultipleBranches: availableBranches.length > 1,
  }
}
