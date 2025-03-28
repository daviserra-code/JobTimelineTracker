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
import { motion, AnimatePresence } from "framer-motion";
import { fadeInDown, staggerContainer, fadeIn } from "@/lib/animations";

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
    <motion.div 
      className="flex items-center gap-2"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="relative"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "auto", opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search activities..."
          value={filters.searchQuery}
          onChange={handleSearchChange}
          className="pl-8 w-[250px] lg:w-[300px]"
        />
        <AnimatePresence>
          {filters.searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: "" }))}
              className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button variant="outline" size="sm" className="h-9 gap-1 px-3">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.span 
                    className="ml-1 rounded-full bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[340px] p-4">
          <motion.div 
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeIn} className="flex items-center justify-between">
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
            </motion.div>

            <motion.div variants={fadeIn} className="space-y-2">
              <Label>Activity Types</Label>
              <ToggleGroup type="multiple" className="justify-start flex-wrap">
                {Object.entries(ACTIVITY_TYPES).map(([key, { label }], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <ToggleGroupItem
                      value={key}
                      data-state={filters.types.includes(key as ActivityType) ? "on" : "off"}
                      onClick={() => handleTypeToggle(key as ActivityType)}
                      className="text-xs"
                    >
                      {label}
                    </ToggleGroupItem>
                  </motion.div>
                ))}
              </ToggleGroup>
            </motion.div>

            <motion.div variants={fadeIn} className="space-y-2">
              <Label>Activity Status</Label>
              <ToggleGroup type="multiple" className="justify-start flex-wrap">
                {Object.entries(ACTIVITY_STATUSES).map(([key, { label }], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.03 }}
                  >
                    <ToggleGroupItem
                      value={key}
                      data-state={filters.statuses.includes(key as ActivityStatus) ? "on" : "off"}
                      onClick={() => handleStatusToggle(key as ActivityStatus)}
                      className="text-xs"
                    >
                      {label}
                    </ToggleGroupItem>
                  </motion.div>
                ))}
              </ToggleGroup>
            </motion.div>

            {/* Date range functionality to be added later */}

            <motion.div variants={fadeIn} className="space-y-2">
              <Label>Category</Label>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Input
                  placeholder="Enter category..."
                  value={filters.category}
                  onChange={handleCategoryChange}
                />
              </motion.div>
            </motion.div>

            <motion.div variants={fadeIn} className="space-y-2">
              <Label>Location</Label>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Input
                  placeholder="Enter location..."
                  value={filters.location}
                  onChange={handleLocationChange}
                />
              </motion.div>
            </motion.div>

            <motion.div 
              variants={fadeIn} 
              className="flex justify-end pt-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button size="sm" onClick={() => setIsOpen(false)}>
                Apply Filters
              </Button>
            </motion.div>
          </motion.div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}