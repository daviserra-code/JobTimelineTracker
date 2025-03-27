import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@/lib/constants";
import { ActivityType, ActivityStatus } from "@shared/schema";

export default function ActivityLegend() {
  return (
    <div className="bg-white border-b tour-legend">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm">
          <div className="flex flex-wrap items-center">
            <span className="mr-4 font-medium">Activity Types:</span>
            <div className="flex flex-wrap gap-3">
              {Object.entries(ACTIVITY_TYPES).map(([type, { label, color }]) => (
                <div className="flex items-center" key={type}>
                  <div className={`w-3 h-3 rounded-full ${color} mr-1`}></div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-r mx-3 h-6 hidden md:block"></div>
          
          <div className="flex flex-wrap items-center">
            <span className="mr-4 font-medium">Activity Statuses:</span>
            <div className="flex flex-wrap gap-3">
              {Object.entries(ACTIVITY_STATUSES).map(([status, { label, color }]) => (
                <div className="flex items-center" key={status}>
                  <div className={`w-3 h-3 rounded-full ${color} mr-1`}></div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
