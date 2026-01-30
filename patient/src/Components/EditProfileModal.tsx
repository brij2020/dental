import type { Profile } from "@/hooks/useUpdateProfile";
import React, { useEffect, useMemo, useState } from "react";
import { State, City } from "country-state-city";
import { useForm } from "react-hook-form";

type Props = {
  onClose: () => void;
  profile: Profile;
  onSave: (updates: Partial<Profile>) => Promise<void>;
  scope: "personal" | "contact"; // which group is being edited
};

type FormValues = {
  full_name: string;
  gender: string;
  date_of_birth: string | null;
  // age: number | null;
  address: string | null;
  state: string | null; // will store state ISO code in the form
  city: string | null;
  pincode: string | null;
  contact_number: string | null;
  email: string | null;
};

const EditProfileModal: React.FC<Props> = ({ onClose, profile, onSave, scope }) => {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      full_name: "",
      gender: "",
      date_of_birth: null,
      // age: null,
      address: null,
      state: null,
      city: null,
      pincode: null,
      contact_number: null,
      email: null,
    },
  });

  useEffect(() => {
    if (profile) {
      // Format date_of_birth for HTML date input (YYYY-MM-DD)
      const formatForDateInput = (d: string | null | undefined) => {
        if (!d) return null;
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return null;
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      // map state name -> isoCode for select value
      const allStates = State.getStatesOfCountry('IN') || [];
      const stateObj = allStates.find(s => s.name === profile.state);
      const stateIso = stateObj ? stateObj.isoCode : '';

      // prepare cities list for the state
      const citiesForState = stateIso ? (City.getCitiesOfState('IN', stateIso) || []) : [];
      setCitiesList(citiesForState);

      reset({
        full_name: profile.full_name ?? "",
        gender: profile.gender ?? "",
        date_of_birth: formatForDateInput(profile.date_of_birth),
        // age: profile.age ?? null,
        address: profile.address ?? "",
        state: stateIso || null,
        city: profile.city ?? null,
        pincode: profile.pincode ?? "",
        contact_number: profile.contact_number ?? "",
        email: profile.email ?? "",
      });
    }
  }, [profile, reset]);

  // compute today's date in YYYY-MM-DD for setting max on date input
  const todayIso = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // State / City lists for India
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);

  // load states once
  useEffect(() => {
    try {
      const s = State.getStatesOfCountry('IN') || [];
      setStatesList(s);
    } catch (e) {
      setStatesList([]);
    }
  }, []);

  // compute age from date_of_birth for UX feedback
  const computeAge = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const dob = new Date(dateString);
    if (isNaN(dob.getTime())) return null;
    const diff = Date.now() - dob.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const submit = async (values: FormValues) => {
    const updates: Partial<Profile> = {};

    if (scope === "personal") {
      updates.full_name = values.full_name;
      updates.gender = values.gender;
      updates.date_of_birth = values.date_of_birth;
      // updates.age = values.age ?? null;
      updates.address = values.address;
      // Convert state isoCode back to state name for backend
      if (values.state) {
        const stateName = statesList.find(s => s.isoCode === values.state)?.name || values.state;
        updates.state = stateName;
      } else {
        updates.state = values.state as any;
      }
      updates.city = values.city;
      updates.pincode = values.pincode;
    } else if (scope === "contact") {
      updates.contact_number = values.contact_number;
      updates.email = values.email;
    }

    await onSave(updates);
    onClose();
  };

  const watchedDob = watch('date_of_birth');
  const age = computeAge(watchedDob);
  const watchedState = watch('state');

  // when state changes, update cities list
  useEffect(() => {
    if (!watchedState) {
      setCitiesList([]);
      return;
    }
    try {
      const c = City.getCitiesOfState('IN', watchedState) || [];
      setCitiesList(c);
    } catch (e) {
      setCitiesList([]);
    }
  }, [watchedState]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-2xl shadow-xl">
      <h3 className="text-xl font-bold mb-4">{scope === "personal" ? "Edit Personal Details" : "Edit Contact Details"}</h3>

      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        {scope === "personal" && (
          <>
            <div>
              <label className="block text-sm font-semibold">Full Name</label>
              <input {...register("full_name", { required: "Full name required" })} className="w-full px-3 py-2 border rounded" />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold">Gender</label>
              <select {...register("gender", { required: "Select gender" })} className="w-full px-3 py-2 border rounded">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer not to say">Prefer not to say</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold">Date of Birth</label>
                <input type="date" max={todayIso} {...register("date_of_birth")} className="w-full px-3 py-2 border rounded" aria-label="date of birth" />
              </div>

              <div>
                <label className="block text-sm font-semibold">Age</label>
                <input readOnly value={age ?? "-"} className="w-full px-3 py-2 border rounded bg-gray-50" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold">Address</label>
              <input {...register("address")} className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="sr-only">State</label>
                <select {...register("state")} className="w-full px-3 py-2 border rounded">
                  <option value="">Select state</option>
                  {statesList.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="sr-only">City</label>
                <select {...register("city")} className="w-full px-3 py-2 border rounded">
                  <option value="">Select city</option>
                  {citiesList.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <input {...register("pincode")} placeholder="Pincode" className="px-3 py-2 border rounded" />
            </div>
          </>
        )}

        {/* {scope === "contact" && (
            <>
              <div>
                <label className="block text-sm font-semibold">Mobile</label>
                <input {...register("contact_number", { required: "Mobile required" })} className="w-full px-3 py-2 border rounded" />
                {errors.contact_number && <p className="text-xs text-red-500 mt-1">{errors.contact_number.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold">Email</label>
                <input type="email" {...register("email", { required: "Email required" })} className="w-full px-3 py-2 border rounded" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
            </>
          )} */}

        <div className="flex gap-3 justify-end mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border bg-zinc-500 hover:bg-zinc-400 text-white text-sm">Cancel</button>
          <button disabled={isSubmitting} type="submit" className={`${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-sky-700 hover:bg-sky-600 cursor-pointer"} px-4 py-2 rounded  text-sm text-white`}>
            {
              isSubmitting ? "Saving..." : "Save"
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileModal;