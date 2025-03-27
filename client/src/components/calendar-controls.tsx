import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewMode } from "@shared/schema";
import { VIEW_MODES, YEARS } from "@/lib/constants";

interface CalendarControlsProps {
  currentYear: number;
  currentViewMode: ViewMode;
  onYearChange: (year: number) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  onOpenAddActivity: () => void;
  onOpenImportExport: () => void;
}

export default function CalendarControls({
  currentYear,
  currentViewMode,
  onYearChange,
  onViewModeChange,
  onOpenAddActivity,
  onOpenImportExport
}: CalendarControlsProps) {
  const goToPreviousPeriod = () => {
    if (currentYear > YEARS[0]) {
      onYearChange(currentYear - 1);
    }
  };
  
  const goToNextPeriod = () => {
    if (currentYear < YEARS[YEARS.length - 1]) {
      onYearChange(currentYear + 1);
    }
  };
  
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <Select value={currentViewMode} onValueChange={(value) => onViewModeChange(value as ViewMode)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VIEW_MODES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToPreviousPeriod}
                disabled={currentYear <= YEARS[0]}
                title="Previous period"
              >
                <span className="material-icons">navigate_before</span>
              </Button>
              <span className="text-lg font-medium">{currentYear}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToNextPeriod}
                disabled={currentYear >= YEARS[YEARS.length - 1]}
                title="Next period"
              >
                <span className="material-icons">navigate_next</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="hidden md:flex items-center">
              <span className="material-icons text-sm mr-1">filter_list</span>
              Filter
            </Button>
            
            <div className="relative">
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={onOpenImportExport}
              >
                <span className="material-icons text-sm mr-1">download</span>
                <span className="hidden sm:inline">Import/Export</span>
              </Button>
            </div>
            
            <Button 
              onClick={onOpenAddActivity}
              className="rounded-full bg-primary text-white p-3 md:px-4 md:py-2 flex items-center shadow-md hover:bg-opacity-90"
            >
              <span className="material-icons md:mr-1">add</span>
              <span className="hidden md:inline">Add Activity</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Year tabs for timeline view */}
      <div className="border-b bg-gray-50">
        <div className="flex overflow-x-auto">
          {YEARS.map((year) => (
            <button
              key={year}
              onClick={() => onYearChange(year)}
              className={`px-4 py-2 font-medium hover:bg-gray-100 focus:outline-none border-b-2 ${
                year === currentYear ? "border-primary" : "border-transparent"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
