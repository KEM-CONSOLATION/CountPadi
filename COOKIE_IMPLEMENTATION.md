# Cookie Implementation Guide

## Overview

We've implemented `js-cookie` for reliable cookie management across the application. Cookies are used for:
- Branch selection persistence
- User preferences
- Feature flags
- Last organization tracking

## Installation

```bash
npm install js-cookie
npm install --save-dev @types/js-cookie
```

## Cookie Utilities (`lib/utils/cookies.ts`)

### Basic Functions

```typescript
import { getCookie, setCookie, removeCookie } from '@/lib/utils/cookies'

// Get a cookie
const value = getCookie('my_cookie')

// Set a cookie
setCookie('my_cookie', 'value')

// Remove a cookie
removeCookie('my_cookie')
```

### Branch Management

```typescript
import { 
  getSelectedBranchId, 
  setSelectedBranchId, 
  clearSelectedBranchId 
} from '@/lib/utils/cookies'

// Get selected branch ID
const branchId = getSelectedBranchId() // Returns string | null

// Set selected branch ID
setSelectedBranchId('branch-uuid-here')

// Clear selected branch
clearSelectedBranchId()
```

### User Preferences

```typescript
import { getUserPreferences, setUserPreferences } from '@/lib/utils/cookies'

// Get preferences
const prefs = getUserPreferences() // Returns Record<string, unknown> | null

// Set preferences
setUserPreferences({
  theme: 'dark',
  language: 'en',
  notifications: true
})
```

### Feature Flags

```typescript
import { 
  getFeatureFlags, 
  setFeatureFlags, 
  isFeatureEnabled 
} from '@/lib/utils/cookies'

// Check if feature is enabled
if (isFeatureEnabled('multi_branch')) {
  // Show multi-branch UI
}

// Set feature flags
setFeatureFlags({
  multi_branch: true,
  pos_mode: false
})
```

## Branch Store (`lib/stores/branchStore.ts`)

The branch store automatically syncs with cookies:

```typescript
import { useBranchStore } from '@/lib/stores/branchStore'

function MyComponent() {
  const { 
    currentBranch, 
    availableBranches, 
    setCurrentBranch,
    fetchBranches 
  } = useBranchStore()
  
  // Branch is automatically saved to cookie when set
  const handleBranchChange = (branch: Branch) => {
    setCurrentBranch(branch) // Also saves to cookie
  }
}
```

## Using with useAuth Hook

The `useAuth` hook now includes branch functionality:

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

function MyComponent() {
  const { 
    currentBranch,
    branchId,
    availableBranches,
    hasMultipleBranches,
    setCurrentBranch,
    fetchBranches 
  } = useAuth()
  
  // branchId is a convenience property
  const selectedBranchId = branchId // currentBranch?.id || null
}
```

## Cookie Configuration

Cookies are configured with:
- **Expires**: 365 days (1 year)
- **SameSite**: Strict (CSRF protection)
- **Secure**: Enabled in production

You can override these when setting cookies:

```typescript
import { setCookie } from '@/lib/utils/cookies'

// Custom expiration (7 days)
setCookie('temp_data', 'value', { expires: 7 })

// Session cookie (expires when browser closes)
setCookie('session_data', 'value', { expires: 0 })
```

## Cookie Keys

All cookie keys are centralized in `COOKIE_KEYS`:

```typescript
import { COOKIE_KEYS } from '@/lib/utils/cookies'

COOKIE_KEYS.SELECTED_BRANCH      // 'selected_branch_id'
COOKIE_KEYS.USER_PREFERENCES     // 'user_preferences'
COOKIE_KEYS.FEATURE_FLAGS        // 'feature_flags'
COOKIE_KEYS.LAST_ORGANIZATION    // 'last_organization_id'
```

## Example: Branch Selector Component

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export default function BranchSelector() {
  const { 
    currentBranch, 
    availableBranches, 
    setCurrentBranch,
    hasMultipleBranches,
    isSuperAdmin 
  } = useAuth()
  
  // Only show for tenant admins with multiple branches
  if (!isSuperAdmin || !hasMultipleBranches) {
    return null
  }
  
  return (
    <select
      value={currentBranch?.id || ''}
      onChange={(e) => {
        const branch = availableBranches.find(b => b.id === e.target.value)
        if (branch) {
          setCurrentBranch(branch) // Automatically saves to cookie
        }
      }}
    >
      {availableBranches.map(branch => (
        <option key={branch.id} value={branch.id}>
          {branch.name}
        </option>
      ))}
    </select>
  )
}
```

## Server-Side Usage

For server-side cookie access (in API routes or server components), use Next.js cookies:

```typescript
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const branchId = cookieStore.get('selected_branch_id')?.value
  // ...
}
```

## Best Practices

1. **Use Cookie Utilities**: Always use the utility functions, not `js-cookie` directly
2. **Type Safety**: Use `COOKIE_KEYS` constants instead of string literals
3. **Clear on Logout**: Clear all cookies when user logs out
4. **Validate Data**: Always validate cookie data before using it
5. **Handle Missing**: Always handle `null`/`undefined` cookie values

## Migration Notes

When implementing multi-branch:
- Branch selection is automatically persisted via cookies
- Users' branch preference survives page refreshes
- Branch context is available throughout the app via `useAuth()`
- No need to manually manage branch state in components

