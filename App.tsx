import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sortedCities } from './data/cities';
import { CityData, DiagnosticCenter } from './types';
import { geminiService } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import CityGrid from './components/CityGrid';
import ErrorAlert from './components/ErrorAlert';

const App: React.FC = () => {
  const [cityDataMap, setCityDataMap] = useState<Map<string, CityData>>(() => {
    const initialMap = new Map<string, CityData>();
    sortedCities.forEach(city => {
      initialMap.set(city.city, {
        cityInfo: city,
        centers: [],
        status: 'pending',
        pinCodes: [],
        processedPinCodeCount: 0,
      });
    });
    return initialMap;
  });
  
  const [scanStatus, setScanStatus] = useState<'idle' | 'running' | 'stopped' | 'completed'>('idle');
  const [currentScanIndex, setCurrentScanIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const discoveredCoordinatesRef = useRef<Set<string>>(new Set());

  const scanSingleCity = useCallback(async (cityName: string, isRescan: boolean = false) => {
    const city = sortedCities.find(c => c.city === cityName);
    if (!city) return;

    const updateCityStatus = (updates: Partial<CityData>) => {
      setCityDataMap(prev => {
        const newMap = new Map(prev);
        const currentData = newMap.get(cityName);
        if (currentData) {
          newMap.set(cityName, { ...currentData, ...updates });
        }
        return newMap;
      });
    };
    
    if (isRescan) {
        // Reset city data and remove its coordinates from the global set before rescanning
        const existingData = cityDataMap.get(cityName);
        existingData?.centers.forEach(center => {
            const coordKey = `${center.latitude},${center.longitude}`;
            if(center.latitude && center.longitude) {
                discoveredCoordinatesRef.current.delete(coordKey);
            }
        });
    }

    updateCityStatus({ status: 'finding-pincodes', centers: [], pinCodes: [], processedPinCodeCount: 0 });

    try {
      const pinCodes = await geminiService.getPinCodesForCity(city);
      if (pinCodes.length === 0) {
        updateCityStatus({ status: 'completed', pinCodes: [] });
        return;
      }
      
      updateCityStatus({ status: 'scanning-centers', pinCodes });

      let allCenters: DiagnosticCenter[] = [];
      for (let i = 0; i < pinCodes.length; i++) {
        const loopState = (window as any).isRescanning ? 'rescanning' : scanStatus;
        if (loopState !== 'running' && loopState !== 'rescanning') {
            break;
        }

        const pinCode = pinCodes[i];
        const newCenters = await geminiService.findDiagnosticCenters(city, pinCode);
        
        const uniqueNewCenters = newCenters.filter(center => {
            if (!center.latitude || !center.longitude) return true; // Keep if no coords
            const coordKey = `${center.latitude},${center.longitude}`;
            if (discoveredCoordinatesRef.current.has(coordKey)) {
                return false; // Skip duplicate
            }
            discoveredCoordinatesRef.current.add(coordKey);
            return true;
        });

        allCenters.push(...uniqueNewCenters);
        
        updateCityStatus({ 
            processedPinCodeCount: i + 1,
            centers: [...allCenters] // Ensure a new array to trigger re-render
        });
      }

      updateCityStatus({ status: 'completed' });

    } catch (e) {
      console.error(`Failed to scan city ${cityName}:`, e);
      updateCityStatus({ status: 'error' });
      setError(`An error occurred while scanning ${cityName}. You can try rescanning.`);
    }
  }, [scanStatus, cityDataMap]);

  useEffect(() => {
    if (scanStatus === 'running' && currentScanIndex < sortedCities.length) {
      (window as any).isRescanning = false;
      const scanAndProceed = async () => {
        await scanSingleCity(sortedCities[currentScanIndex].city);
        if (scanStatus === 'running') {
            setCurrentScanIndex(prevIndex => prevIndex + 1);
        }
      };
      scanAndProceed();
    } else if (scanStatus === 'running' && currentScanIndex >= sortedCities.length) {
      setScanStatus('completed');
    }
  }, [scanStatus, currentScanIndex, scanSingleCity]);

  const handleStart = () => {
     setError(null);
     setScanStatus('running');
  };

  const handleStop = () => {
    setScanStatus('stopped');
  };
  
  const handleResume = () => {
    setError(null);
    setScanStatus('running');
  };

  const handleRestart = () => {
    const initialMap = new Map<string, CityData>();
    sortedCities.forEach(city => {
      initialMap.set(city.city, {
        cityInfo: city, centers: [], status: 'pending', pinCodes: [], processedPinCodeCount: 0,
      });
    });
    setCityDataMap(initialMap);
    setCurrentScanIndex(0);
    setError(null);
    discoveredCoordinatesRef.current.clear();
    setScanStatus('running');
  };

  const handleRescanCity = useCallback(async (cityName: string) => {
    if (scanStatus === 'running') {
        alert("Please stop the full scan before rescanning an individual city.");
        return;
    }
    (window as any).isRescanning = true;
    await scanSingleCity(cityName, true);
    (window as any).isRescanning = false;
  }, [scanStatus, scanSingleCity]);

  const handleExport = () => {
    const data = Array.from(cityDataMap.entries());
    const coordinates = Array.from(discoveredCoordinatesRef.current);
    const jsonString = `{"version":2,"data":${JSON.stringify(data, null, 2)}, "coordinates": ${JSON.stringify(coordinates)}}`;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ct_scan_database.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if ((parsed.version !== 1 && parsed.version !== 2) || !Array.isArray(parsed.data)) {
            throw new Error("Invalid or outdated JSON file format.");
        }

        const newMap = new Map<string, CityData>(parsed.data);
        const firstValue: any = newMap.values().next().value;
        if (!firstValue || !firstValue.cityInfo || !('centers' in firstValue)) {
          throw new Error("JSON file does not match expected data structure.");
        }
        
        setCityDataMap(newMap);

        if (parsed.version === 2 && Array.isArray(parsed.coordinates)) {
            discoveredCoordinatesRef.current = new Set(parsed.coordinates);
        } else {
            // Rebuild coordinates from imported data if it's an older version
            discoveredCoordinatesRef.current.clear();
            newMap.forEach(cityData => {
                cityData.centers.forEach(center => {
                    if (center.latitude && center.longitude) {
                        discoveredCoordinatesRef.current.add(`${center.latitude},${center.longitude}`);
                    }
                });
            });
        }

        const lastScannedIndex = sortedCities.findIndex(city => {
            const status = newMap.get(city.city)?.status;
            return status === 'pending' || status === 'finding-pincodes' || status === 'scanning-centers';
        });
        
        if (lastScannedIndex === -1) {
          setCurrentScanIndex(sortedCities.length);
          setScanStatus('completed');
        } else {
          setCurrentScanIndex(lastScannedIndex);
          setScanStatus('stopped');
        }
        setError(null);

      } catch (err) {
        console.error("Failed to import file:", err);
        setError(err instanceof Error ? err.message : "Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentCityForSpinner = currentScanIndex < sortedCities.length 
    ? sortedCities[currentScanIndex].city 
    : '';

  const hasAnyResults = Array.from(cityDataMap.values()).some(d => d.centers.length > 0);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
      <main className="container mx-auto px-2 sm:px-4 py-8">
        <header className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            India CT Scan Center Database
          </h1>
          <p className="mt-2 text-md sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            An AI-powered tool to build a comprehensive database of CT scan centers across the top 100 most populous Indian cities.
          </p>
        </header>
        
        <div className="sticky top-0 z-10 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm py-4 mb-4 rounded-lg">
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mb-4">
                {scanStatus === 'idle' && <button onClick={handleStart} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">Start Search</button>}
                {scanStatus === 'running' && <button onClick={handleStop} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75">Stop Search</button>}
                {scanStatus === 'stopped' && currentScanIndex < sortedCities.length && <button onClick={handleResume} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75">Resume Search</button>}
                {(scanStatus === 'completed' || (scanStatus === 'stopped' && currentScanIndex > 0)) && <button onClick={handleRestart} className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75">Restart Search</button>}
                
                <div className="flex gap-2">
                    <button onClick={handleImportClick} className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75">Import JSON</button>
                    <button onClick={handleExport} disabled={!hasAnyResults} className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed">Export JSON</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".json" />
                </div>
            </div>

            {scanStatus === 'running' && (
                <LoadingSpinner 
                    currentCity={currentCityForSpinner} 
                    currentIndex={currentScanIndex} 
                    totalCities={sortedCities.length} 
                />
            )}
             {scanStatus === 'completed' && <div className="text-center p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">Scan Completed!</div>}
             {scanStatus === 'stopped' && <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg">Scan Stopped. Processed {currentScanIndex} out of {sortedCities.length} cities.</div>}
        </div>


        {error && <ErrorAlert message={error} />}
        
        <div className="mt-4">
          <CityGrid 
            cities={sortedCities} 
            cityDataMap={cityDataMap}
            onRescanCity={handleRescanCity}
          />
        </div>
        
      </main>
    </div>
  );
};

export default App;