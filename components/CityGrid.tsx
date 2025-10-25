import React, {useState} from 'react';
import { City, CityData } from '../types';
import CityTile from './CityTile';

interface CityGridProps {
  cities: City[];
  cityDataMap: Map<string, CityData>;
  onRescanCity: (cityName: string) => void;
}

const CityGrid: React.FC<CityGridProps> = ({ cities, cityDataMap, onRescanCity }) => {
  const [expandedCityName, setExpandedCityName] = useState<string | null>(null);

  const handleToggleCity = (cityName: string) => {
    setExpandedCityName(prev => (prev === cityName ? null : cityName));
  };
  
  return (
    <div className="space-y-2">
      {cities.map((city, index) => {
        const data = cityDataMap.get(city.city);
        if (!data) return null; // Should not happen with pre-population

        return (
          <CityTile 
            key={city.city}
            data={data}
            serialNumber={index + 1}
            isExpanded={expandedCityName === data.cityInfo.city}
            onToggle={() => handleToggleCity(data.cityInfo.city)}
            onRescan={() => onRescanCity(data.cityInfo.city)}
          />
        );
      })}
    </div>
  );
};

export default CityGrid;
