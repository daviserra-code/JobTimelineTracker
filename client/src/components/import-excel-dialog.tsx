import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { queryClient } from "@/lib/queryClient";

interface ExcelRow {
    Title: string;
    description?: string;
    Description?: string;
    startDate?: string | number;
    "Start Date"?: string | number;
    endDate?: string | number;
    "End Date"?: string | number;
    Type?: string;
    type?: string;
    Status?: string;
    status?: string;
    Location?: string;
    location?: string;
    Category?: string;
    category?: string;
}

export function ImportExcelDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [fileStats, setFileStats] = useState({ total: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

            if (jsonData.length === 0) {
                toast({
                    title: "Empty File",
                    description: "No data found in the Excel file.",
                    variant: "destructive"
                });
                return;
            }

            setPreviewData(jsonData.slice(0, 5));
            setFileStats({ total: jsonData.length });
        } catch (error) {
            console.error("Error reading file:", error);
            toast({
                title: "Read Error",
                description: "Failed to read the Excel file.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!fileInputRef.current?.files?.[0]) return;
        const file = fileInputRef.current.files[0];

        setIsLoading(true);
        try {
            // Re-read data to ensure full dataset
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[workbook.SheetNames[0]]);

            // Transform data to backend format
            const activities = jsonData.map(row => {
                // Helper to parse date (Excel can return number or string)
                const parseDate = (val: string | number | undefined) => {
                    if (!val) return new Date();
                    if (typeof val === 'number') {
                        // Excel date serial number
                        return new Date(Math.round((val - 25569) * 86400 * 1000));
                    }
                    return new Date(val);
                };

                return {
                    title: row.Title || "Untitled Activity",
                    description: row.Description || row.description || "",
                    startDate: parseDate(row["Start Date"] || row.startDate),
                    endDate: parseDate(row["End Date"] || row.endDate),
                    type: (row.Type || row.type || "project").toLowerCase(),
                    status: (row.Status || row.status || "confirmed").toLowerCase(),
                    location: row.Location || row.location || "",
                    category: row.Category || row.category || "Imported"
                };
            });

            // Send to backend
            // We use the specially created admin endpoint for import if available, strictly speaking we should use the one we are about to create
            // Let's use /api/activities/import
            const res = await fetch("/api/activities/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activities })
            });

            if (!res.ok) {
                throw new Error("Import failed");
            }

            const result = await res.json();

            toast({
                title: "Import Successful",
                description: `Imported ${result.activities?.length || 'all'} activities.`,
            });

            setOpen(false);
            setPreviewData([]);
            queryClient.invalidateQueries({ queryKey: ["/api/activities"] });

        } catch (error) {
            console.error("Import error:", error);
            toast({
                title: "Import Failed",
                description: "Failed to import activities to the server.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Import Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Import Activities from Excel</DialogTitle>
                    <DialogDescription>
                        Select an Excel file (.xlsx, .xls) to import. First sheet will be used.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Select File
                        </Button>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        {fileStats.total > 0 && (
                            <span className="text-sm text-muted-foreground">
                                Found {fileStats.total} rows
                            </span>
                        )}
                    </div>

                    {previewData.length > 0 && (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.Title}</TableCell>
                                            <TableCell>{String(row["Start Date"] || row.startDate)}</TableCell>
                                            <TableCell>{row.Type || row.type}</TableCell>
                                            <TableCell>{row.Status || row.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <p className="text-xs text-muted-foreground p-2 bg-muted/50 text-center">
                                Showing first 5 rows
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={isLoading || previewData.length === 0}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
