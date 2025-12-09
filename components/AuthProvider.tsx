'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { useOrganizationStore } from '@/lib/stores/organizationStore'
import { useBranchStore } from '@/lib/stores/branchStore'
import { supabase } from '@/lib/supabase/client'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const {
    initialize: initializeAuth,
    clear: clearAuth,
    organizationId,
    initialized,
  } = useAuthStore()
  const { initialize: initializeOrg } = useOrganizationStore()

  useEffect(() => {
    // Initialize auth store only once
    if (!initialized) {
      initializeAuth()
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await initializeAuth()
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth, clearAuth, router, initialized])

  // Initialize organization when organizationId is available
  useEffect(() => {
    if (organizationId) {
      initializeOrg(organizationId)
    }
  }, [organizationId, initializeOrg])

  // Initialize branches when organization is available
  useEffect(() => {
    if (organizationId) {
      const { fetchBranches } = useBranchStore.getState()
      fetchBranches(organizationId).catch(error => {
        console.error('Error initializing branches:', error)
        // Don't throw - branches table might not exist yet
      })
    }
  }, [organizationId])

  return <>{children}</>
}
