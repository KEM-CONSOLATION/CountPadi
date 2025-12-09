'use client'

import { Organization } from '@/types/database'

interface OrganizationLogoProps {
  organization: Organization | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const DEFAULT_BRAND_COLOR = '#3B82F6'
const APP_NAME = 'Zentro'

export function getDefaultBrandColor() {
  return DEFAULT_BRAND_COLOR
}

export function getAppName() {
  return APP_NAME
}

export function getOrganizationBrandColor(organization: Organization | null | undefined): string {
  return organization?.brand_color || DEFAULT_BRAND_COLOR
}

export function getOrganizationLogo(organization: Organization | null | undefined): string | null {
  return organization?.logo_url || null
}

export default function OrganizationLogo({
  organization,
  size = 'md',
  className = '',
}: OrganizationLogoProps) {
  const logoUrl = getOrganizationLogo(organization)
  const brandColor = getOrganizationBrandColor(organization)
  const displayName = organization?.name || APP_NAME

  const sizeClasses = {
    sm: 'text-lg font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold',
  }

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={displayName}
        className={`${sizeClasses[size]} object-contain ${className}`}
      />
    )
  }

  // Text-based logo (no circle, just the app name)
  return (
    <div className={`${sizeClasses[size]} ${className}`} style={{ color: brandColor }}>
      {displayName}
    </div>
  )
}
