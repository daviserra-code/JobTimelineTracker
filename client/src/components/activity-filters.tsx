import { useState, useEffect } from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Input
} from "@/components/ui/input";
import {
  Label
} from "@/components/ui/label";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";
import {
  Button
} from "@/components/ui/button";
import { 
  ACTIVITY_TYPES, 
  ACTIVITY_STATUSES 
} from "@/lib/constants";
import { ActivityType, ActivityStatus } from "@shared/schema";
import { Search, Filter, X, RefreshCw } from "lucide-react";

export type ActivityFilters = {
  searchQuery: string;
  types: ActivityType[];
  statuses: ActivityStatus[];
  category: string;
  location: string;
};

const defaultFilters: ActivityFilters = {
  searchQuery: "",
  types: [],
  statuses: [],
  category: "",
  location: "",
};

type ActivityFiltersProps = {
  onFilterChange: (filters: ActivityFilters) => void;
};

export function ActivityFilters({ onFilterChange }: ActivityFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<ActivityFilters>(defaultFilters);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Count active filters for the badge
  useEffect(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.types.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.category) count++;
    if (filters.location) count++;
    setActiveFilterCount(count);
  }, [filters]);

  // Update parent component with filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, category: e.target.value }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, location: e.target.value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search activities..."
          value={filters.searchQuery}
          onChange={handleSearchChange}
          className="pl-8 w-[250px] lg:w-[300px]"
        />
        {filters.searchQuery && (
          <button
            onClick={() => setFilters(prev => ({ ...prev, searchQuery: "" }))}
            className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1 px-3">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[340px] p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={resetFilters}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Reset
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Activity Types</Label>
              <ToggleGroup type="multiple" className="justify-start flex-wrap">
                {Object.entries(ACTIVITY_TYPES).map(([key, { label }]) => (
                  <ToggleGroupItem
                    key={key}
                    value={key}
                    data-state={filters.types.includes(key as ActivityType) ? "on" : "off"}
                    onClick={() => handleTypeToggle(key as ActivityType)}
                    className="text-xs"
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label>Activity Status</Label>
              <ToggleGroup type="multiple" className="justify-start flex-wrap">
                {Object.entries(ACTIVITY_STATUSES).map(([key, { label }]) => (
                  <ToggleGroupItem
                    key={key}
                    value={key}
                    data-state={filters.statuses.includes(key as ActivityStatus) ? "on" : "off"}
                    onClick={() => handleStatusToggle(key as ActivityStatus)}
                    className="text-xs"
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* Date range functionality to be added later */}

            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                placeholder="Enter category..."
                value={filters.category}
                onChange={handleCategoryChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="Enter location..."
                value={filters.location}
                onChange={handleLocationChange}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setIsOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}