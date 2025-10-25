import React from 'react';
import { CityData } from '../types';
import ResultCard from './ResultCard';

interface CityTileProps {
  data: CityData;
  serialNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRescan: () => void;
}

// Icons
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>);
const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9" /></svg>);
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>);
const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>);
const StatusIndicator: React.FC<{ status: CityData['status'] }> = ({ status }) => {
    switch (status) {
        case 'pending': return <div className="w-3 h-3 bg-gray-400 rounded-full" title="Pending"></div>;
        case 'finding-pincodes':
        case 'scanning-centers': return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" title="Scanning..."></div>;
        case 'completed': return <div className="w-3 h-3 bg-green-500 rounded-full" title="Completed"></div>;
        case 'error': return <div className="w-3 h-3 bg-red-500 rounded-full" title="Error"></div>;
        default: return null;
    }
};


const CityTile: React.FC<CityTileProps> = ({ data, serialNumber, isExpanded, onToggle, onRescan }) => {
  const pinCodeProgress = data.pinCodes.length > 0 ? (data.processedPinCodeCount / data.pinCodes.length) * 100 : 0;
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300 border-l-4 ${
        data.status === 'error' ? 'border-red-500' : 
        (data.status === 'scanning-centers' || data.status === 'finding-pincodes') ? 'border-blue-500' : 
        data.status === 'completed' ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
    }`}>
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 w-8 flex-shrink-0">{serialNumber}.</span>
                <div className="flex items-center space-x-2 min-w-0">
                    <StatusIndicator status={data.status} />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">{data.cityInfo.city}</h3>
                </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 ml-2">
                <div className="hidden sm:flex items-center text-sm text-gray-500 dark:text-gray-400" title="Population (2025 Est.)">
                    <UsersIcon className="w-4 h-4 mr-1"/>
                    <span>{(data.cityInfo.pop2025 / 1000000).toFixed(2)}M</span>
                </div>
                 <div className="hidden sm:flex items-center text-sm text-gray-500 dark:text-gray-400" title="Pin Codes Found">
                    <MapPinIcon className="w-4 h-4 mr-1"/>
                    <span>{data.pinCodes.length}</span>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full min-w-[80px] text-center ${
                    data.centers.length > 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                    {data.centers.length} Centers
                </span>
                {(data.status === 'completed' || data.status === 'error') && (
                 <button
                    onClick={(e) => { e.stopPropagation(); onRescan(); }}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none"
                    title="Rescan this city"
                >
                    <RefreshIcon className="w-5 h-5" />
                </button>
                )}
                <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
        </div>
         { (data.status === 'finding-pincodes' || data.status === 'scanning-centers') && (
            <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    {data.status === 'finding-pincodes' ? (
                         <div className="bg-blue-600 h-2 rounded-full w-full animate-pulse"></div>
                    ) : (
                         <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pinCodeProgress}%`, transition: 'width 0.3s ease' }}></div>
                    )}
                </div>
                 <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
                    {data.status === 'finding-pincodes' 
                        ? 'Finding pin codes...' 
                        : `Scanning Pin Codes: ${data.processedPinCodeCount} / ${data.pinCodes.length}`
                    }
                </p>
            </div>
         )}
      </div>

      {isExpanded && data.centers.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.centers.map((center, index) => (
              <ResultCard key={`${center.name}-${center.pinCode}-${index}`} center={center} />
            ))}
          </div>
        </div>
      )}
      {isExpanded && data.status === 'completed' && data.centers.length === 0 && (
         <div className="p-4 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            No diagnostic centers with CT scan facilities were found for this city.
         </div>
      )}
    </div>
  );
};

export default CityTile;
