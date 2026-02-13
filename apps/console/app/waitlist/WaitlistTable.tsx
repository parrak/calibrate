'use client'

import { updateWaitlistStatus, deleteWaitlistEntry } from './actions'
import { useState } from 'react'
import { Waitlist } from '@calibr/db'

export function WaitlistTable({ initialData }: { initialData: Waitlist[] }) {
    const [data, setData] = useState<Waitlist[]>(initialData)

    const handleStatusUpdate = async (id: string, status: string) => {
        await updateWaitlistStatus(id, status)
        // Update local state for immediate feedback
        setData(data.map((item: Waitlist) => item.id === id ? { ...item, status } : item))
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this lead?')) {
            await deleteWaitlistEntry(id)
            setData(data.filter((item: Waitlist) => item.id !== id))
        }
    }

    return (
        <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-[color:var(--border)] text-xs font-semibold uppercase text-[color:var(--mute)]">
                    <tr>
                        <th className="px-6 py-4">Signup Date</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Store / Revenue</th>
                        <th className="px-6 py-4">Challenges</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-[color:var(--mute)] italic">
                                No one on the waitlist yet.
                            </td>
                        </tr>
                    ) : (
                        data.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors text-xs">
                                <td className="px-6 py-4 whitespace-nowrap text-[color:var(--mute)]">
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-sm">{entry.name || 'Anonymous'}</div>
                                    <div className="text-[color:var(--mute)]">{entry.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-[color:var(--fg)] truncate max-w-[200px]">
                                        {entry.storeUrl || 'N/A'}
                                    </div>
                                    <div className="text-[color:var(--mute)]">{entry.monthlyRevenue || 'Unknown'}</div>
                                </td>
                                <td className="px-6 py-4 max-w-sm">
                                    <p className="truncate text-[color:var(--mute)]" title={entry.challenges || ''}>
                                        {entry.challenges || 'No challenges listed.'}
                                    </p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={entry.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3 text-[color:var(--mute)]">
                                        <button
                                            onClick={() => handleStatusUpdate(entry.id, 'contacted')}
                                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Mark as Contacted"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(entry.id, 'onboarded')}
                                            className="p-1.5 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                            title="Mark as Onboarded"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Lead"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
        contacted: "bg-blue-50 text-blue-700 border-blue-100",
        onboarded: "bg-green-50 text-green-700 border-green-100",
    }

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[status] || styles.pending}`}>
            {status}
        </span>
    )
}
