'use server'

import { prisma } from '@calibr/db'
import { revalidatePath } from 'next/cache'
import { notifyWaitlistJoin } from '../../lib/notifications'

export async function submitEarlyAccess(formData: FormData) {
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const storeUrl = formData.get('storeUrl') as string
    const monthlyRevenue = formData.get('monthlyRevenue') as string
    const challenges = formData.get('challenges') as string

    if (!email) {
        return { error: 'Email is required' }
    }

    try {
        await prisma().waitlist.upsert({
            where: { email },
            update: {
                name,
                storeUrl,
                monthlyRevenue,
                challenges,
                updatedAt: new Date(),
            },
            create: {
                email,
                name,
                storeUrl,
                monthlyRevenue,
                challenges,
            },
        })

        // Background notification (don't await to keep response fast)
        notifyWaitlistJoin({ email, name, storeUrl, monthlyRevenue }).catch(console.error)

        revalidatePath('/early-access')
        return { success: true }
    } catch (error) {
        console.error('Failed to submit early access:', error)
        return { error: 'Something went wrong. Please try again.' }
    }
}
