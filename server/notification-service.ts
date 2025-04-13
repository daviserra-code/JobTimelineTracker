import { Activity, Notification, NotificationMethod, User, UserPreference } from '@shared/schema';
import * as sendgrid from '@sendgrid/mail';
import { storage } from './storage';

// Configure SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

// Define interfaces for our notification providers
interface NotificationProvider {
  canSend(): boolean;
  send(notification: Notification, activity: Activity, user: User, preferences: UserPreference): Promise<boolean>;
}

// App notifications (in-app)
class AppNotificationProvider implements NotificationProvider {
  canSend(): boolean {
    return true; // App notifications are always available
  }

  async send(notification: Notification, activity: Activity, user: User, preferences: UserPreference): Promise<boolean> {
    try {
      // We can't update status, but app notifications always succeed
      // so we won't mark as read yet to allow it to be displayed to the user
      return true;
    } catch (error) {
      console.error('Error sending app notification:', error);
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      return false;
    }
  }
}

// Email notifications (simulation mode) 
class EmailNotificationProvider implements NotificationProvider {
  canSend(): boolean {
    // Always available in simulation mode
    return true;
  }

  async send(notification: Notification, activity: Activity, user: User, preferences: UserPreference): Promise<boolean> {
    if (!preferences.email) {
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      console.error('User email not configured');
      return false;
    }

    try {
      // Format dates nicely
      const startDate = new Date(activity.startDate).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Construct email content (this would be sent via SendGrid in production)
      const message = {
        to: preferences.email,
        from: 'calendar@example.com', 
        subject: `Reminder: ${activity.title}`,
        text: `Reminder for your activity: ${activity.title} on ${startDate}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a5568;">Activity Reminder</h2>
            <div style="border-left: 4px solid #3182ce; padding: 10px 20px; margin: 20px 0; background-color: #ebf8ff;">
              <h3 style="color: #2c5282; margin-bottom: 10px;">${activity.title}</h3>
              <p><strong>When:</strong> ${startDate}</p>
              <p><strong>Type:</strong> ${activity.type}</p>
              <p><strong>Status:</strong> ${activity.status}</p>
              ${activity.location ? `<p><strong>Location:</strong> ${activity.location}</p>` : ''}
              ${activity.description ? `<p><strong>Description:</strong><br>${activity.description}</p>` : ''}
            </div>
            <p>This is an automated reminder from your Activity Calendar.</p>
          </div>
        `
      };
      
      // Log the email instead of sending it (for development/testing)
      console.log('==================== EMAIL NOTIFICATION ====================');
      console.log(`TO: ${message.to}`);
      console.log(`FROM: ${message.from}`);
      console.log(`SUBJECT: ${message.subject}`);
      console.log(`BODY: ${message.text}`);
      console.log('===========================================================');
      
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      return false;
    }
  }
}

// SMS notifications (simulation mode)
class SmsNotificationProvider implements NotificationProvider {
  canSend(): boolean {
    // Always available in simulation mode
    return true;
  }

  async send(notification: Notification, activity: Activity, user: User, preferences: UserPreference): Promise<boolean> {
    if (!preferences.phone) {
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      console.error('User phone number not configured');
      return false;
    }

    try {
      // Format the activity date
      const activityDate = new Date(activity.startDate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Create the SMS message
      const message = `Activity Calendar: ${activity.title} (${activity.type}) on ${activityDate} - Status: ${activity.status}`;
      
      // Log the SMS instead of sending it (for development/testing)
      console.log('==================== SMS NOTIFICATION ====================');
      console.log(`TO: ${preferences.phone}`);
      console.log(`FROM: Twilio Number (simulated)`);
      console.log(`MESSAGE: ${message}`);
      console.log('=========================================================');
      
      // Mark notification as read
      await storage.updateNotification(notification.id, {
        read: true
      });
      
      return true;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      return false;
    }
  }
}

// Notification Service to handle all notification types
class NotificationService {
  private providers: Map<NotificationMethod, NotificationProvider>;

