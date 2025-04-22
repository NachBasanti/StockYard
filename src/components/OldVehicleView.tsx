import { useState } from 'react';
import { useStockyard } from '../context/StockyardContext';
import { PhotoUpload } from './PhotoUpload';
import { Vehicle, VehicleTypes, FuelTypes } from '../types/types';

// Define branches
const branches = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata'];

export const OldVehicleView = () => {
  const { addVehicle } = useStockyard();
  const [photos, setPhotos] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [vehicleForm, setVehicleForm] = useState({
    chassisNumber: '',
    registrationNumber: '',
    vehicleType: '',
    parentProductLine: '',
    productLine: '',
    chassisColor: '',
    fuelType: '',
    kmDriven: 0,
    remarks: '',
    branch: ''
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setVehicleForm(prev => ({
      ...prev,
      [name]: name === 'kmDriven' ? Number(value) : value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - removed chassis number and chassis color as required fields
    if (
      !vehicleForm.registrationNumber || 
      !vehicleForm.vehicleType || 
      !vehicleForm.fuelType || 
      !vehicleForm.branch ||
      photos.length === 0
    ) {
      setFormError('Please fill all required fields and upload at least one photo');
      setTimeout(() => setFormError(null), 3000);
      return;
    }
    
    // Use current date as received date
    const today = new Date().toISOString().split('T')[0];
    
    // Create new vehicle
    const newVehicle: Omit<Vehicle, 'id'> = {
      chassisNumber: vehicleForm.chassisNumber || `REG-${vehicleForm.registrationNumber}`, // Generate a placeholder if empty
      registrationNumber: vehicleForm.registrationNumber,
      parentProductLine: vehicleForm.parentProductLine,
      productLine: vehicleForm.productLine,
      chassisColor: vehicleForm.chassisColor || 'Not specified', // Provide default if empty
      fuelType: vehicleForm.fuelType,
      vehicleType: vehicleForm.vehicleType,
      entryType: 'Old',
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
      registrationNumber: '',
      vehicleType: '',
      parentProductLine: '',
      productLine: '',
      chassisColor: '',
      fuelType: '',
      kmDriven: 0,
      remarks: '',
      branch: ''
    });
    setPhotos([]);
    
    alert('Old vehicle added successfully!');
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add Old Vehicle</h1>
      
      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {/* Registration Number */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="registrationNumber"
            value={vehicleForm.registrationNumber}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter registration number"
          />
        </div>
        
        {/* Chassis Number - optional now */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Chassis Number <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            name="chassisNumber"
            value={vehicleForm.chassisNumber}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter chassis number (optional)"
          />
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
        
        {/* Fuel Type */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Fuel Type <span className="text-red-500">*</span>
          </label>
          <select
            name="fuelType"
            value={vehicleForm.fuelType}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select Fuel Type</option>
            {FuelTypes.map(fuel => (
              <option key={fuel} value={fuel}>{fuel}</option>
            ))}
          </select>
        </div>
        
        {/* Parent Product Line */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Parent Product Line
          </label>
          <input
            type="text"
            name="parentProductLine"
            value={vehicleForm.parentProductLine}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter parent product line"
          />
        </div>
        
        {/* Product Line */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Product Line
          </label>
          <input
            type="text"
            name="productLine"
            value={vehicleForm.productLine}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter product line"
          />
        </div>
        
        {/* Chassis Color - optional now */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Chassis Color <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            name="chassisColor"
            value={vehicleForm.chassisColor}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter chassis color (optional)"
          />
        </div>
        
        {/* Kilometers Driven */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Kilometers Driven <span className="text-red-500">*</span>
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
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
          >
            Add Old Vehicle
          </button>
        </div>
      </form>
    </div>
  );
};