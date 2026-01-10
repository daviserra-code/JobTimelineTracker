import { Activity } from '@shared/schema';

// Microsoft Graph API endpoints
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

export class OutlookService {
    /**
     * Syncs an activity to Outlook Calendar
     * For now, this just creates a new event or updates if we had an external ID mapping (which we don't yet)
     * So this will be a "push" operation.
     */
    static async syncActivity(accessToken: string, activity: Activity): Promise<any> {
        const event = {
            subject: activity.title,
            body: {
                contentType: 'HTML',
                content: activity.description || ''
            },
            start: {
                dateTime: activity.startDate.toISOString(),
                timeZone: 'UTC'
            },
            end: {
                dateTime: activity.endDate.toISOString(),
                timeZone: 'UTC'
            },
            location: {
                displayName: activity.location || ''
            }
        };

        const response = await fetch(`${GRAPH_API_BASE}/me/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to sync event to Outlook: ${errorText}`);
        }

        return response.json();
    }

    /**
     * Get user's profile to verify connection
     */
    static async getUserProfile(accessToken: string): Promise<any> {
        const response = await fetch(`${GRAPH_API_BASE}/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Outlook profile');
        }

        return response.json();
    }
}
