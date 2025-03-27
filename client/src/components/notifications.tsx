import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useActivities } from "@/hooks/use-activities";
import { formatDate, getRelativeDays, getRelativeDaysText } from "@/lib/utils";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { Activity } from "@shared/schema";

export default function UpcomingNotifications() {
  const { upcomingNotifications, markAsRead } = useNotifications();
  const { activities } = useActivities();
  
  // Get activities related to the notifications
  const getActivityForNotification = (activityId: number) => {
    return activities.find(activity => activity.id === activityId);
  };
  
  // Sort notifications by date (closest first)
  const sortedNotifications = [...upcomingNotifications].sort(
    (a, b) => new Date(a.notifyDate).getTime() - new Date(b.notifyDate).getTime()
  );
  
  // Take only the first 3 for display
  const displayNotifications = sortedNotifications.slice(0, 3);
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-lg">Upcoming Activities</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 divide-y">
        {displayNotifications.length > 0 ? (
          displayNotifications.map((notification) => {
            const activity = getActivityForNotification(notification.activityId);
            if (!activity) return null;
            
            const daysUntil = getRelativeDays(new Date(activity.startDate));
            const relativeTimeText = getRelativeDaysText(daysUntil);
            
            return (
              <div key={notification.id} className="p-4 flex items-start">
                <div 
                  className={`${ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES].color} rounded-full w-2 h-2 mt-2 mr-3 flex-shrink-0`}
                ></div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{activity.title}</h3>
                    <span className="text-sm text-gray-500">{relativeTimeText}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(new Date(activity.startDate))} - {formatDate(new Date(activity.endDate))}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-gray-500">
            <span className="material-icons text-3xl mb-2">notifications_none</span>
            <p>No upcoming notifications</p>
          </div>
        )}
      </CardContent>
      
      {upcomingNotifications.length > 0 && (
        <CardFooter className="bg-gray-50 px-4 py-3 justify-end">
          <Button variant="link" className="text-primary hover:underline text-sm font-medium">
            View all notifications
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
