'use server'

import { prisma } from '@calibr/db'
import { revalidatePath } from 'next/cache'

export async function updateWaitlistStatus(id: string, status: string) {
    await prisma().waitlist.update({
        where: { id },
        data: { status },
    })
    revalidatePath('/waitlist')
}

export async function deleteWaitlistEntry(id: string) {
    await prisma().waitlist.delete({
        where: { id },
    })
    revalidatePath('/waitlist')
}