  constructor() {
    this.providers = new Map();
    this.providers.set('app', new AppNotificationProvider());
    this.providers.set('email', new EmailNotificationProvider());
    this.providers.set('sms', new SmsNotificationProvider());
  }

  // Check which notification methods are available
  getAvailableMethods(): NotificationMethod[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.canSend())
      .map(([method]) => method);
  }

  // Send a notification through all enabled methods
  async sendNotification(notification: Notification): Promise<boolean> {
    try {
      if (!notification.activityId || !notification.userId) {
        // Mark as read to prevent further attempts
        await storage.updateNotification(notification.id, {
          read: true
        });
        console.error('Missing required relation IDs for notification');
        return false;
      }
      
      // Get associated data
      const activity = await storage.getActivity(notification.activityId);
      const user = await storage.getUser(notification.userId);
      const preferences = await storage.getUserPreferences(notification.userId);
      
      if (!activity || !user || !preferences) {
        // Mark as read to prevent further attempts
        await storage.updateNotification(notification.id, {
          read: true
        });
        console.error('Missing required data (activity, user, or preferences) for notification');
        return false;
      }

      // Get enabled notification methods from user preferences
      const enabledMethods = preferences.notificationMethods || ['app'];
      let overallSuccess = false;
      
      // Send notification through each enabled method
      for (const method of enabledMethods as NotificationMethod[]) {
        const provider = this.providers.get(method);
        
        if (!provider || !provider.canSend()) {
          console.log(`Skipping ${method} notification - provider not available`);
          continue;
        }
        
        try {
          // For email notifications, check if email is provided
          if (method === 'email' && !preferences.email) {
            console.log(`Skipping email notification - no email address provided`);
            continue;
          }
          
          // For SMS notifications, check if phone number is provided
          if (method === 'sms' && !preferences.phone) {
            console.log(`Skipping SMS notification - no phone number provided`);
            continue;
          }
          
          console.log(`Sending ${method} notification for activity "${activity.title}"`);
          const success = await provider.send(notification, activity, user, preferences);
          
          if (success) {
            console.log(`Successfully sent ${method} notification`);
            overallSuccess = true;
          } else {
            console.error(`Failed to send ${method} notification`);
          }
        } catch (error) {
          console.error(`Error sending ${method} notification:`, error);
        }
      }
      
      // Mark notification as read regardless of success to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      
      return overallSuccess;
    } catch (error) {
      console.error('Error in notification service:', error);
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      return false;
    }
  }

  // Process all pending notifications
  async processPendingNotifications(): Promise<void> {
    const now = new Date();
    const pendingNotifications = await storage.getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      if (notification.notifyDate <= now) {
        await this.sendNotification(notification);
      }
    }
  }

  // Create notifications for upcoming activities
  async scheduleActivityNotifications(activityId: number): Promise<void> {
    const activity = await storage.getActivity(activityId);
    if (!activity || !activity.notificationEnabled) return;

    // Get user preferences (notification lead time)
    // Make sure we have a valid userId
    if (!activity.userId) return;
    
    const preferences = await storage.getUserPreferences(activity.userId);
    if (!preferences || !preferences.notificationsEnabled) return;

    // Calculate notification date (X days before activity)
    const leadTimeInDays = preferences.notificationLeadTime || 1;
    const notifyDate = new Date(activity.startDate);
    notifyDate.setDate(notifyDate.getDate() - leadTimeInDays);

    // If notify date is in the past, don't create a notification
    if (notifyDate < new Date()) return;

    // Create notifications for each enabled method
    const enabledMethods = preferences.notificationMethods || ['app'];
    for (const method of enabledMethods as NotificationMethod[]) {
      const provider = this.providers.get(method);
      if (provider && provider.canSend()) {
        await storage.createNotification({
          activityId: activity.id,
          userId: activity.userId,
          notifyDate,
          // Fields below are no longer part of the actual database schema
          // method,
          // status: 'pending',
        });
      }
    }
  }
}

export const notificationService = new NotificationService();