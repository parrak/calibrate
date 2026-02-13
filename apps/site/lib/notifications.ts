export async function notifyWaitlistJoin(data: {
    email: string
    name?: string | null
    storeUrl?: string | null
    monthlyRevenue?: string | null
}) {
    const webhookUrl = process.env.SLACK_WAITLIST_WEBHOOK_URL
    if (!webhookUrl) {
        console.log('[Notification] Skipping Slack notification: SLACK_WAITLIST_WEBHOOK_URL not set')
        return
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `🚀 *New Waitlist Signup!*`,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `🚀 *New Waitlist Signup!*\n\n*Name:* ${data.name || 'N/A'}\n*Email:* ${data.email}\n*Store:* ${data.storeUrl || 'N/A'}\n*Revenue:* ${data.monthlyRevenue || 'N/A'}`,
                        },
                    },
                    {
                        type: 'actions',
                        elements: [
                            {
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    text: 'View in DB',
                                },
                                url: 'https://console.calibr.lat/waitlist',
                            },
                        ],
                    },
                ],
            }),
        })

        if (!response.ok) {
            console.error('[Notification] Slack notification failed:', await response.text())
        }
    } catch (error) {
        console.error('[Notification] Failed to send Slack notification:', error)
    }
}
