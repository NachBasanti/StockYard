import { useState } from 'react';
import { StockyardProvider } from './context/StockyardContext';
import { StockyardStatus } from './components/StockyardStatus';
import { NewVehicleView } from './components/NewVehicleView';
import { OldVehicleView } from './components/OldVehicleView';

export const App = () => {
  const [activeView, setActiveView] = useState<'status' | 'new' | 'old'>('status');
  
  return (
    <StockyardProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Stockyard Management</h1>
        
        <div className="flex mb-6 space-x-2">
          <button 
            onClick={() => setActiveView('status')} 
            className={`px-4 py-2 rounded ${
              activeView === 'status' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Stockyard Status
          </button>
          <button 
            onClick={() => setActiveView('new')} 
            className={`px-4 py-2 rounded ${
              activeView === 'new' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Add New Vehicle
          </button>
          <button 
            onClick={() => setActiveView('old')} 
            className={`px-4 py-2 rounded ${
              activeView === 'old' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Add Old Vehicle
          </button>
        </div>
        
        {activeView === 'status' && <StockyardStatus />}
        {activeView === 'new' && <NewVehicleView />}
        {activeView === 'old' && <OldVehicleView />}
      </div>
    </StockyardProvider>
  );
};