import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle, PhysicalStatuses } from '../types/types';

interface StockyardContextType {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  addVehiclesFromExcel: (vehicles: Vehicle[]) => void;
  updateVehicleDetails: (id: string, updates: Partial<Vehicle>) => void;
  getVehicleById: (id: string) => Vehicle | undefined;
}

const StockyardContext = createContext<StockyardContextType | undefined>(undefined);

// Sample data for development
const mockVehicles: Vehicle[] = [
  {
    id: '1',
    chassisNumber: 'CH123456789',
    parentProductLine: 'Sedan',
    productLine: 'Compact',
    chassisColor: 'Red',
    fuelType: 'Petrol',
    vehicleType: 'Tata',
    entryType: 'New',
    kmDriven: 0,
    physicalStatus: 'In Transit',
    remarks: 'Brand new vehicle from manufacturer',
    receivedPhotos: ['https://via.placeholder.com/150'],
    sentPhotos: [],
    receivedDate: '2025-04-10',
    daysInStockyard: 11
  },
  {
    id: '2',
    chassisNumber: 'CH987654321',
    parentProductLine: 'SUV',
    productLine: 'Premium',
    chassisColor: 'Blue',
    fuelType: 'Diesel',
    vehicleType: 'Ashok Leyland',
    entryType: 'Old',
    registrationNumber: 'KA01AB1234',
    kmDriven: 15000,
    physicalStatus: 'In Branch',
    remarks: 'Trade-in vehicle with minor scratches on rear bumper. Additional inspection required for engine components. Final checks pending.',
    receivedPhotos: ['https://via.placeholder.com/150', 'https://via.placeholder.com/150'],
    sentPhotos: [],
    receivedDate: '2025-04-15',
    daysInStockyard: 6
  }
];

export const StockyardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);

  // Update days counter every day at midnight
  useEffect(() => {
    const updateDaysCounter = () => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          // Don't update days for delivered vehicles
          if (vehicle.physicalStatus === 'Delivered') {
            return vehicle;
          }
          
          return {
            ...vehicle,
            daysInStockyard: (vehicle.daysInStockyard || 0) + 1
          };
        })
      );
    };

    // Check current time and set timer to run at midnight
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // next day
      0, 0, 0 // midnight
    );
    const timeToMidnight = night.getTime() - now.getTime();

    // Set up interval to run daily
    const timer = setTimeout(() => {
      updateDaysCounter();
      // Then set it to run every 24 hours
      const interval = setInterval(updateDaysCounter, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, timeToMidnight);

    return () => clearTimeout(timer);
  }, []);

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: crypto.randomUUID(),
      physicalStatus: vehicle.physicalStatus || 'In Branch', // Default to In Branch
      daysInStockyard: vehicle.daysInStockyard || 0,
      receivedDate: vehicle.receivedDate || new Date().toISOString().split('T')[0]
    };
    
    // If this is a chassis from Excel, remove the unassigned version
    if (vehicle.entryType === 'New') {
      setVehicles(prevVehicles => {
        // Filter out the unassigned version of this chassis
        const filtered = prevVehicles.filter(v => 
          !(v.chassisNumber === vehicle.chassisNumber && v.entryType === 'Unassigned')
        );
        // Add the new vehicle
        return [...filtered, newVehicle];
      });
    } else {
      // Just add the vehicle
      setVehicles(prev => [...prev, newVehicle]);
    }
  };

  const addVehiclesFromExcel = (newVehicles: Vehicle[]) => {
    // Check for duplicate chassis numbers
    const existingChassisNumbers = new Set(vehicles
      .filter(v => v.entryType !== 'Unassigned') // Ignore unassigned vehicles for duplication check
      .map(v => v.chassisNumber));
    
    // Filter out duplicates and set default values
    const validVehicles = newVehicles
      .filter(v => {
        if (existingChassisNumbers.has(v.chassisNumber)) {
          console.warn(`Duplicate chassis number skipped: ${v.chassisNumber}`);
          return false;
        }
        return true;
      })
      .map(v => ({
        ...v,
        id: v.id || crypto.randomUUID(),
        entryType: 'Unassigned', // Excel imports start as Unassigned for autocomplete
        physicalStatus: 'In Transit',
        receivedDate: new Date().toISOString().split('T')[0],
        daysInStockyard: 0
      }));

    if (validVehicles.length > 0) {
      setVehicles(prev => [...prev, ...validVehicles]);
    }
  };

  const updateVehicleDetails = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(vehicles.map(vehicle => {
      if (vehicle.id === id) {
        // If changing to "Delivered", set delivered date and freeze day counter
        if (updates.physicalStatus === 'Delivered' && vehicle.physicalStatus !== 'Delivered') {
          return { 
            ...vehicle, 
            ...updates,
            deliveredDate: updates.deliveredDate || new Date().toISOString().split('T')[0]
          };
        }
        
        return { ...vehicle, ...updates };
      }
      return vehicle;
    }));
  };

  const getVehicleById = (id: string) => {
    return vehicles.find(vehicle => vehicle.id === id);
  };

  return (
    <StockyardContext.Provider 
      value={{ 
        vehicles, 
        addVehicle, 
        addVehiclesFromExcel, 
        updateVehicleDetails, 
        getVehicleById 
      }}
    >
      {children}
    </StockyardContext.Provider>
  );
};

export const useStockyard = () => {
  const context = useContext(StockyardContext);
  if (!context) {
    throw new Error('useStockyard must be used within a StockyardProvider');
  }
  return context;
};