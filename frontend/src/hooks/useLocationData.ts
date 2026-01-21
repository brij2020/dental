import { useState, useMemo } from 'react';
import { Country, State, City } from 'country-state-city';
import type { ICountry, IState, ICity } from 'country-state-city';

export type LocationOption = {
  value: string;
  label: string;
};

export type LocationState = {
  country: string;
  state: string;
  city: string;
};

export type UseLocationDataReturn = {
  // Current selections
  location: LocationState;
  
  // Options for dropdowns
  countries: LocationOption[];
  states: LocationOption[];
  cities: LocationOption[];
  
  // Handlers
  setCountry: (countryCode: string) => void;
  setState: (stateCode: string) => void;
  setCity: (cityName: string) => void;
  resetLocation: () => void;
  
  // Loading states (for potential async operations)
  isLoadingStates: boolean;
  isLoadingCities: boolean;
};

const INITIAL_LOCATION: LocationState = {
  country: '',
  state: '',
  city: '',
};

/**
 * Custom hook for managing cascading country-state-city dropdowns.
 * Uses the country-state-city library for data.
 * 
 * @param initialLocation - Optional initial location state
 * @param defaultCountry - Optional default country code (e.g., 'IN' for India)
 */
export function useLocationData(
  initialLocation?: Partial<LocationState>,
  defaultCountry?: string
): UseLocationDataReturn {
  const [location, setLocation] = useState<LocationState>({
    ...INITIAL_LOCATION,
    country: defaultCountry || '',
    ...initialLocation,
  });
  
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Get all countries - memoized since it doesn't change
  const countries = useMemo<LocationOption[]>(() => {
    const allCountries = Country.getAllCountries();
    return allCountries.map((country: ICountry) => ({
      value: country.isoCode,
      label: country.name,
    }));
  }, []);

  // Get states based on selected country
  const states = useMemo<LocationOption[]>(() => {
    if (!location.country) return [];
    
    setIsLoadingStates(true);
    const countryStates = State.getStatesOfCountry(location.country);
    setIsLoadingStates(false);
    
    return countryStates.map((state: IState) => ({
      value: state.isoCode,
      label: state.name,
    }));
  }, [location.country]);

  // Get cities based on selected country and state
  const cities = useMemo<LocationOption[]>(() => {
    if (!location.country || !location.state) return [];
    
    setIsLoadingCities(true);
    const stateCities = City.getCitiesOfState(location.country, location.state);
    setIsLoadingCities(false);
    
    return stateCities.map((city: ICity) => ({
      value: city.name,
      label: city.name,
    }));
  }, [location.country, location.state]);

  // Handler: Set country (resets state and city)
  const setCountry = (countryCode: string) => {
    setLocation({
      country: countryCode,
      state: '',
      city: '',
    });
  };

  // Handler: Set state (resets city)
  const setState = (stateCode: string) => {
    setLocation(prev => ({
      ...prev,
      state: stateCode,
      city: '',
    }));
  };

  // Handler: Set city
  const setCity = (cityName: string) => {
    setLocation(prev => ({
      ...prev,
      city: cityName,
    }));
  };

  // Handler: Reset all location fields
  const resetLocation = () => {
    setLocation({
      ...INITIAL_LOCATION,
      country: defaultCountry || '',
    });
  };

  return {
    location,
    countries,
    states,
    cities,
    setCountry,
    setState,
    setCity,
    resetLocation,
    isLoadingStates,
    isLoadingCities,
  };
}

/**
 * Utility function to get the display name from a code
 */
export function getCountryName(countryCode: string): string {
  const country = Country.getCountryByCode(countryCode);
  return country?.name || countryCode;
}

export function getStateName(countryCode: string, stateCode: string): string {
  const state = State.getStateByCodeAndCountry(stateCode, countryCode);
  return state?.name || stateCode;
}

export default useLocationData;