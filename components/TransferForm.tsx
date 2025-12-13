'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Item, Branch } from '@/types/database'
import { format } from 'date-fns'

interface TransferRow {
  id: string
  date: string
  item?: Item
  from_branch?: Branch
  to_branch?: Branch
  quantity: number
  performed_by_profile?: { full_name?: string | null; email?: string | null }
  notes?: string | null
}

export default function TransferForm() {
  const { user, branchId, organizationId, isTenantAdmin, currentBranch, availableBranches } =
    useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [toBranch, setToBranch] = useState('')
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [transfers, setTransfers] = useState<TransferRow[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const destinationBranches = useMemo(() => {
    return availableBranches.filter(b => b.id !== branchId)
  }, [availableBranches, branchId])

  useEffect(() => {
    const init = async () => {
      await fetchItems()
      await fetchTransfers()
    }
    init()
  }, [branchId, organizationId, fromDate, toDate])

  const fetchItems = async () => {
    if (!organizationId) return
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')
    setItems(data || [])
  }

  const fetchTransfers = async () => {
    if (!user) return
    const params = new URLSearchParams({ user_id: user.id })
    if (branchId) params.set('branch_id', branchId)
    if (fromDate) params.set('from_date', fromDate)
    if (toDate) params.set('to_date', toDate)

    const res = await fetch(`/api/transfers/list?${params.toString()}`)
    const data = await res.json()
    if (res.ok) setTransfers(data.transfers || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setMessage({ type: 'error', text: 'Not authenticated' })
      return
    }
    if (!branchId) {
      setMessage({ type: 'error', text: 'Select a source branch first' })
      return
    }
    if (!itemId || !toBranch || !quantity) {
      setMessage({ type: 'error', text: 'Please fill all required fields' })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/transfers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          item_id: itemId,
          from_branch_id: branchId,
          to_branch_id: toBranch,
          quantity: parseFloat(quantity),
          date,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create transfer')
      setMessage({ type: 'success', text: 'Transfer recorded successfully' })
      setQuantity('')
      setNotes('')
      await fetchTransfers()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create transfer' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="p-4">Please log in.</div>
  }

  if (!branchId && !isTenantAdmin) {
    return (
      <div className="p-4">
        <p className="text-gray-600">You need a branch assigned to perform transfers.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transfer Stock</h2>
            <p className="text-sm text-gray-500">
              Move stock from your current branch to another branch within the organization.
            </p>
          </div>
          {currentBranch && (
            <div className="text-sm text-gray-600">
              From branch: <span className="font-semibold">{currentBranch.name}</span>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`p-3 rounded ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {!branchId && isTenantAdmin && (
          <div className="mb-4 text-sm text-orange-700 bg-orange-50 border border-orange-200 p-3 rounded">
            Select a branch from the branch selector to act as the source for this transfer.
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item <span className="text-red-500">*</span>
            </label>
            <select
              value={itemId}
              onChange={e => setItemId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 cursor-pointer bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5em_center] bg-no-repeat pr-10"
              required
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
              }}
            >
              <option value="">Select item</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={toBranch}
              onChange={e => setToBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 cursor-pointer bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5em_center] bg-no-repeat pr-10"
              required
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
              }}
            >
              <option value="">Select branch</option>
              {destinationBranches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={2}
              placeholder="Optional notes"
            />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Transferring...' : 'Transfer Stock'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transfers</h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="From"
            />
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="To"
            />
            <button
              onClick={fetchTransfers}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Filter
            </button>
            <button
              onClick={() => {
                setFromDate('')
                setToDate('')
                fetchTransfers()
              }}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No transfers found
                  </td>
                </tr>
              )}
              {transfers.map(t => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {t.date ? format(new Date(t.date + 'T00:00:00'), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.item?.name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.from_branch?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.to_branch?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {t.performed_by_profile?.full_name ||
                      t.performed_by_profile?.email ||
                      'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{t.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
