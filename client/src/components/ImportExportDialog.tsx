import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, exportToJSON, exportToExcel, handleFileImport } from '@/lib/export';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Activity } from '@/lib/types';

type ImportExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ImportExportDialog = ({ isOpen, onClose }: ImportExportDialogProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch activities for export
  const { data: activities = [] } = useQuery({
    queryKey: ['/api/activities'],
    enabled: isOpen
  });
  
  // Import activities mutation
  const importMutation = useMutation({
    mutationFn: async (newActivities: Partial<Activity>[]) => {
      // Create each activity one by one
      const promises = newActivities.map(activity => 
        fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity),
          credentials: 'include'
        })
      );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: 'Import successful',
        description: 'Activities were imported successfully',
        variant: 'default',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Import failed',
        description: 'There was an error importing activities',
        variant: 'destructive',
      });
      console.error('Import error:', error);
    }
  });
  
  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsImporting(true);
    
    try {
      const importedActivities = await handleFileImport(file);
      
      // Validate imported activities
      const validActivities = importedActivities.filter(activity => 
        activity.title && activity.startDate && activity.endDate && activity.type
      );
      
      if (validActivities.length === 0) {
        toast({
          title: 'Import failed',
          description: 'No valid activities found in the file',
          variant: 'destructive',
        });
        return;
      }
      
      importMutation.mutate(validActivities);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Failed to parse the file. Please check the format.',
        variant: 'destructive',
      });
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle export
  const handleExport = (format: 'csv' | 'json' | 'xls') => {
    setIsExporting(true);
    
    try {
      switch (format) {
        case 'csv':
          const csvContent = exportToCSV(activities);
          const csvBlob = new Blob([csvContent], { type: 'text/csv' });
          const csvUrl = URL.createObjectURL(csvBlob);
          const csvLink = document.createElement('a');
          csvLink.href = csvUrl;
          csvLink.download = 'activities.csv';
          csvLink.click();
          URL.revokeObjectURL(csvUrl);
          break;
          
        case 'json':
          const jsonContent = exportToJSON(activities);
          const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.href = jsonUrl;
          jsonLink.download = 'activities.json';
          jsonLink.click();
          URL.revokeObjectURL(jsonUrl);
          break;
          
        case 'xls':
          exportToExcel(activities);
          break;
      }
      
      toast({
        title: 'Export successful',
        description: `Activities exported as ${format.toUpperCase()}`,
        variant: 'default',
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting activities',
        variant: 'destructive',
      });
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle browse file click
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import / Export Activities</DialogTitle>
          <DialogDescription>
            Import activities from a file or export your current activities.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-6">
            <h3 className="font-medium mb-3">Import Activities</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <span className="material-icons text-gray-400 text-4xl mb-2">cloud_upload</span>
              <p className="text-sm text-gray-600 mb-3">Drag and drop your file here, or click to browse</p>
              <input
                type="file"
                accept=".csv,.json,.xls,.xlsx"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <Button 
                onClick={handleBrowseClick}
                disabled={isImporting}
                className="bg-primary text-white"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Importing...
                  </>
                ) : (
                  'Select File'
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-3">Supports XLS, CSV, and JSON formats</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Export Activities</h3>
            <div className="space-y-3">
              <button 
                className="w-full flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
                onClick={() => handleExport('xls')}
                disabled={isExporting || activities.length === 0}
              >
                <div className="flex items-center">
                  <span className="material-icons text-green-600 mr-2">description</span>
                  <span>Export as Excel (XLS)</span>
                </div>
                <span className="material-icons">arrow_forward</span>
              </button>
              <button 
                className="w-full flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
                onClick={() => handleExport('csv')}
                disabled={isExporting || activities.length === 0}
              >
                <div className="flex items-center">
                  <span className="material-icons text-blue-600 mr-2">description</span>
                  <span>Export as CSV</span>
                </div>
                <span className="material-icons">arrow_forward</span>
              </button>
              <button 
                className="w-full flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
                onClick={() => handleExport('json')}
                disabled={isExporting || activities.length === 0}
              >
                <div className="flex items-center">
                  <span className="material-icons text-orange-600 mr-2">description</span>
                  <span>Export as JSON</span>
                </div>
                <span className="material-icons">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExportDialog;
