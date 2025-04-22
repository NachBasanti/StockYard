import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle } from '../types/types';

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

  useEffect(() => {
    const updateDaysCounter = () => {
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle => {
          if (vehicle.physicalStatus === 'Delivered') return vehicle;
          return {
            ...vehicle,
            daysInStockyard: (vehicle.daysInStockyard || 0) + 1
          };
        })
      );
    };

    const now = new Date();
    const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeToMidnight = night.getTime() - now.getTime();

    const timer = setTimeout(() => {
      updateDaysCounter();
      const interval = setInterval(updateDaysCounter, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, timeToMidnight);

    return () => clearTimeout(timer);
  }, []);

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: crypto.randomUUID(),
      physicalStatus: vehicle.physicalStatus || 'In Branch',
      daysInStockyard: vehicle.daysInStockyard || 0,
      receivedDate: vehicle.receivedDate || new Date().toISOString().split('T')[0]
    };

    if (vehicle.entryType === 'New') {
      setVehicles(prevVehicles => {
        const filtered = prevVehicles.filter(v =>
          !(v.chassisNumber === vehicle.chassisNumber && v.entryType === 'Unassigned')
        );
        return [...filtered, newVehicle];
      });
    } else {
      setVehicles(prev => [...prev, newVehicle]);
    }
  };

  const addVehiclesFromExcel = (newVehicles: Vehicle[]) => {
    const existingChassisNumbers = new Set(
      vehicles.filter(v => v.entryType !== 'Unassigned').map(v => v.chassisNumber)
    );

    const validVehicles: Vehicle[] = newVehicles
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
        entryType: 'Unassigned',
        physicalStatus: 'In Transit',
        receivedDate: new Date().toISOString().split('T')[0],
        daysInStockyard: 0
      } as Vehicle));

    if (validVehicles.length > 0) {
      setVehicles(prev => [...prev, ...validVehicles]);
    }
  };

  const updateVehicleDetails = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev =>
      prev.map(vehicle => {
        if (vehicle.id === id) {
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
      })
    );
  };

  const getVehicleById = (id: string) => {
    return vehicles.find(vehicle => vehicle.id === id);
  };

  return (
    <StockyardContext.Provider
      value={{ vehicles, addVehicle, addVehiclesFromExcel, updateVehicleDetails, getVehicleById }}
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
