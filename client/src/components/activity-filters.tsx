import React, { useState } from "react";
import { Search, X, Filter, CalendarDays } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@/lib/constants";
import { ActivityStatus, ActivityType } from "@shared/schema";

export type ActivityFilters = {
  searchQuery: string;
  types: ActivityType[];
  statuses: ActivityStatus[];
  dateRange: DateRange | undefined;
  category: string;
  location: string;
};

const defaultFilters: ActivityFilters = {
  searchQuery: "",
  types: [],
  statuses: [],
  dateRange: undefined,
  category: "",
  location: ""
};

type ActivityFiltersProps = {
  onFilterChange: (filters: ActivityFilters) => void;
};

export function ActivityFilters({ onFilterChange }: ActivityFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<ActivityFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<ActivityFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState("");
  
  const hasActiveFilters = appliedFilters.searchQuery || 
    appliedFilters.types.length > 0 || 
    appliedFilters.statuses.length > 0 || 
    appliedFilters.dateRange ||
    appliedFilters.category ||
    appliedFilters.location;
  
  const handleTypeToggle = (type: ActivityType) => {
    setFilters(prev => {
      const types = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type];
      return { ...prev, types };
    });
  };
  
  const handleStatusToggle = (status: ActivityStatus) => {
    setFilters(prev => {
      const statuses = prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status];
      return { ...prev, statuses };
    });
  };
  
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  };
  
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...appliedFilters, searchQuery });
    setAppliedFilters(prev => ({ ...prev, searchQuery }));
  };
  
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    onFilterChange(filters);
    setIsOpen(false);
  };
  
  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setSearchQuery("");
    onFilterChange(defaultFilters);
    setIsOpen(false);
  };
  
  const activeFilterCount = [
    appliedFilters.types.length > 0,
    appliedFilters.statuses.length > 0,
    appliedFilters.dateRange !== undefined,
    appliedFilters.category !== undefined && appliedFilters.category !== "",
    appliedFilters.location !== undefined && appliedFilters.location !== ""
  ].filter(Boolean).length;
  
  return (
    <div className="w-full">
      <div className="flex gap-2 items-center mb-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities... (Press S)" 
            className="pl-8 pr-10"
            value={searchQuery}
            onChange={handleSearchQueryChange}
            data-search-input="true"
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => {
                setSearchQuery("");
                if (appliedFilters.searchQuery) {
                  const newFilters = { ...appliedFilters, searchQuery: "" };
                  setAppliedFilters(newFilters);
                  onFilterChange(newFilters);
                }
              }}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Activities</SheetTitle>
              <SheetDescription>
                Narrow down activities by type, status, and date range.
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-4 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Activity Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ACTIVITY_TYPES).map(([type, { label, color }]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`type-${type}`} 
                        checked={filters.types.includes(type as ActivityType)}
                        onCheckedChange={() => handleTypeToggle(type as ActivityType)}
                      />
                      <Label htmlFor={`type-${type}`} className="flex items-center space-x-1 cursor-pointer">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span>{label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Activity Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ACTIVITY_STATUSES).map(([status, { label, color }]) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`status-${status}`} 
                        checked={filters.statuses.includes(status as ActivityStatus)}
                        onCheckedChange={() => handleStatusToggle(status as ActivityStatus)}
                      />
                      <Label htmlFor={`status-${status}`} className="flex items-center space-x-1 cursor-pointer">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span>{label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Category</h3>
                <Input
                  placeholder="Filter by category"
                  value={filters.category || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Location</h3>
                <Input
                  placeholder="Filter by location"
                  value={filters.location || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Date Range</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {filters.dateRange?.from ? (
                        filters.dateRange.to ? (
                          <>
                            {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                            {format(filters.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(filters.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={filters.dateRange?.from}
                      selected={filters.dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                {filters.dateRange && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleDateRangeChange(undefined)}
                  >
                    Clear date range
                  </Button>
                )}
              </div>
            </div>
            
            <SheetFooter>
              <div className="flex justify-between w-full">
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset
                </Button>
                <Button onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 mb-4">
          {appliedFilters.searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {appliedFilters.searchQuery}
              <button 
                onClick={() => {
                  const newFilters = { ...appliedFilters, searchQuery: "" };
                  setAppliedFilters(newFilters);
                  onFilterChange(newFilters);
                  setSearchQuery("");
                }}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {appliedFilters.types.map(type => (
            <Badge key={type} variant="secondary" className="flex items-center gap-1">
              {ACTIVITY_TYPES[type]?.label}
              <button 
                onClick={() => {
                  const newTypes = appliedFilters.types.filter(t => t !== type);
                  const newFilters = { ...appliedFilters, types: newTypes };
                  setAppliedFilters(newFilters);
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {appliedFilters.statuses.map(status => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              {ACTIVITY_STATUSES[status]?.label}
              <button 
                onClick={() => {
                  const newStatuses = appliedFilters.statuses.filter(s => s !== status);
                  const newFilters = { ...appliedFilters, statuses: newStatuses };
                  setAppliedFilters(newFilters);
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {appliedFilters.dateRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {format(appliedFilters.dateRange.from!, "MMM d, yyyy")}
              {appliedFilters.dateRange.to && ` - ${format(appliedFilters.dateRange.to, "MMM d, yyyy")}`}
              <button 
                onClick={() => {
                  const newFilters = { ...appliedFilters, dateRange: undefined };
                  setAppliedFilters(newFilters);
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {appliedFilters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {appliedFilters.category}
              <button 
                onClick={() => {
                  const newFilters = { ...appliedFilters, category: "" };
                  setAppliedFilters(newFilters);
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {appliedFilters.location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Location: {appliedFilters.location}
              <button 
                onClick={() => {
                  const newFilters = { ...appliedFilters, location: "" };
                  setAppliedFilters(newFilters);
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {activeFilterCount > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-6 px-2"
              onClick={handleResetFilters}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}