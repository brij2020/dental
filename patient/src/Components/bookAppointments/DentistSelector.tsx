import React from 'react';
import type { Dentist } from '../../services/types';

interface DentistSelectorProps {
    dentists: Dentist[];
    selectedDentistId: string | null;
    onDentistSelect: (dentist: Dentist) => void;
}

export const DentistSelector: React.FC<DentistSelectorProps> = ({
    dentists,
    selectedDentistId,
    onDentistSelect
}) => {
  const defaultDentist = dentists.find(d => d.isDefault);
  const availableDentists = dentists.filter(d => d.isAvailable);
  const unavailableDentists = dentists.filter(d => !d.isAvailable);

  return (
    <div className="bg-white rounded-sm border border-gray-300 p-4 mb-4">
      <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Select Your Dentist</h2>
      
      {/* Default Dentist */}
      {defaultDentist && (
        <div className="mb-4">
          <div className="flex items-center mb-3">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
              Recommended
            </span>
          </div>
          
          <div 
            className={`p-3 rounded-sm border-2 cursor-pointer transition-all duration-200 ${
              selectedDentistId === defaultDentist.id
                ? 'border-cyan-700 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
            onClick={() => onDentistSelect(defaultDentist)}
          >
            <div className="flex items-center gap-3">
              <img
                src={defaultDentist.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'}
                alt={defaultDentist.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-white"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-cyan-800">{defaultDentist.name}</h3>
                <p className="text-[13px] font-[500]">{defaultDentist.specialization}</p>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs text-gray-500">{defaultDentist.experience} years experience</span>
                </div>
              </div>
              {selectedDentistId === defaultDentist.id && (
                <div className="text-cyan-800">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other Available Dentists */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Other Available Dentists</h3>
        <div className="grid gap-4">
          {availableDentists
            .filter(dentist => !dentist.isDefault)
            .map((dentist) => (
              <div
                key={dentist.id}
                className={`p-3 rounded-sm border-2 cursor-pointer transition-all duration-200 ${
                  selectedDentistId === dentist.id
                    ? 'border-cyan-700 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
                onClick={() => onDentistSelect(dentist)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={dentist.image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'}
                    alt={dentist.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-cyan-800">{dentist.name}</h4>
                    <p className="text-[13px] font-[500]">{dentist.specialization}</p>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-gray-500">{dentist.experience} years experience</span>
                    </div>
                  </div>
                  {selectedDentistId === dentist.id && (
                    <div className="text-cyan-800">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Unavailable Dentists */}
      {unavailableDentists.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-800 mb-2">Currently Unavailable</h3>
          <div className="grid gap-4">
            {unavailableDentists.map((dentist) => (
              <div
                key={dentist.id}
                className="p-3 rounded-sm border-2 border-gray-200 bg-gray-50 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={dentist.image || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face'}
                    alt={dentist.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-cyan-800">{dentist.name}</h4>
                    <p className="text-[13px] font-[500]">{dentist.specialization}</p>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs text-gray-500">{dentist.experience} years experience</span>
                    </div>
                  </div>
                  <div className="bg-gray-400 text-white px-3 py-1 rounded-full text-xs">
                    Unavailable
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};