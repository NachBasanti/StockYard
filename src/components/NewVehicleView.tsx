import { useState, useEffect } from 'react';
import { useStockyard } from '../context/StockyardContext';
import { PhotoUpload } from './PhotoUpload';
import { Vehicle, VehicleTypes,  } from '../types/types';

// Define branches
const branches = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata'];

export const NewVehicleView = () => {
  const { vehicles, addVehicle } = useStockyard();
  const [photos, setPhotos] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [vehicleForm, setVehicleForm] = useState({
    chassisNumber: '',
    vehicleType: '',
    kmDriven: 0,
    remarks: '',
    branch: ''
  });
  
  // Auto-populated fields from Excel
  const [excelData, setExcelData] = useState<{
    parentProductLine: string;
    productLine: string;
    chassisColor: string;
    fuelType: string;
  }>({
    parentProductLine: '',
    productLine: '',
    chassisColor: '',
    fuelType: ''
  });
  
  // Chassis number suggestions (from Excel-imported vehicles that haven't been assigned yet)
  const [chassisSuggestions, setChasisSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Get chassis numbers from Excel imports
  useEffect(() => {
    const unassignedChassisNumbers = vehicles
      .filter(v => v.entryType === 'Unassigned')
      .map(v => v.chassisNumber);
    
    console.log("Available chassis numbers:", unassignedChassisNumbers);
    setChasisSuggestions(unassignedChassisNumbers);
  }, [vehicles]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setVehicleForm(prev => ({
      ...prev,
      [name]: name === 'kmDriven' ? Number(value) : value
    }));
    
    // Show chassis suggestions when typing in chassisNumber field
    if (name === 'chassisNumber' && value) {
      const filteredSuggestions = chassisSuggestions.filter(
        chassis => chassis.toLowerCase().includes(value.toLowerCase())
      );
      console.log("Filtered suggestions:", filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };
  
  const selectChassis = (chassis: string) => {
    setVehicleForm(prev => ({
      ...prev,
      chassisNumber: chassis
    }));
    setShowSuggestions(false);
    
    // Find matching vehicle data from Excel
    const matchingVehicle = vehicles.find(v => v.chassisNumber === chassis && v.entryType === 'Unassigned');
    
    if (matchingVehicle) {
      setExcelData({
        parentProductLine: matchingVehicle.parentProductLine || '',
        productLine: matchingVehicle.productLine || '',
        chassisColor: matchingVehicle.chassisColor || '',
        fuelType: matchingVehicle.fuelType || ''
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!vehicleForm.chassisNumber || !vehicleForm.vehicleType || !vehicleForm.branch || photos.length === 0) {
      setFormError('Please fill all required fields and upload at least one photo');
      setTimeout(() => setFormError(null), 3000);
      return;
    }
    
    // Check if chassis number exists in Excel data
    const chassisExists = chassisSuggestions.includes(vehicleForm.chassisNumber);
    
    if (!chassisExists) {
      setFormError('Chassis number not found in Excel data. Please upload Excel file first or enter valid chassis.');
      setTimeout(() => setFormError(null), 3000);
      return;
    }
    
    // Use current date as received date
    const today = new Date().toISOString().split('T')[0];
    
    // Create new vehicle
    const newVehicle: Omit<Vehicle, 'id'> = {
      chassisNumber: vehicleForm.chassisNumber,
      parentProductLine: excelData.parentProductLine,
      productLine: excelData.productLine,
      chassisColor: excelData.chassisColor,
      fuelType: excelData.fuelType,
      vehicleType: vehicleForm.vehicleType,
      entryType: 'New',
      kmDriven: vehicleForm.kmDriven,
      physicalStatus: 'In Branch', // Changed to In Branch
      remarks: vehicleForm.remarks,
      receivedPhotos: photos,
      sentPhotos: [],
      receivedDate: today,
      daysInStockyard: 0, // Start at 0, will increment daily
      branch: vehicleForm.branch
    };
    
    addVehicle(newVehicle);
    
    // Reset form
    setVehicleForm({
      chassisNumber: '',
      vehicleType: '',
      kmDriven: 0,
      remarks: '',
      branch: ''
    });
    setExcelData({
      parentProductLine: '',
      productLine: '',
      chassisColor: '',
      fuelType: ''
    });
    setPhotos([]);
    
    alert('New vehicle added successfully!');
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Vehicle</h1>
      
      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formError}
        </div>
      )}
      
      {chassisSuggestions.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          No unassigned chassis numbers found. Please upload Excel data first.
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {/* Chassis Number with Autocomplete */}
        <div className="mb-4 relative">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Chassis Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="chassisNumber"
            value={vehicleForm.chassisNumber}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter chassis number"
            autoComplete="off"
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute z-10 bg-white border border-gray-300 rounded mt-1 w-full max-h-40 overflow-y-auto shadow-lg">
              {chassisSuggestions
                .filter(chassis => chassis.toLowerCase().includes(vehicleForm.chassisNumber.toLowerCase()))
                .map(chassis => (
                  <div
                    key={chassis}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => selectChassis(chassis)}
                  >
                    {chassis}
                  </div>
                ))
              }
            </div>
          )}
        </div>
        
        {/* Branch field */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Branch <span className="text-red-500">*</span>
          </label>
          <select
            name="branch"
            value={vehicleForm.branch}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select Branch</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>
        
        {/* Excel data (read-only) */}
        {vehicleForm.chassisNumber && excelData.parentProductLine && (
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold text-sm mb-2">Data from Excel (non-editable):</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Parent Product Line:</span> {excelData.parentProductLine}</div>
              <div><span className="font-medium">Product Line:</span> {excelData.productLine}</div>
              <div><span className="font-medium">Chassis Color:</span> {excelData.chassisColor}</div>
              <div><span className="font-medium">Fuel Type:</span> {excelData.fuelType}</div>
            </div>
          </div>
        )}
        
        {/* Vehicle Type */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Vehicle Type <span className="text-red-500">*</span>
          </label>
          <select
            name="vehicleType"
            value={vehicleForm.vehicleType}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select Vehicle Type</option>
            {VehicleTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        {/* Kilometers Driven */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Kilometers Driven
          </label>
          <input
            type="number"
            name="kmDriven"
            value={vehicleForm.kmDriven}
            onChange={handleInputChange}
            min="0"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        {/* Remarks */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Remarks
          </label>
          <textarea
            name="remarks"
            value={vehicleForm.remarks}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
            placeholder="Optional remarks about the vehicle"
          />
        </div>
        
        {/* Photo Upload */}
        <div className="mb-4">
          <PhotoUpload
            name="receivedPhotos"
            label="Upload Vehicle Photos (required)"
            onChange={setPhotos}
          />
          {formError && photos.length === 0 && (
            <p className="text-red-500 text-xs mt-1">At least one photo is required</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
          >
            Add Vehicle
          </button>
        </div>
      </form>
    </div>
  );
};