import React from 'react';
import { DiagnosticCenter } from '../types';

interface ResultCardProps {
  center: DiagnosticCenter;
}

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);


const ResultCard: React.FC<ResultCardProps> = ({ center }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white pr-4">{center.name}</h3>
            {center.googleRating > 0 && (
                <div className="flex-shrink-0 flex items-center bg-yellow-100 text-yellow-800 text-sm font-semibold px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
                    <StarIcon className="w-4 h-4 mr-1 text-yellow-500" />
                    {center.googleRating.toFixed(1)}
                </div>
            )}
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {center.address}, {center.pinCode}
        </p>
        
        <div className="space-y-2 text-sm">
            {center.contactNumber && center.contactNumber !== 'N/A' && (
                <p className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>{center.contactNumber}</span>
                </p>
            )}
            <div className="flex items-center text-gray-700 dark:text-gray-300">
                {center.ctAvailable 
                    ? <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0 text-green-500" />
                    : <XCircleIcon className="h-4 w-4 mr-2 flex-shrink-0 text-red-500" />
                }
                <span className={center.ctAvailable ? 'dark:text-green-300' : 'dark:text-red-300'}>
                    CT Scan {center.ctAvailable ? 'Available' : 'Not Available'}
                </span>
            </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 bg-gray-50 dark:bg-gray-700/50 mt-auto">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
          <a
            href={center.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 px-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            View on Map
          </a>
          <a
            href={center.website !== 'N/A' ? center.website : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 text-center py-2 px-4 rounded-md font-semibold transition-colors ${
              center.website === 'N/A'
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
            }`}
            onClick={(e) => center.website === 'N/A' && e.preventDefault()}
          >
            Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
