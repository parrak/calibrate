'use server'

import { prisma } from '@calibr/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from '../../lib/auth'

async function ensureAdmin() {
    const session = await getServerSession()
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
        throw new Error('Unauthorized')
    }
}

export async function updateWaitlistStatus(id: string, status: string) {
    await ensureAdmin()
    await prisma().waitlist.update({
        where: { id },
        data: { status },
    })
    revalidatePath('/waitlist')
}

export async function deleteWaitlistEntry(id: string) {
    await ensureAdmin()
    await prisma().waitlist.delete({
        where: { id },
    })
    revalidatePath('/waitlist')
}
