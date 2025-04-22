import { useState, useMemo } from 'react';
import { useStockyard } from '../context/StockyardContext';
import { Vehicle, VehicleTypes, EntryTypes, FuelTypes, PhysicalStatuses } from '../types/types';
import { ExcelUpload } from './Excelupload';
import { PhotoUpload } from './PhotoUpload';

export const StockyardStatus = () => {
  const { vehicles, updateVehicleDetails } = useStockyard();
  const [filters, setFilters] = useState({
    vehicleType: '',
    entryType: '',
    fuelType: '',
    physicalStatus: '',
    search: '',
  });
  
  const [photoModal, setPhotoModal] = useState<{
    open: boolean;
    photos: string[];
    title: string;
    currentIndex: number;
  }>({
    open: false,
    photos: [],
    title: '',
    currentIndex: 0
  });
  
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Vehicle;
    direction: 'ascending' | 'descending';
  } | null>(null);
  
  // Modal state for remarks
  const [remarksModal, setRemarksModal] = useState<{
    open: boolean;
    content: string;
    title: string;
  }>({
    open: false,
    content: '',
    title: ''
  });
  
  // Delivery modal state
  const [deliveryModal, setDeliveryModal] = useState<{
    open: boolean;
    vehicleId: string;
    remarks: string;
    photos: string[];
    error: string | null;
  }>({
    open: false,
    vehicleId: '',
    remarks: '',
    photos: [],
    error: null
  });

  // Update filter
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle sorting
  const requestSort = (key: keyof Vehicle) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  // Handle status change
  const handlePhysicalStatusChange = (id: string, status: string, vehicle: Vehicle) => {
    // If changing to "Delivered", show delivery modal
    if (status === 'Delivered') {
      // Check if vehicle is unassigned
      if (vehicle.entryType === 'Unassigned') {
        alert('Cannot mark an unassigned vehicle as delivered. Please assign it first.');
        return;
      }
      
      setDeliveryModal({
        open: true,
        vehicleId: id,
        remarks: '',
        photos: [],
        error: null
      });
    } else {
      // For other statuses, update directly
      updateVehicleDetails(id, { physicalStatus: status as Vehicle['physicalStatus'] });
    }
  };
  
  // Handle delivery confirmation
  const handleDeliveryConfirm = () => {
    // Validate delivery form
    if (deliveryModal.remarks.trim() === '' || deliveryModal.photos.length === 0) {
      setDeliveryModal(prev => ({
        ...prev,
        error: 'Please fill all required fields and upload at least one photo'
      }));
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    updateVehicleDetails(deliveryModal.vehicleId, {
      physicalStatus: 'Delivered',
      deliveredDate: today,
      deliveryRemarks: deliveryModal.remarks,
      sentPhotos: deliveryModal.photos
    });
    
    setDeliveryModal({
      open: false,
      vehicleId: '',
      remarks: '',
      photos: [],
      error: null
    });
  };

  // Show remarks in modal
  const showRemarksModal = (vehicle: Vehicle) => {
    if (vehicle.remarks) {
      setRemarksModal({
        open: true,
        title: `Remarks for ${vehicle.chassisNumber}`,
        content: vehicle.remarks
      });
    }
  };

  // Show photos in modal
  const showPhotoModal = (photos: string[], title: string) => {
    if (photos.length > 0) {
      setPhotoModal({
        open: true,
        photos,
        title,
        currentIndex: 0
      });
    }
  };

  // Navigate through photos in modal
  const navigatePhoto = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setPhotoModal(prev => ({
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.photos.length
      }));
    } else {
      setPhotoModal(prev => ({
        ...prev,
        currentIndex: (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length
      }));
    }
  };

  // Apply filters and sorting
  const filteredAndSortedVehicles = useMemo(() => {
    // Filter vehicles
    let result = vehicles.filter(vehicle => {
      const matchesType = filters.vehicleType ? vehicle.vehicleType === filters.vehicleType : true;
      const matchesEntry = filters.entryType ? vehicle.entryType === filters.entryType : true;
      const matchesFuel = filters.fuelType ? vehicle.fuelType === filters.fuelType : true;
      const matchesStatus = filters.physicalStatus ? vehicle.physicalStatus === filters.physicalStatus : true;
      const matchesSearch = filters.search ?
        (vehicle.chassisNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
         vehicle.registrationNumber?.toLowerCase().includes(filters.search.toLowerCase())) : true;

      return matchesType && matchesEntry && matchesFuel && matchesStatus && matchesSearch;
    });

    // Sort vehicles
    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) {
          return 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [vehicles, filters, sortConfig]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const total = vehicles.length;
    const newCount = vehicles.filter(v => v.entryType === 'New').length;
    const oldCount = vehicles.filter(v => v.entryType === 'Old').length;
    
    return { total, newCount, oldCount };
  }, [vehicles]);

  // Function to render sort indicator
  const renderSortIndicator = (key: keyof Vehicle) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  // Function to check if remarks need truncation
  const needsTruncation = (text: string, limit = 30) => {
    return text && text.length > limit;
  };

  // Function to truncate remarks
  const truncateRemarks = (text: string, limit = 30) => {
    if (!text) return '-';
    return text.length > limit ? `${text.substring(0, limit)}...` : text;
  };
  
  // Function to determine row background color
  const getRowBackground = (vehicle: Vehicle) => {
    if (vehicle.physicalStatus === 'Delivered') {
      return 'bg-green-50';
    } else if (vehicle.physicalStatus === 'In Transit') {
      return 'bg-yellow-50';
    }
    return '';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stockyard Status</h1>
        <div className="text-sm bg-gray-100 p-2 rounded">
          Total Vehicles: {summary.total} | New: {summary.newCount} | Old: {summary.oldCount}
        </div>
      </div>

      {/* Excel Upload */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Upload Excel</h2>
        <ExcelUpload />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input
          className="border p-2 rounded"
          placeholder="Search by Chassis or Reg No."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select 
          className="border p-2 rounded" 
          value={filters.vehicleType}
          onChange={e => handleFilterChange('vehicleType', e.target.value)}
        >
          <option value="">All Vehicle Types</option>
          {VehicleTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select 
          className="border p-2 rounded" 
          value={filters.entryType}
          onChange={e => handleFilterChange('entryType', e.target.value)}
        >
          <option value="">All Entry Types</option>
          {EntryTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select 
          className="border p-2 rounded" 
          value={filters.fuelType}
          onChange={e => handleFilterChange('fuelType', e.target.value)}
        >
          <option value="">All Fuel Types</option>
          {FuelTypes.map(fuel => <option key={fuel} value={fuel}>{fuel}</option>)}
        </select>
        <select 
          className="border p-2 rounded" 
          value={filters.physicalStatus}
          onChange={e => handleFilterChange('physicalStatus', e.target.value)}
        >
          <option value="">All Statuses</option>
          {PhysicalStatuses.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th 
                className="border px-4 py-2 cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort('chassisNumber')}
              >
                Chassis No. {renderSortIndicator('chassisNumber')}
              </th>
              <th className="border px-4 py-2">Parent Product Line</th>
              <th className="border px-4 py-2">Product Line</th>
              <th className="border px-4 py-2">Color</th>
              <th className="border px-4 py-2">Fuel Type</th>
              <th className="border px-4 py-2">Vehicle Type</th>
              <th className="border px-4 py-2">Entry Type</th>
              <th className="border px-4 py-2">Reg No.</th>
              <th 
                className="border px-4 py-2 cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort('kmDriven')}
              >
                KM Driven {renderSortIndicator('kmDriven')}
              </th>
              <th className="border px-4 py-2">Received Date</th>
              <th className="border px-4 py-2">Delivered Date</th>
              <th className="border px-4 py-2">Physical Status</th>
              <th 
                className="border px-4 py-2 cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort('daysInStockyard')}
              >
                Days in Stockyard {renderSortIndicator('daysInStockyard')}
              </th>
              <th className="border px-4 py-2">Remarks</th>
              <th className="border px-4 py-2">Photos</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedVehicles.length === 0 ? (
              <tr>
                <td colSpan={15} className="border px-4 py-8 text-center text-gray-500">
                  No vehicles found. Upload an Excel file or add vehicles manually.
                </td>
              </tr>
            ) : (
              filteredAndSortedVehicles.map(vehicle => (
                <tr key={vehicle.id} className={`text-center hover:bg-gray-50 ${getRowBackground(vehicle)}`}>
                  <td className="border px-4 py-2 font-mono">{vehicle.chassisNumber}</td>
                  <td className="border px-4 py-2">{vehicle.parentProductLine || '-'}</td>
                  <td className="border px-4 py-2">{vehicle.productLine || '-'}</td>
                  <td className="border px-4 py-2">{vehicle.chassisColor || '-'}</td>
                  <td className="border px-4 py-2">{vehicle.fuelType || '-'}</td>
                  <td className="border px-4 py-2">{vehicle.vehicleType || '-'}</td>
                  <td className="border px-4 py-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs 
                      ${vehicle.entryType === 'New' ? 'bg-blue-100 text-blue-800' : 
                        vehicle.entryType === 'Old' ? 'bg-orange-100 text-orange-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {vehicle.entryType}
                    </span>
                  </td>
                  <td className="border px-4 py-2">{vehicle.registrationNumber || '-'}</td>
                  <td className="border px-4 py-2">{vehicle.kmDriven || 0}</td>
                  <td className="border px-4 py-2">{vehicle.receivedDate || '-'}</td>
                  <td className="border px-4 py-2">{vehicle.deliveredDate || '-'}</td>
                  <td className="border px-4 py-2">
                    <select
                      value={vehicle.physicalStatus}
                      onChange={(e) => handlePhysicalStatusChange(vehicle.id, e.target.value, vehicle)}
                      className="border rounded p-1 w-full"
                      disabled={vehicle.physicalStatus === 'Delivered'} // Disable after delivery
                    >
                      {PhysicalStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-4 py-2">
                    {vehicle.daysInStockyard !== undefined ? (
                      vehicle.physicalStatus === 'Delivered' ? (
                        <span>{vehicle.daysInStockyard} (Delivered)</span>
                      ) : (
                        vehicle.daysInStockyard
                      )
                    ) : '-'}
                  </td>
                  <td className="border px-4 py-2">
                    {vehicle.remarks ? (
                      <div>
                        <div className="max-w-xs cursor-pointer" onClick={() => showRemarksModal(vehicle)}>
                          <div className="flex items-center">
                            <span className="truncate">{truncateRemarks(vehicle.remarks)}</span>
                            {needsTruncation(vehicle.remarks) && (
                              <span className="text-blue-500 ml-1 text-xs">[more]</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : '-'}
                    {vehicle.deliveryRemarks && (
                      <div className="mt-1">
                        <div 
                          className="max-w-xs cursor-pointer" 
                          onClick={() => setRemarksModal({
                            open: true,
                            title: `Delivery Remarks for ${vehicle.chassisNumber}`,
                            content: vehicle.deliveryRemarks || ''
                          })}
                        >
                          <div className="flex items-center">
                            <span className="truncate text-green-700">{truncateRemarks(vehicle.deliveryRemarks)}</span>
                            {needsTruncation(vehicle.deliveryRemarks) && (
                              <span className="text-green-500 ml-1 text-xs">[more]</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    <div className="flex flex-col space-y-2">
                      {vehicle.receivedPhotos?.length ? (
                        <button
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                          onClick={() => showPhotoModal(vehicle.receivedPhotos || [], `${vehicle.chassisNumber} - Received Photos`)}
                        >
                          Received Photos ({vehicle.receivedPhotos.length})
                        </button>
                      ) : null}
                      
                      {vehicle.sentPhotos?.length ? (
                        <button
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                          onClick={() => showPhotoModal(vehicle.sentPhotos || [], `${vehicle.chassisNumber} - Delivery Photos`)}
                        >
                          Delivery Photos ({vehicle.sentPhotos.length})
                        </button>
                      ) : null}
                      
                      {(!vehicle.receivedPhotos?.length && !vehicle.sentPhotos?.length) && '-'}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Remarks Modal */}
      {remarksModal.open && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{remarksModal.title}</h3>
              <button 
                onClick={() => setRemarksModal(prev => ({ ...prev, open: false }))}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-sm">
              {remarksModal.content}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setRemarksModal(prev => ({ ...prev, open: false }))}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {photoModal.open && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-3xl w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{photoModal.title} ({photoModal.currentIndex + 1}/{photoModal.photos.length})</h3>
              <button 
                onClick={() => setPhotoModal(prev => ({ ...prev, open: false }))}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="relative">
              <div className="flex justify-center items-center bg-gray-100 rounded h-96">
                <img 
                  src={photoModal.photos[photoModal.currentIndex]} 
                  alt={`Photo ${photoModal.currentIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              
              {photoModal.photos.length > 1 && (
                <>
                  <button 
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md"
                    onClick={() => navigatePhoto('prev')}
                  >
                    &#8592;
                  </button>
                  <button 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md"
                    onClick={() => navigatePhoto('next')}
                  >
                    &#8594;
                  </button>
                </>
              )}
            </div>
            
            <div className="mt-4 grid grid-cols-6 gap-2">
              {photoModal.photos.map((photo, index) => (
                <div 
                  key={index}
                  className={`cursor-pointer rounded overflow-hidden h-16 border-2 ${
                    index === photoModal.currentIndex ? 'border-blue-500' : 'border-transparent'
                  }`}
                  onClick={() => setPhotoModal(prev => ({ ...prev, currentIndex: index }))}
                >
                  <img 
                    src={photo} 
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPhotoModal(prev => ({ ...prev, open: false }))}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {deliveryModal.open && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Complete Vehicle Delivery</h3>
              <button 
                onClick={() => setDeliveryModal(prev => ({ ...prev, open: false }))}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Please provide the following delivery information to mark this vehicle as delivered.
              </p>
              
              {deliveryModal.error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {deliveryModal.error}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Delivery Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deliveryModal.remarks}
                  onChange={(e) => setDeliveryModal(prev => ({ ...prev, remarks: e.target.value }))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                  placeholder="Enter delivery notes or observations"
                />
              </div>
              
              <div className="mb-4">
                <PhotoUpload
                  name="deliveryPhotos"
                  label="Upload Delivery Photos (required) *"
                  onChange={(photos) => setDeliveryModal(prev => ({ ...prev, photos }))}
                  maxPhotos={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeliveryModal(prev => ({ ...prev, open: false }))}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeliveryConfirm}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Complete Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};