import { ACTIVITY_TYPES } from "@/lib/constants";
import { ActivityType } from "@shared/schema";

export default function ActivityLegend() {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center text-sm">
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
      </div>
    </div>
  );
}
