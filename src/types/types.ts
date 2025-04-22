export interface Vehicle {
  id: string;
  chassisNumber: string;          // Unique key
  parentProductLine: string;
  productLine: string;
  chassisColor: string;
  fuelType: string;
  vehicleType: string;
  entryType: 'New' | 'Old' | 'Unassigned';  // Derived from source
  registrationNumber?: string;   // Only for 'Old' vehicles
  kmDriven?: number;             // For tracking kilometers driven
  physicalStatus: 'In Transit' | 'In Branch' | 'Delivered';
  remarks?: string;
  receivedPhotos?: string[];     // For photos received with vehicle
  sentPhotos?: string[];         // For photos sent after processing
  receivedDate?: string;         // Date the vehicle was received
  daysInStockyard?: number;      // Counter for days in stockyard
}

export const VehicleTypes = ['Tata', 'Bajaj 3-wheeler', 'Ashok Leyland'];
export const EntryTypes = ['New', 'Old', 'Unassigned'];
export const FuelTypes = ['Petrol', 'Diesel', 'Electric'];
export const PhysicalStatuses = ['In Transit', 'In Branch', 'Delivered'];