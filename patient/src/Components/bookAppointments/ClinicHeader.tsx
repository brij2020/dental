import React from 'react';
import type { Clinic } from '../../services/types';
import ClinicReviews from './ClinicReviews';

interface ClinicHeaderProps {
  clinic: Clinic;
}

export const ClinicHeader: React.FC<ClinicHeaderProps> = ({ clinic }) => {
  return (
    <div className="bg-white rounded-sm border border-gray-300 p-4 mb-4">
      <div className="flex items-start relative">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className='material-symbols-sharp text-[40px] text-cyan-800'>home_health</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{clinic.name}</h1>
              <div className="flex items-center mt-0.5">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(clinic.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-xs text-gray-400">({clinic.rating})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-1 text-gray-600">
              <span className="material-symbols-sharp text-[18px]">location_on</span>
              <span className="text-sm">{clinic.address}</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600">
              <span className="material-symbols-sharp text-[18px]">call</span>
              <span className="text-sm">{clinic.phone}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-sm border border-green-200">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-800">
                Open {clinic.operatingHours.open} - {clinic.operatingHours.close}
              </span>
              <span className="text-xs text-green-600 ml-2">
                ({clinic.operatingHours.days.join(', ')})
              </span>
            </div>
          </div>
        </div>

        <div className="ml-4 absolute right-0 top-0">
          <div className="bg-blue-50 text-cyan-700 px-3 py-1 rounded-full text-xs font-medium">
            Selected Clinic
          </div>
        </div>

      </div>

      {/* Reviews */}
      <ClinicReviews reviews={clinic.reviews} />
    </div>
  );
};