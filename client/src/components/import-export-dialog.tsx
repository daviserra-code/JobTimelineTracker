import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useActivities } from "@/hooks/use-activities";
import { Activity, InsertActivity, ImportExportFormat } from "@shared/schema";
import { downloadFile } from "@/lib/export";
import * as XLSX from 'xlsx';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
}

export default function ImportExportDialog({ open, onOpenChange, activities }: ImportExportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { importActivities } = useActivities();
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setSelectedFile(event.dataTransfer.files[0]);
    }
  };
  
  const exportActivities = (format: ImportExportFormat) => {
    if (activities.length === 0) {
      toast({
        title: "No Activities",
        description: "There are no activities to export",
        variant: "destructive",
      });
      return;
    }
    
    const filename = `jobtrack_activities_${new Date().toISOString().slice(0, 10)}`;
    
    try {
      switch (format) {
        case "xlsx":
          const workbook = XLSX.utils.book_new();
          const worksheetXls = XLSX.utils.json_to_sheet(activities);
          XLSX.utils.book_append_sheet(workbook, worksheetXls, "Activities");
          const xlsxData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
          downloadFile(xlsxData, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          break;
        
        case "csv":
          const workbookCsv = XLSX.utils.book_new();
          const worksheetCsv = XLSX.utils.json_to_sheet(activities);
          const csv = XLSX.utils.sheet_to_csv(worksheetCsv);
          downloadFile(csv, `${filename}.csv`, "text/csv");
          break;
        
        case "json":
          const json = JSON.stringify(activities, null, 2);
          downloadFile(json, `${filename}.json`, "application/json");
          break;
      }
      
      toast({
        title: "Export Successful",
        description: `Activities exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  const processImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          let importData: InsertActivity[] = [];
          
          if (extension === 'xlsx' || extension === 'xls') {
            const workbook = XLSX.read(event.target?.result, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            importData = XLSX.utils.sheet_to_json(firstSheet);
          } else if (extension === 'csv') {
            // Parse CSV using XLSX
            const csvData = event.target?.result as string;
            const workbook = XLSX.read(csvData, { type: 'string' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            importData = XLSX.utils.sheet_to_json(firstSheet);
          } else if (extension === 'json') {
            // Assuming event.target.result is a string
            const jsonData = event.target?.result as string;
            importData = JSON.parse(jsonData);
          } else {
            throw new Error('Unsupported file format');
          }
          
          // Process dates to ensure they are valid Date objects
          importData = importData.map(item => ({
            ...item,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate)
          }));
          
          importActivities(importData);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onOpenChange(false);
        } catch (error) {
          toast({
            title: "Import Failed",
            description: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Import Failed",
          description: "Failed to read file",
          variant: "destructive",
        });
        setIsUploading(false);
      };
      
      if (extension === 'xlsx' || extension === 'xls') {
        reader.readAsArrayBuffer(selectedFile);
      } else {
        reader.readAsText(selectedFile);
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import / Export Activities</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <div className="mb-6">
            <h3 className="font-medium mb-3">Import Activities</h3>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-icons text-gray-400 text-4xl mb-2">cloud_upload</span>
              {selectedFile ? (
                <p className="text-sm text-gray-600 mb-3">Selected: {selectedFile.name}</p>
              ) : (
                <p className="text-sm text-gray-600 mb-3">Drag and drop your file here, or click to browse</p>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv,.xlsx,.xls,.json"
                className="hidden"
              />
              <Button 
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select File
              </Button>
              <p className="text-xs text-gray-500 mt-3">Supports XLS, CSV, and JSON formats</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Export Activities</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between hover:bg-gray-50"
                onClick={() => exportActivities("xlsx")}
              >
                <div className="flex items-center">
                  <span className="material-icons text-green-600 mr-2">description</span>
                  <span>Export as Excel (XLS)</span>
                </div>
                <span className="material-icons">arrow_forward</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between hover:bg-gray-50"
                onClick={() => exportActivities("csv")}
              >
                <div className="flex items-center">
                  <span className="material-icons text-blue-600 mr-2">description</span>
                  <span>Export as CSV</span>
                </div>
                <span className="material-icons">arrow_forward</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between hover:bg-gray-50"
                onClick={() => exportActivities("json")}
              >
                <div className="flex items-center">
                  <span className="material-icons text-orange-600 mr-2">description</span>
                  <span>Export as JSON</span>
                </div>
                <span className="material-icons">arrow_forward</span>
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedFile && (
            <Button 
              variant="default" 
              onClick={processImport}
              disabled={isUploading}
            >
              {isUploading ? "Importing..." : "Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
