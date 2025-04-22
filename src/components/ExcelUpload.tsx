import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useStockyard } from '../context/StockyardContext';
import { Vehicle } from '../types/types';

export const ExcelUpload = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { addVehiclesFromExcel } = useStockyard();
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(null); // Reset status

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (data.length === 0) {
          setUploadStatus({
            success: false,
            message: 'Excel file contains no data',
          });
          return;
        }

        // Log the first row to see the structure
        console.log("First Excel row:", data[0]);

        const parsedVehicles: Vehicle[] = data
          .filter((row: any) => row['Chassis No.'] || row['Chassis_No'] || row['ChassisNo'])
          .map((row: any) => {
            // Extract chassis number from various possible column names
            const chassisNumber = row['Chassis No.'] || row['Chassis_No'] || row['ChassisNo'] || '';
            
            return {
              id: crypto.randomUUID(),
              chassisNumber: chassisNumber,
              parentProductLine: row['Parent Product Line'] || row['ParentProductLine'] || '',
              productLine: row['Product Line'] || row['ProductLine'] || '',
              chassisColor: row['Chasis Color'] || row['Chassis Color'] || row['Color'] || '',
              fuelType: row['Fuel Type'] || row['FuelType'] || '',
              vehicleType: row['Vehicle Type'] || row['VehicleType'] || '',
              entryType: 'Unassigned', // Set to Unassigned for auto-completion in NewVehicleView
              physicalStatus: 'In Transit',
              kmDriven: 0,
              receivedPhotos: [],
              sentPhotos: [],
              receivedDate: new Date().toISOString().split('T')[0]
            };
          });

        if (parsedVehicles.length === 0) {
          setUploadStatus({
            success: false,
            message: 'No valid vehicle data found in the Excel file',
          });
          return;
        }

        addVehiclesFromExcel(parsedVehicles);
        
        setUploadStatus({
          success: true,
          message: `Successfully imported ${parsedVehicles.length} vehicles`,
          count: parsedVehicles.length
        });
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error parsing Excel:', error);
        setUploadStatus({
          success: false,
          message: `Error parsing Excel: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    };
    
    reader.onerror = () => {
      setUploadStatus({
        success: false,
        message: 'Error reading file',
      });
    };
    
    reader.readAsBinaryString(file);
  };

  return (
    <div className="mb-4">
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                   file:rounded file:border-0 file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      {uploadStatus && (
        <div className={`mt-2 p-2 rounded text-sm ${
          uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {uploadStatus.message}
        </div>
      )}
    </div>
  );
};