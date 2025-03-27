import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ViewMode } from '@/lib/types';
import ViewOptionsMenu from './ViewOptionsMenu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type CalendarControlsProps = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentPeriod: string;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onAddActivity: () => void;
};

const CalendarControls = ({
  viewMode,
  setViewMode,
  currentPeriod,
  onPrevPeriod,
  onNextPeriod,
  onAddActivity
}: CalendarControlsProps) => {
  const [viewOptionsOpen, setViewOptionsOpen] = useState(false);
  
  // Get user settings to check default view
  const { data: userSettings } = useQuery({
    queryKey: ['/api/settings/1']
  });
  
  // Handle view mode change
  const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewMode(e.target.value as ViewMode);
  };

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <select 
              id="viewSelector" 
              className="border rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              value={viewMode}
              onChange={handleViewModeChange}
            >
              <option value="timeline">Timeline</option>
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 rounded-full hover:bg-gray-100" 
                title="Previous period"
                onClick={onPrevPeriod}
              >
                <span className="material-icons">navigate_before</span>
              </button>
              <span className="text-lg font-medium">{currentPeriod}</span>
              <button 
                className="p-2 rounded-full hover:bg-gray-100" 
                title="Next period"
                onClick={onNextPeriod}
              >
                <span className="material-icons">navigate_next</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="hidden md:flex border rounded px-3 py-2 hover:bg-gray-50 items-center">
              <span className="material-icons text-sm mr-1">filter_list</span>
              Filter
            </button>
            
            <Popover open={viewOptionsOpen} onOpenChange={setViewOptionsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border rounded px-3 py-2 hover:bg-gray-50 flex items-center">
                  <span className="material-icons text-sm mr-1">visibility</span>
                  View Options
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <ViewOptionsMenu onClose={() => setViewOptionsOpen(false)} />
              </PopoverContent>
            </Popover>
            
            <button 
              className="rounded-full bg-primary text-white p-3 md:px-4 md:py-2 flex items-center shadow-md hover:bg-opacity-90"
              onClick={onAddActivity}
            >
              <span className="material-icons md:mr-1">add</span>
              <span className="hidden md:inline">Add Activity</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarControls;
