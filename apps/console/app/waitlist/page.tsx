import { prisma } from '@calibr/db'
import { WaitlistTable } from './WaitlistTable'
import Link from 'next/link'

export default async function WaitlistPage() {
    const waitlist = await prisma().waitlist.findMany({
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Waitlist Management</h1>
                    <p className="text-[color:var(--mute)]">
                        Manage early access requests from the marketing site.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="px-4 py-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard title="Total Leads" value={waitlist.length} />
                <StatsCard
                    title="Pending"
                    value={waitlist.filter((w: any) => w.status === 'pending').length}
                    color="text-yellow-600"
                />
                <StatsCard
                    title="Contacted"
                    value={waitlist.filter((w: any) => w.status === 'contacted').length}
                    color="text-blue-600"
                />
                <StatsCard
                    title="Onboarded"
                    value={waitlist.filter((w: any) => w.status === 'onboarded').length}
                    color="text-green-600"
                />
            </div>

            <WaitlistTable initialData={waitlist} />
        </div>
    )
}

function StatsCard({ title, value, color = "text-[color:var(--fg)]" }: { title: string, value: number, color?: string }) {
    return (
        <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-[color:var(--mute)] mb-1">{title}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
        </div>
    )
}
