'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/lib/components/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/lib/components/Table'
import { Badge } from '@/lib/components/Badge'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/lib/components/Button'

interface Transaction {
    id: string
    source: string
    externalId: string
    amount: number
    currency: string
    status: string
    feeAmount: number | null
    netAmount: number | null
    occurredAt: string
    Product: {
        name: string
        code: string
    } | null
}

import { useSession } from 'next-auth/react'

interface TransactionsTableProps {
    projectSlug: string
}

export function TransactionsTable({ projectSlug }: TransactionsTableProps) {
    const { data: session } = useSession()
    const userId = (session?.user as any)?.id

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTransactions = async () => {
        if (!userId) return

        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/projects/${projectSlug}/transactions?userId=${userId}`)
            if (!res.ok) {
                throw new Error('Failed to fetch transactions')
            }
            const data = await res.json()
            setTransactions(data.data)
        } catch (err) {
            console.error(err)
            setError('Failed to load transactions')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (userId) {
            fetchTransactions()
        }
    }, [projectSlug, userId])

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                        Latest transactions synced from Stripe
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="text-center py-8 text-red-600">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>{error}</p>
                    </div>
                ) : loading && transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Loading transactions...
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No transactions found.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead>Net</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((txn) => (
                                <TableRow key={txn.id}>
                                    <TableCell>
                                        {new Date(txn.occurredAt).toLocaleDateString()} <br />
                                        <span className="text-xs text-gray-500">
                                            {new Date(txn.occurredAt).toLocaleTimeString()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{txn.Product?.name || 'Unknown Product'}</div>
                                        <div className="text-xs text-gray-500">{txn.externalId}</div>
                                    </TableCell>
                                    <TableCell>{formatCurrency(txn.amount, txn.currency)}</TableCell>
                                    <TableCell>
                                        {txn.feeAmount ? formatCurrency(txn.feeAmount, txn.currency) : '-'}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {txn.netAmount ? formatCurrency(txn.netAmount, txn.currency) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={txn.status === 'succeeded' ? 'default' : 'secondary'}>
                                            {txn.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
