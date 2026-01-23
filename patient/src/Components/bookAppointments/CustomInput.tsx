import { forwardRef, type ForwardedRef } from "react";
import type { CustomInputProps } from "./types";


const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ value, onClick, onChange, placeholder }, ref: ForwardedRef<HTMLInputElement>) => (
    <div className="relative flex items-center w-full" onClick={onClick}>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded-sm bg-gray-50 text-sm outline-none"
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2"
        tabIndex={-1}
      >
        <span className="material-symbols-sharp text-[20px] text-gray-500">date_range</span>
      </button>
    </div>
  )
);
CustomInput.displayName = "CustomInput";

export default CustomInput;