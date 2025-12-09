# Tour Guide Implementation Plan

## Overview

Create an interactive tour guide for new users to help them understand the app and get started quickly.

## Recommended Library

**react-joyride** - Most popular and feature-rich React tour library

### Installation

```bash
npm install react-joyride
```

## Features to Include

### 1. Welcome Tour (First Login)
- Welcome message
- Overview of dashboard
- Key features introduction

### 2. Getting Started Steps
1. **Create Items** - Show item management
2. **Add Staff** - Show user management
3. **Record Opening Stock** - Show stock management
4. **Record Sales** - Show sales form
5. **View Reports** - Show reporting features

### 3. Feature Highlights
- Inventory tracking
- Sales recording
- Profit & Loss
- Reports & Exports
- Notifications

## Implementation Strategy

### Step 1: Create Tour Component

```typescript
// components/UserTour.tsx
'use client'

import { useState } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'

interface UserTourProps {
  run: boolean
  onComplete: () => void
}

export default function UserTour({ run, onComplete }: UserTourProps) {
  const [steps] = useState<Step[]>([
    {
      target: '[data-tour="dashboard"]',
      content: 'Welcome to your dashboard! Here you can see an overview of your inventory and sales.',
      placement: 'center',
    },
    {
      target: '[data-tour="items"]',
      content: 'Start by creating items for your inventory. Click here to add your first item.',
    },
    {
      target: '[data-tour="sales"]',
      content: 'Record sales here. This will automatically update your inventory.',
    },
    // ... more steps
  ])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      onComplete()
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4f46e5', // Match your brand color
        },
      }}
    />
  )
}
```

### Step 2: Add Tour Markers to Components

```typescript
// In DashboardLayout.tsx
<nav data-tour="sidebar">
  {/* sidebar items */}
</nav>

// In ItemManagement.tsx
<button data-tour="items">
  Add Item
</button>
```

### Step 3: Track Tour Completion

Use cookies to track if user has completed tour:

```typescript
import { getCookie, setCookie } from '@/lib/utils/cookies'

const TOUR_COMPLETED_KEY = 'tour_completed'

export function hasCompletedTour(): boolean {
  return getCookie(TOUR_COMPLETED_KEY) === 'true'
}

export function markTourCompleted(): void {
  setCookie(TOUR_COMPLETED_KEY, 'true')
}
```

### Step 4: Auto-start Tour for New Users

```typescript
// In DashboardLayout or Dashboard page
const [showTour, setShowTour] = useState(false)

useEffect(() => {
  if (!hasCompletedTour() && isNewUser) {
    setShowTour(true)
  }
}, [])
```

## Tour Steps Breakdown

### Step 1: Welcome
- Target: Dashboard header
- Content: Welcome message, explain what the app does

### Step 2: Create Items
- Target: Item Management link/button
- Content: "Start by adding items to your inventory"

### Step 3: Add Staff
- Target: User Management link
- Content: "Add staff members who will use the system"

### Step 4: Opening Stock
- Target: Opening Stock page
- Content: "Record your starting inventory here"

### Step 5: Record Sales
- Target: Sales form
- Content: "Record sales to track revenue and inventory"

### Step 6: View Reports
- Target: Reports link
- Content: "View detailed reports and analytics"

### Step 7: Profit & Loss
- Target: Profit & Loss card
- Content: "Track your profitability here"

## Advanced Features

### Conditional Steps
Show different steps based on user role:

```typescript
const getStepsForRole = (role: string): Step[] => {
  if (role === 'admin') {
    return adminSteps
  }
  return staffSteps
}
```

### Contextual Help
Add "?" buttons that trigger specific tour steps:

```typescript
<button onClick={() => startTourFromStep(3)}>
  Need help? Take a tour
</button>
```

### Progress Indicator
Show progress: "Step 2 of 7"

### Skip Option
Allow users to skip tour

### Restart Option
"Show tour again" button in settings

## Integration Points

### 1. Dashboard
- Welcome message
- Overview of cards

### 2. Item Management
- How to add items
- Item fields explanation

### 3. Sales Form
- How to record sales
- Batch selection (if applicable)

### 4. Reports
- How to view reports
- Export options

### 5. Settings/Profile
- How to manage account
- Organization settings

## User Experience

### First Time Users
- Auto-start tour on first login
- Can't skip (or can skip with confirmation)

### Returning Users
- "Take Tour" button in help menu
- Contextual help buttons

### Completion Tracking
- Mark as completed in cookie
- Don't show again unless requested

## Implementation Timeline

**Day 1:**
- Install react-joyride
- Create basic tour component
- Add tour markers to 3-4 key components

**Day 2:**
- Complete all tour steps
- Add completion tracking
- Test and refine

**Total: 1-2 days**

## Benefits

1. **Reduces Support Burden**: Users understand the app
2. **Faster Onboarding**: Users get productive quickly
3. **Better UX**: Professional, polished feel
4. **Feature Discovery**: Users learn about features they might miss
5. **No Database Changes**: Pure UI feature, safe to implement

## Recommendation

**Implement tour guide NOW** because:
- ✅ No risk to existing features
- ✅ No database changes
- ✅ Quick to implement (1-2 days)
- ✅ Immediate value for users
- ✅ Can be done in parallel with multi-branch planning
- ✅ Won't conflict with multi-branch work

Then work on multi-branch feature in separate branch.

