import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Datepicker from "@/Components/DatePicker";
import SlotList from "@/Components/SlotList";
import CalenderProvider from "@/contexts/Calender";
import { useClinicData } from '@/services/bookAppointmentApi';
import { ClinicHeader } from '@/Components/bookAppointments/ClinicHeader';
import { DentistSelector } from '@/Components/bookAppointments/DentistSelector';
import type { Dentist } from '@/services/types';

// Create simple loading and error components inline
const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading clinic information...</p>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Clinic</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default function BookAppointments() {
  const { clinicId } = useParams();
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);

  const { clinic, loading, error, refetch } = useClinicData(clinicId || null);

  // Debug logs to see what's happening
  console.log('BookAppointments Debug:', {
    clinicId,
    clinic,
    loading,
    error,
    selectedDentist
  });

  // Auto-select default dentist when clinic data loads
  useEffect(() => {
    if (clinic && !selectedDentist) {
      const defaultDentist = clinic.dentists.find(d => d.isDefault && d.isAvailable);
      if (defaultDentist) {
        setSelectedDentist(defaultDentist);
      } else {
        // If no default dentist, select first available
        const firstAvailable = clinic.dentists.find(d => d.isAvailable);
        if (firstAvailable) {
          setSelectedDentist(firstAvailable);
        }
      }
    }
  }, [clinic, selectedDentist]);

  const handleDentistSelect = (dentist: Dentist) => {
    setSelectedDentist(dentist);
  };

  // Show loading state
  if (loading) {
    return <LoadingState />;
  }

  // Show error state
  if (error || !clinic) {
    return (
      <ErrorState
        error={error || 'Clinic not found. Please check the clinic ID and try again.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-full mx-auto">


        {/* Debug Info - Remove this in production */}
        {/* <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800">Debug Info:</h3>
          <p className="text-sm text-yellow-700">
            Clinic ID: {clinicId || 'Not found'} | 
            Clinic Loaded: {clinic ? 'Yes' : 'No'} | 
            Loading: {loading ? 'Yes' : 'No'} | 
            Error: {error || 'None'}
          </p>
        </div> */}

        {/* Clinic Information */}
        {clinic && <ClinicHeader clinic={clinic} />}

        {/* Dentist Selection */}
        {clinic && (
          <DentistSelector
            dentists={clinic.dentists}
            selectedDentistId={selectedDentist?.id || null}
            onDentistSelect={handleDentistSelect}
          />
        )}

        {/* Appointment Scheduling */}
        {selectedDentist && clinic && (
          <div className="bg-white rounded-sm border border-gray-300 p-4">
            <div className="mb-6">
              <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Schedule Your Appointment</h2>
              <div className="flex items-center text-gray-600">
                <img
                  src={selectedDentist.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'}
                  alt={selectedDentist.name}
                  className="w-6 h-6 rounded-full object-cover mr-3"
                />
                <span className='text-sm'>Booking with <strong>{selectedDentist.name}</strong> - {selectedDentist.specialization}</span>
              </div>
            </div>

            <CalenderProvider clinicId={clinic.id} dentistId={selectedDentist.id}>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className='text-sm'>
                  <h3 className="font-semibold text-sm text-gray-900 mb-2">Select Date</h3>
                  <div className='p-2 text-sm border border-slate-200 rounded-sm bg-slate-50'>
                    <Datepicker />

                  </div>
                </div>

                <div className='text-sm'>
                  <h3 className="font-semibold text-sm text-gray-900 mb-2">Available Time Slots</h3>
                  <div className='p-2 text-sm border border-slate-200 rounded-sm bg-slate-50'>
                    <SlotList />

                  </div>
                </div>
              </div>
            </CalenderProvider>
          </div>
        )}


        {/* No Dentist Selected State */}
        {!selectedDentist && clinic && clinic.dentists.filter(d => d.isAvailable).length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Dentists Available</h3>
            <p className="text-gray-600">All dentists at this clinic are currently unavailable. Please try again later or contact the clinic directly.</p>
          </div>
        )}

        {/* Fallback content if nothing else renders */}
        {!clinic && !loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-600">No clinic data available. Please check the URL parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
}