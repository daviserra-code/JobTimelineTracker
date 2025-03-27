import { Link, useLocation } from "wouter";
import { Calendar, BellRing, FileUp, Settings, PlusCircle } from "lucide-react";
import { ViewMode } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import ActivityForm from "./activity-form";

interface MobileNavProps {
  currentViewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function MobileNav({ currentViewMode, onViewModeChange }: MobileNavProps) {
  const [location] = useLocation();
  const [formOpen, setFormOpen] = useState(false);
  
  return (
    <>
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-background border-t shadow-lg z-10">
        <div className="flex justify-around items-center">
          <Link href="/" className={`flex flex-col items-center p-3 ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Timeline</span>
          </Link>
          
          <Button 
            onClick={() => setFormOpen(true)}
            variant="ghost" 
            className="flex flex-col items-center rounded-full bg-primary text-primary-foreground p-2 -mt-5"
            data-new-activity="true"
            title="Add new activity (N key)"
          >
            <PlusCircle className="h-8 w-8" />
          </Button>
          
          <div 
            className="flex flex-col items-center p-3 cursor-pointer" 
            onClick={() => onViewModeChange(currentViewMode === "timeline" ? "month" : "timeline")}
            data-view-toggle="true"
            title="Toggle view mode (T key)"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">{currentViewMode === "timeline" ? "Month" : "Timeline"}</span>
          </div>
          
          <Link href="/settings" className={`flex flex-col items-center p-3 ${location === "/settings" ? "text-primary" : "text-muted-foreground"}`}>
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">Settings</span>
          </Link>
        </div>
      </div>
      
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px]">
          <ActivityForm open={formOpen} onOpenChange={setFormOpen} actionType="create" />
        </DialogContent>
      </Dialog>
    </>
  );
}
