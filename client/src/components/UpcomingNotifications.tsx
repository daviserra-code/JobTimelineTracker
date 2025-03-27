import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Activity } from '@/lib/types';
import { getUpcomingActivities } from '@/lib/notifications';
import { formatDateRange, formatTimeRange, getRelativeTime } from '@/lib/dates';
import { getActivityTypeColor } from '@/lib/activities';

const UpcomingNotifications = () => {
  // Fetch upcoming activities for notifications
  const { data: upcomingActivities = [], isLoading } = useQuery({
    queryKey: ['/api/activities/upcoming'],
    queryFn: async () => {
      // Normally we'd use the user's ID from auth
      const userId = 1;
      return getUpcomingActivities(userId, 30);
    }
  });
  
  // Show only first 3 activities
  const topActivities = upcomingActivities.slice(0, 3);

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-medium">Upcoming Activities</h2>
      </div>
      
      {isLoading ? (
        <div className="p-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="divide-y">
          {topActivities.length > 0 ? (
            topActivities.map((activity: Activity) => (
              <div key={activity.id} className="p-4 flex items-start">
                <div className={`${getActivityTypeColor(activity.type)} rounded-full w-2 h-2 mt-2 mr-3 flex-shrink-0`}></div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{activity.title}</h3>
                    <span className="text-sm text-gray-500">{getRelativeTime(new Date(activity.startDate))}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDateRange(new Date(activity.startDate), new Date(activity.endDate))}
                    {activity.startDate !== activity.endDate && activity.startDate instanceof Date && activity.endDate instanceof Date && (
                      <span> ({formatTimeRange(new Date(activity.startDate), new Date(activity.endDate))})</span>
                    )}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>No upcoming activities</p>
            </div>
          )}
        </div>
      )}
      
      <div className="bg-gray-50 px-4 py-3 text-right">
        <Link href="/notifications">
          <a className="text-primary hover:underline text-sm font-medium focus:outline-none">
            View all notifications
          </a>
        </Link>
      </div>
    </div>
  );
};

export default UpcomingNotifications;
