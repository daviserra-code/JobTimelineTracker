
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = "C:\\Users\\Davide\\VS-Code Solutions\\JobTimelineTracker\\JobTimelineTracker\\server\\extras\\Activities-24-25- Davide Serra Rev0.xlsx";

try {
    console.log("Reading file from:", filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    console.log("Sheet Name:", sheetName);

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // header: 1 gives array of arrays

    if (jsonData.length > 0) {
        console.log("Header Row:", JSON.stringify(jsonData[0], null, 2));
        if (jsonData.length > 1) {
            console.log("First Data Row:", JSON.stringify(jsonData[1], null, 2));
        }
    } else {
        console.log("Sheet is empty");
    }

} catch (error) {
    console.error("Error reading excel:", error);
}
