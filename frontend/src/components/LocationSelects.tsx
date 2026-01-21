import React from 'react';
import { IconWorld, IconBuilding, IconMapPin } from '@tabler/icons-react';
import type { LocationOption } from '../hooks/useLocationData';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  icon: React.ElementType;
  options: LocationOption[];
  placeholder?: string;
  isLoading?: boolean;
};

/**
 * Styled select component matching the existing UI design
 */
export const LocationSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, label, icon: Icon, options, placeholder = 'Select...', isLoading, disabled, ...props }, ref) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-5 w-5 text-slate-400" />
        </span>
        <select
          id={id}
          ref={ref}
          disabled={disabled || isLoading}
          className="w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-8 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
          {...props}
        >
          <option value="">
            {isLoading ? 'Loading...' : placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Dropdown arrow */}
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </div>
  )
);

LocationSelect.displayName = 'LocationSelect';

// --- Convenience Components with preset icons ---

type LocationFieldProps = Omit<SelectProps, 'icon' | 'label'> & {
  label?: string;
};

export const CountrySelect = React.forwardRef<HTMLSelectElement, LocationFieldProps>(
  ({ label = 'Country', ...props }, ref) => (
    <LocationSelect ref={ref} label={label} icon={IconWorld} placeholder="Select Country" {...props} />
  )
);

CountrySelect.displayName = 'CountrySelect';

export const StateSelect = React.forwardRef<HTMLSelectElement, LocationFieldProps>(
  ({ label = 'State', ...props }, ref) => (
    <LocationSelect ref={ref} label={label} icon={IconBuilding} placeholder="Select State" {...props} />
  )
);

StateSelect.displayName = 'StateSelect';

export const CitySelect = React.forwardRef<HTMLSelectElement, LocationFieldProps>(
  ({ label = 'City', ...props }, ref) => (
    <LocationSelect ref={ref} label={label} icon={IconMapPin} placeholder="Select City" {...props} />
  )
);

CitySelect.displayName = 'CitySelect';

// --- Combined Location Selects Component ---

type LocationSelectsProps = {
  country: string;
  state: string;
  city: string;
  countries: LocationOption[];
  states: LocationOption[];
  cities: LocationOption[];
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  isLoadingStates?: boolean;
  isLoadingCities?: boolean;
  disabled?: boolean;
  // Optional: customize grid layout
  className?: string;
};

/**
 * Combined component that renders all three location dropdowns
 * with proper cascading behavior built-in.
 */
export function LocationSelects({
  country,
  state,
  city,
  countries,
  states,
  cities,
  onCountryChange,
  onStateChange,
  onCityChange,
  isLoadingStates,
  isLoadingCities,
  disabled,
  className = 'grid grid-cols-1 md:grid-cols-3 gap-4',
}: LocationSelectsProps) {
  return (
    <div className={className}>
      <CountrySelect
        id="country"
        name="country"
        value={country}
        options={countries}
        onChange={(e) => onCountryChange(e.target.value)}
        disabled={disabled}
      />
      <StateSelect
        id="state"
        name="state"
        value={state}
        options={states}
        onChange={(e) => onStateChange(e.target.value)}
        disabled={disabled || !country}
        isLoading={isLoadingStates}
      />
      <CitySelect
        id="city"
        name="city"
        value={city}
        options={cities}
        onChange={(e) => onCityChange(e.target.value)}
        disabled={disabled || !state}
        isLoading={isLoadingCities}
      />
    </div>
  );
}

export default LocationSelects;