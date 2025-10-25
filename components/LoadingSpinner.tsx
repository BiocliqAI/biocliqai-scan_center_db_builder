import React from 'react';

interface LoadingSpinnerProps {
  currentCity: string;
  currentIndex: number;
  totalCities: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ currentCity, currentIndex, totalCities }) => {
  const progress = (currentIndex / totalCities) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-6 mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="w-full mb-4">
          <div className="flex justify-between mb-1">
              <span className="text-base font-medium text-blue-700 dark:text-white">Building Database...</span>
              <span className="text-sm font-medium text-blue-700 dark:text-white">{currentIndex} / {totalCities}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
      </div>
      <div className="text-center">
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Currently scanning: <span className="font-semibold text-blue-500">{currentCity}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          This may take a moment as we perform a deep search.
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;