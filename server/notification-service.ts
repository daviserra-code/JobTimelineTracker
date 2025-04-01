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

// Email notifications via SendGrid
class EmailNotificationProvider implements NotificationProvider {
  canSend(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  async send(notification: Notification, activity: Activity, user: User, preferences: UserPreference): Promise<boolean> {
    if (!this.canSend()) {
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      console.error('SendGrid API key not configured');
      return false;
    }

    if (!preferences.email) {
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      console.error('User email not configured');
      return false;
    }

    try {
      const message = {
        to: preferences.email,
        from: 'notifications@activitycalendar.com', // Use a verified sender in SendGrid
        subject: `Reminder: ${activity.title}`,
        text: `You have an upcoming activity: ${activity.title}\nTime: ${activity.startDate.toLocaleString()}\nLocation: ${activity.location || 'Not specified'}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Activity Reminder</h2>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
              <h3 style="margin-top: 0;">${activity.title}</h3>
              <p><strong>Time:</strong> ${activity.startDate.toLocaleString()}</p>
              <p><strong>Status:</strong> ${activity.status}</p>
              ${activity.location ? `<p><strong>Location:</strong> ${activity.location}</p>` : ''}
              ${activity.description ? `<p><strong>Description:</strong> ${activity.description}</p>` : ''}
            </div>
            <p style="color: #666; font-size: 12px;">This is an automated notification from your Activity Calendar.</p>
          </div>
        `
      };

      await sendgrid.send(message);
      
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

// SMS notifications via Twilio (placeholder for future implementation)
class SmsNotificationProvider implements NotificationProvider {
  canSend(): boolean {
    return !!(
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN && 
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  async send(notification: Notification, activity: Activity, user: User, preferences: UserPreference): Promise<boolean> {
    if (!this.canSend()) {
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      console.error('Twilio credentials not configured');
      return false;
    }

    if (!preferences.phone) {
      // Mark as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      console.error('User phone number not configured');
      return false;
    }

    // This is just a placeholder - we'll implement actual Twilio integration when credentials are available
    try {
      // In a real implementation, we would use Twilio client here
      const message = `Reminder: ${activity.title} at ${activity.startDate.toLocaleString()}`;
      console.log(`Would send SMS to ${preferences.phone}: ${message}`);
      
      // Since this is a placeholder and we can't update status (field doesn't exist),
      // we'll just mark it as read to prevent further attempts
      await storage.updateNotification(notification.id, {
        read: true
      });
      return false;
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

  // Send a notification through the specified method
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

      // Since we don't store method in the database, we'll use 'app' as default
      const method = 'app' as NotificationMethod;
      const provider = this.providers.get(method);
      
      if (!provider) {
        // Mark as read to prevent further attempts
        await storage.updateNotification(notification.id, {
          read: true
        });
        console.error(`Unsupported notification method: ${method}`);
        return false;
      }

      // Send the notification
      const success = await provider.send(notification, activity, user, preferences);
      
      // If successful, mark notification as read
      if (success) {
        await storage.updateNotification(notification.id, {
          read: true
        });
      }
      
      return success;
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