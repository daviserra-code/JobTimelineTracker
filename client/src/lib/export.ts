import { Activity } from './types';
import * as XLSX from 'xlsx';

// Convert activities to CSV format
export const exportToCSV = (activities: Activity[]): string => {
  // Format activities for export
  const formattedActivities = activities.map(activity => ({
    'Title': activity.title,
    'Description': activity.description || '',
    'Start Date': new Date(activity.startDate).toISOString(),
    'End Date': new Date(activity.endDate).toISOString(),
    'Type': activity.type,
    'Category': activity.category || '',
    'Location': activity.location || '',
    'Notification Enabled': activity.notificationEnabled ? 'Yes' : 'No',
    'Region': activity.region || ''
  }));
  
  // Create CSV header row
  const header = Object.keys(formattedActivities[0] || {}).join(',');
  
  // Create CSV rows
  const rows = formattedActivities.map(activity => 
    Object.values(activity)
      .map(value => `"${String(value).replace(/"/g, '""')}"`)
      .join(',')
  );
  
  // Combine header and rows
  return [header, ...rows].join('\n');
};

// Convert activities to JSON format
export const exportToJSON = (activities: Activity[]): string => {
  return JSON.stringify(activities, null, 2);
};

// Convert activities to Excel format and trigger download
export const exportToExcel = (activities: Activity[]): void => {
  // Format activities for export
  const formattedActivities = activities.map(activity => ({
    'Title': activity.title,
    'Description': activity.description || '',
    'Start Date': new Date(activity.startDate).toISOString(),
    'End Date': new Date(activity.endDate).toISOString(),
    'Type': activity.type,
    'Category': activity.category || '',
    'Location': activity.location || '',
    'Notification Enabled': activity.notificationEnabled ? 'Yes' : 'No',
    'Region': activity.region || ''
  }));
  
  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedActivities);
  
  // Create a workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');
  
  // Generate and download file
  XLSX.writeFile(workbook, 'job_activities.xlsx');
};

// Parse CSV data into activities
export const importFromCSV = (csvText: string): Partial<Activity>[] => {
  // Split by lines
  const lines = csvText.split('\n');
  
  // Get header row and split by commas
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Parse data rows
  const activities: Partial<Activity>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Split row by commas, properly handling quoted values
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue);
    
    // Create activity from row values
    const activity: Partial<Activity> = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      switch (header) {
        case 'Title':
          activity.title = value;
          break;
        case 'Description':
          activity.description = value;
          break;
        case 'Start Date':
          activity.startDate = new Date(value);
          break;
        case 'End Date':
          activity.endDate = new Date(value);
          break;
        case 'Type':
          activity.type = value as ActivityType;
          break;
        case 'Category':
          activity.category = value;
          break;
        case 'Location':
          activity.location = value;
          break;
        case 'Notification Enabled':
          activity.notificationEnabled = value === 'Yes';
          break;
        case 'Region':
          activity.region = value;
          break;
      }
    });
    
    activities.push(activity);
  }
  
  return activities;
};

// Parse JSON data into activities
export const importFromJSON = (jsonText: string): Partial<Activity>[] => {
  try {
    const parsed = JSON.parse(jsonText);
    
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        ...item,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        notificationDate: item.notificationDate ? new Date(item.notificationDate) : undefined
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return [];
  }
};

// Handle file import
export const handleFileImport = (file: File): Promise<Partial<Activity>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        
        if (file.name.endsWith('.csv')) {
          resolve(importFromCSV(fileContent));
        } else if (file.name.endsWith('.json')) {
          resolve(importFromJSON(fileContent));
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Parse Excel file
          const workbook = XLSX.read(fileContent, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Convert to activities
          const activities = jsonData.map(row => ({
            title: row['Title'] as string,
            description: row['Description'] as string,
            startDate: new Date(row['Start Date'] as string),
            endDate: new Date(row['End Date'] as string),
            type: row['Type'] as ActivityType,
            category: row['Category'] as string,
            location: row['Location'] as string,
            notificationEnabled: row['Notification Enabled'] === 'Yes',
            region: row['Region'] as string
          }));
          
          resolve(activities);
        } else {
          reject(new Error('Unsupported file format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    // Read the file
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  });
};

// Export function for file download
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
