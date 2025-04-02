import React from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from '@shared/schema';
import { generateActivityStatisticsPDF } from '@/lib/pdf-export';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActivityStatsExportProps {
  activities: Activity[];
  className?: string;
}

export default function ActivityStatsExport({ activities, className = '' }: ActivityStatsExportProps) {
  const handleExportPDF = () => {
    try {
      generateActivityStatisticsPDF(activities);
    } catch (error) {
      console.error('Error generating PDF:', error);
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
          >
            <span className="material-icons text-sm mr-1">assessment</span>
            <span className="hidden sm:inline">Export Statistics</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export activity statistics to PDF</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}