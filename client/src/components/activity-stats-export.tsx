import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from '@shared/schema';
import { generateActivityStatisticsPDF } from '@/lib/pdf-export';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ActivityStatsExportProps {
  activities: Activity[];
  className?: string;
}

export default function ActivityStatsExport({ activities, className = '' }: ActivityStatsExportProps) {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  
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