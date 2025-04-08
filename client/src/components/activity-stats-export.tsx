import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from '@shared/schema';
import { generateActivityStatisticsPDF } from '@/lib/pdf-export';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Constants for admin check - hardcoded for reliability
const ADMIN_TOKEN_KEY = 'admin_token_dvd70ply';
const ADMIN_TOKEN_VALUE = 'Administrator-dvd70ply';
const ADMIN_KEY = 'dvd70ply'; // Secret key used for direct verification

interface ActivityStatsExportProps {
  activities: Activity[];
  className?: string;
}

export default function ActivityStatsExport({ activities, className = '' }: ActivityStatsExportProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Directly check admin status on each render - no state or effects
  // This makes the component more resilient to state updates and async issues
  let isAdmin = false;
  
  try {
    // Method 1: Check localStorage token
    if (localStorage.getItem(ADMIN_TOKEN_KEY) === ADMIN_TOKEN_VALUE) {
      isAdmin = true;
    }
    
    // Method 2: Check URL for admin key (for deployed environments)
    if (window.location.href.includes(ADMIN_KEY)) {
      isAdmin = true;
      // Also set localStorage for future use
      localStorage.setItem(ADMIN_TOKEN_KEY, ADMIN_TOKEN_VALUE);
      localStorage.setItem('admin_username', 'Administrator');
    }
    
    // Method 3: Look for a specially named cookie (fallback)
    if (document.cookie.includes('admin_auth_dvd70ply=true')) {
      isAdmin = true;
    }
  } catch (err) {
    console.error('Error checking admin status:', err);
  }
  
  // Hide the component for non-admin users
  if (!isAdmin) {
    return null;
  }

  const handleExportPDF = async () => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);

      if (!activities || activities.length === 0) {
        toast({
          title: "No activities available",
          description: "There are no activities available to generate statistics.",
          variant: "destructive"
        });
        return;
      }
      
      // Add a slight delay to allow the UI to update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      generateActivityStatisticsPDF(activities);
      
      toast({
        title: "Statistics exported",
        description: "Your activity statistics have been exported successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export failed",
        description: "Unable to generate PDF. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            className={`flex items-center ${className}`}
            onClick={handleExportPDF}
            data-export-statistics="true"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <span className="material-icons text-sm mr-1">assessment</span>
            )}
            <span className="hidden sm:inline">
              {isGenerating ? "Exporting..." : "Export Statistics"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export activity statistics to PDF (Admin only)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}