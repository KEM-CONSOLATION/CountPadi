export type UserRole = 'admin' | 'staff'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  name: string
  unit: string
  quantity: number
  price_per_unit: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface OpeningStock {
  id: string
  item_id: string
  quantity: number
  date: string
  recorded_by: string
  notes: string | null
  created_at: string
  item?: Item
  recorded_by_profile?: Profile
}

export interface ClosingStock {
  id: string
  item_id: string
  quantity: number
  date: string
  recorded_by: string
  notes: string | null
  created_at: string
  item?: Item
  recorded_by_profile?: Profile
}

export interface Sale {
  id: string
  item_id: string
  quantity: number
  price_per_unit: number
  total_price: number
  date: string
  recorded_by: string
  description: string | null
  created_at: string
  item?: Item
  recorded_by_profile?: Profile
}

