import { useState, useMemo } from "react";
import type { ChangeEvent } from "react";
import CalenderProvider from "../contexts/Calender";
import "react-datepicker/dist/react-datepicker.css";
import type { Clinic, Filters, ValidationErrors } from "@/Components/bookAppointments/types";
import SectionHeader from "@/Components/bookAppointments/SectionHeader";
import ClinicCard from "@/Components/bookAppointments/ClinicCard";
import useClinics from "@/hooks/useClinics";
import { states, stateCities } from '../services/locations'
import CustomModal from "@/Components/CustomModal";
import AppointmentDateTime from "@/Components/bookAppointments/AppointmentDateTime";
import Loading from "@/Components/Loading";



function CalendarClinicListPage() {
  const { clinics, loading: loadingClinics, error: clinicsError } = useClinics();
  console.log(clinics);

  const [filters, setFilters] = useState<Filters>({
    state: "",
    city: "",
    pin: "",
    location: "",
    name: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({ pin: "", name: "", location: "" });

  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);


  const filteredClinics = useMemo(() => {
    if (loadingClinics) return [];
    const filterClinics = clinics?.filter(clinic => {

      const { state, city, pin, location, name } = filters;

      // Build address string from address object
      const addressStreet = clinic?.address?.street?.toLowerCase() || "";
      const addressCity = clinic?.address?.city?.toLowerCase() || "";
      const addressState = clinic?.address?.state?.toLowerCase() || "";
      const addressPin = clinic?.address?.postal_code || "";
      const fullAddress = `${addressStreet} ${addressCity} ${addressState} ${addressPin}`;
      
      const nameLower = clinic?.name?.toLowerCase() || "";
      const locationStr = [clinic?.location?.floor, clinic?.location?.room_number, clinic?.location?.wing].filter(Boolean).join(' ').toLowerCase() || "";

      const matchState = !state 
        || addressState?.includes(state.toLowerCase());

      const matchCity = !city 
        || addressCity?.includes(city.toLowerCase());

      const matchPin = !pin 
        || addressPin?.includes(pin);

      const matchLocation = !location 
        || locationStr.includes(location.toLowerCase())
        || fullAddress.includes(location.toLowerCase());

      const matchName = !name 
        || nameLower?.includes(name.toLowerCase());

      return matchState && matchCity && matchPin && matchLocation && matchName;
    });

    return filterClinics;

  }, [filters, clinics, loadingClinics]);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setFilters({ ...filters, state: value, city: '' });
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
    if (name === 'pin') validatePin(value);
    if (name === 'name') validateName(value);
    if (name === 'location') validateLocation(value);
  };

  const validatePin = (value: string) => {
    let error = "";
    if (value && !/^\d{1,6}$/.test(value)) {
      error = "PIN must be up to 6 digits.";
    }
    setErrors(prev => ({ ...prev, pin: error }));
  };

  const validateName = (value: string) => {
    let error = "";
    if (value && !/^[a-zA-Z\s.,'-]+$/.test(value)) {
      error = "Name contains invalid characters.";
    }
    setErrors(prev => ({ ...prev, name: error }));
  };

  const validateLocation = (value: string) => {
    let error = "";
    if (value && !/^[a-zA-Z0-9\s.,'-]+$/.test(value)) {
      error = "Location contains invalid characters.";
    }
    setErrors(prev => ({ ...prev, location: error }));
  };

  const handleBookClick = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setIsPopupOpen(true);
  };
  console.log(loadingClinics , clinicsError,"----")

  return (
    <div className="min-h-screen py-4">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-semibold ">
          Book an Appointment
        </h1>
        <p className="text-sm text-gray-400">
          Schedule your visit with our specialists at a time that works for you
        </p>
      </header>
      <div className="max-w-5xl mx-auto">

        <div className="bg-white rounded-sm border border-gray-300 p-4 mb-4">
          <SectionHeader title="Search & Filter Clinics" icon={<span className="material-symbols-sharp">filter_list</span>} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">

            <select name="state" value={filters.state} onChange={handleFilterChange} className="cursor-pointer w-full p-2 border border-gray-300 rounded-sm bg-gray-50 text-sm outline-none">
              <option value="">Select State</option>
              {
                states.map(state => 
                  <option key={state} value={state}>{state}</option>
                )
              }
            </select>

            <select name="city" value={filters.city} onChange={handleFilterChange} disabled={!filters.state} className="cursor-pointer w-full p-2 border border-gray-300 rounded-sm bg-gray-50 text-sm outline-none">
              <option value="">Select City</option>
              {
                filters.state && stateCities[filters.state]?.map(city => 
                  <option key={city} value={city}>{city}</option>
                )
              }
            </select>

            <div>
              <input type="text" name="pin" value={filters.pin} onChange={handleFilterChange} placeholder="Enter 6-digit PIN" className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${errors.pin ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin}</p>}
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <input type="text" name="location" value={filters.location} onChange={handleFilterChange} placeholder="Search by Location" className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${errors.location ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>

            <div>
              <input type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Search by Clinic Name" className={`w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

          </div>
        </div>

        <div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-400 font-semibold">CLINICS</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="mb-3 text-[12px] text-gray-600">
            Showing {filteredClinics.length} of {clinics?.length} clinics
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {!loadingClinics && clinicsError && <p className="col-span-full text-center text-xs py-10 text-red-400">Something went wrong while fetching the clinics</p>}
            {loadingClinics ? (
              <div className="col-span-full">
                <Loading size="100px"/>
              </div>
            ) : filteredClinics.length === 0 && !clinicsError ? (
              <div className="col-span-full text-center text-sm py-10 text-gray-400">
                <p className="font-medium mb-1">No clinics found</p>
                <p className="text-xs">Try adjusting your search criteria</p>
              </div>
            ) : (
              filteredClinics.map(clinic => <ClinicCard key={clinic.id} clinic={clinic} onBookClick={() => handleBookClick(clinic)} />)
            )}
          </div>

        </div>

      </div>


      {/* Open Modal on selecting a clinic */}
      {
        isPopupOpen && selectedClinic && (

          <CustomModal openModal={isPopupOpen} setOpenModal={setIsPopupOpen}>
            <AppointmentDateTime clinic={selectedClinic} setOpenAppointmentDateTime={setIsPopupOpen}/>
          </CustomModal>
        )
      }


    </div>
  );
}

export default function ClinicListsForAppointment() {
  return (
    // adding calendar context
    <CalenderProvider clinicId="demoClinic" dentistId="demoDentist">
      <CalendarClinicListPage />
    </CalenderProvider>
  );
}