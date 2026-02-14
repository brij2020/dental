import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import type { Clinic, Filters, ValidationErrors } from "@/Components/bookAppointments/types";
import SectionHeader from "@/Components/bookAppointments/SectionHeader";
import ClinicCard from "@/Components/bookAppointments/ClinicCard";
import CalenderProvider from "../contexts/Calender";
import useClinics from "@/hooks/useClinics";
import { states, stateCities } from '../services/locations'
import CustomModal from "@/Components/CustomModal";
import AppointmentDateTime from "@/Components/bookAppointments/AppointmentDateTime";
import Loading from "@/Components/Loading";
import * as clinicService from "@/services/clinicService";
import Pagination from "@/Components/Pagination";



function CalendarClinicListPage() {
  const { clinics, loading: loadingClinics, error: clinicsError } = useClinics();

  const [filters, setFilters] = useState<Filters>({
    state: "",
    city: "",
    pin: "",
    location: "",
    name: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({ pin: "", name: "", location: "" });
  const [submittedFilters, setSubmittedFilters] = useState<Filters | null>(null);
  const [searchResults, setSearchResults] = useState<Clinic[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    if (!submittedFilters) {
      setSearchResults(clinics || []);
      setSearchError(null);
      return;
    }

    const fetchResults = async () => {
      setSearchLoading(true);
      try {
        const data = await clinicService.searchClinics(submittedFilters);
        setSearchResults(data);
        setSearchError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to search clinics";
        setSearchError(message);
      } finally {
        setSearchLoading(false);
      }
    };

    fetchResults();
  }, [submittedFilters, clinics]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchResults]);

  const totalPages = Math.max(1, Math.ceil(searchResults.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedClinics = searchResults.slice((safePage - 1) * pageSize, safePage * pageSize);
  const isLoading = searchLoading || (!submittedFilters && loadingClinics);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedFilters({ ...filters });
    setCurrentPage(1);
  };

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

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 mt-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Search by Location (By Default)</p>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Floor, room, wing, or address keywords"
                className={`w-full p-3 border rounded-sm bg-gray-50 text-sm outline-none ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Clinic Name</p>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Dr. Neville Dental Care"
                className={`w-full p-3 border rounded-sm bg-gray-50 text-sm outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">State / City</p>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  name="state"
                  value={filters.state}
                  onChange={handleFilterChange}
                  className="cursor-pointer w-full p-3 border border-gray-300 rounded-sm bg-gray-50 text-sm outline-none"
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <select
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  disabled={!filters.state}
                  className="cursor-pointer w-full p-3 border border-gray-300 rounded-sm bg-gray-50 text-sm outline-none"
                >
                  <option value="">Select City</option>
                  {filters.state &&
                    stateCities[filters.state]?.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">PIN Code</p>
              <input
                type="text"
                name="pin"
                value={filters.pin}
                onChange={handleFilterChange}
                placeholder="Enter 6-digit PIN"
                className={`w-full p-3 border rounded-sm bg-gray-50 text-sm outline-none ${errors.pin ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin}</p>}
            </div>

            <div className="flex flex-wrap gap-3 items-end justify-end">
              <button
                type="button"
                onClick={() => {
                  setFilters({ state: "", city: "", pin: "", location: "", name: "" });
                  setSubmittedFilters(null);
                  setErrors({ pin: "", name: "", location: "" });
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-sm hover:bg-gray-300 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700 transition"
              >
                Search Clinics
              </button>
            </div>
          </form>
        </div>

        <div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-400 font-semibold">CLINICS</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="mb-3 text-[12px] text-gray-600 flex items-center justify-between gap-2">
            <span>Showing {searchResults.length} of {clinics?.length ?? searchResults.length} clinics</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {(searchError || clinicsError) && !isLoading && (
              <p className="col-span-full text-center text-xs py-10 text-red-400">{searchError || clinicsError}</p>
            )}
            {isLoading ? (
              <div className="col-span-full">
                <Loading size="100px" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="col-span-full text-center text-sm py-10 text-gray-400">
                <p className="font-medium mb-1">No clinics found</p>
                <p className="text-xs">Try adjusting your search criteria</p>
              </div>
            ) : (
              paginatedClinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} onBookClick={() => handleBookClick(clinic)} />
              ))
            )}
          </div>

          {!isLoading && searchResults.length > 0 && (
            <Pagination
              className="mt-6"
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          )}

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
