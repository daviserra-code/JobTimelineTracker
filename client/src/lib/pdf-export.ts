import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Activity, ActivityType } from '@shared/schema';
import { format } from 'date-fns';
import { ACTIVITY_TYPES } from './constants';

// Add type definition for jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Helper function to calculate activity duration in days
function calculateDurationInDays(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
}

// Generate activity statistics
interface ActivityStats {
  totalActivities: number;
  byType: Record<string, { count: number, totalDays: number }>;
  byStatus: Record<string, number>;
  byYear: Record<number, number>;
  longestActivity: { title: string, duration: number, type: string } | null;
  shortestActivity: { title: string, duration: number, type: string } | null;
  averageDuration: number;
}

function generateActivityStats(activities: Activity[]): ActivityStats {
  // Skip if no activities
  if (!activities.length) return { 
    totalActivities: 0,
    byType: {},
    byStatus: {},
    byYear: {},
    longestActivity: null,
    shortestActivity: null,
    averageDuration: 0
  };

  const stats: ActivityStats = {
    totalActivities: activities.length,
    byType: {},
    byStatus: {},
    byYear: {},
    longestActivity: null,
    shortestActivity: null,
    averageDuration: 0
  };
  
  let totalDuration = 0;
  let longestDuration = 0;
  let shortestDuration = Number.MAX_SAFE_INTEGER;

  // Initialize counters for all activity types
  Object.keys(ACTIVITY_TYPES).forEach(type => {
    stats.byType[type as ActivityType] = { count: 0, totalDays: 0 };
  });
  
  activities.forEach(activity => {
    const startDate = new Date(activity.startDate);
    const endDate = new Date(activity.endDate);
    const durationDays = calculateDurationInDays(startDate, endDate);
    totalDuration += durationDays;
    
    // By type
    const activityType = activity.type as ActivityType;
    if (!stats.byType[activityType]) {
      stats.byType[activityType] = { count: 0, totalDays: 0 };
    }
    stats.byType[activityType].count++;
    stats.byType[activityType].totalDays += durationDays;
    
    // By status
    if (!stats.byStatus[activity.status]) {
      stats.byStatus[activity.status] = 0;
    }
    stats.byStatus[activity.status]++;
    
    // By year
    const year = startDate.getFullYear();
    if (!stats.byYear[year]) {
      stats.byYear[year] = 0;
    }
    stats.byYear[year]++;
    
    // Track longest and shortest activities
    if (durationDays > longestDuration) {
      longestDuration = durationDays;
      stats.longestActivity = { 
        title: activity.title, 
        duration: durationDays,
        type: ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES]?.label || activity.type
      };
    }
    
    if (durationDays < shortestDuration) {
      shortestDuration = durationDays;
      stats.shortestActivity = { 
        title: activity.title, 
        duration: durationDays,
        type: ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES]?.label || activity.type
      };
    }
  });
  
  // Calculate average duration
  stats.averageDuration = totalDuration / activities.length;
  
  return stats;
}

// Generate PDF with activity statistics
export function generateActivityStatisticsPDF(activities: Activity[]): void {
  try {
    console.log(`Generating PDF for ${activities.length} activities`);
    
    // Validate input
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      throw new Error('No activities to process');
    }
    
    // Create new PDF document
    const doc = new jsPDF();
    const stats = generateActivityStats(activities);
    
    // Add title and timestamp
    doc.setFontSize(20);
    doc.text('Activity Calendar Statistics', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')} for Davide Serra`, 105, 22, { align: 'center' });
    
    // Add summary section
    doc.setFontSize(14);
    doc.text('Summary', 14, 35);
    doc.setFontSize(11);
    doc.text(`Total Activities: ${stats.totalActivities}`, 14, 45);
    
    if (stats.averageDuration) {
      doc.text(`Average Duration: ${stats.averageDuration.toFixed(1)} days`, 14, 52);
    }
    
    if (stats.longestActivity) {
      doc.text(`Longest Activity: ${stats.longestActivity.title} (${stats.longestActivity.duration} days)`, 14, 59);
    }
    
    if (stats.shortestActivity) {
      doc.text(`Shortest Activity: ${stats.shortestActivity.title} (${stats.shortestActivity.duration} days)`, 14, 66);
    }
    
    // Activities by Type Table
    doc.setFontSize(14);
    doc.text('Activities by Type', 14, 80);
    
    const typeTableData = Object.entries(stats.byType)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => {
        const typeLabel = ACTIVITY_TYPES[type as keyof typeof ACTIVITY_TYPES]?.label || type;
        return [typeLabel, data.count.toString(), data.totalDays.toString(), (data.totalDays / data.count).toFixed(1)];
      });
    
    // Create first table
    doc.autoTable({
      startY: 85,
      head: [['Type', 'Count', 'Total Days', 'Avg. Duration']],
      body: typeTableData
    });
    
    // Add a page for the other tables
    doc.addPage();
    
    // Activities by Status Table
    doc.setFontSize(14);
    doc.text('Activities by Status', 14, 20);
    
    const statusTableData = Object.entries(stats.byStatus)
      .map(([status, count]) => [
        status.charAt(0).toUpperCase() + status.slice(1), 
        count.toString(), 
        `${((count / stats.totalActivities) * 100).toFixed(1)}%`
      ]);
    
    doc.autoTable({
      startY: 25,
      head: [['Status', 'Count', 'Percentage']],
      body: statusTableData
    });
    
    // Activities by Year Table
    doc.setFontSize(14);
    doc.text('Activities by Year', 14, 100);
    
    const yearTableData = Object.entries(stats.byYear)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, count]) => [year, count.toString()]);
    
    doc.autoTable({
      startY: 105,
      head: [['Year', 'Count']],
      body: yearTableData
    });
    
    // Add footer with page number
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF
    doc.save('activity-statistics.pdf');
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error; // Re-throw to allow the calling function to handle the error
  }
}