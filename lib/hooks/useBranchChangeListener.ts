import { useEffect } from 'react'

/**
 * Hook to listen for branch changes and trigger a callback
 * Useful for refetching data when admin switches branches
 */
export function useBranchChangeListener(callback: () => void) {
  useEffect(() => {
    const handleBranchChange = () => {
      callback()
    }
    window.addEventListener('branchChanged', handleBranchChange)
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange)
    }
  }, [callback])
}
