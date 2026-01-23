import type { Profile } from "@/hooks/useUpdateProfile";
import React, { useEffect } from "react";
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
  state: string | null;
  city: string | null;
  pincode: string | null;
  contact_number: string | null;
  email: string | null;
};

const EditProfileModal: React.FC<Props> = ({ onClose, profile, onSave, scope }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
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
      reset({
        full_name: profile.full_name ?? "",
        gender: profile.gender ?? "",
        date_of_birth: profile.date_of_birth ?? null,
        // age: profile.age ?? null,
        address: profile.address ?? "",
        state: profile.state ?? "",
        city: profile.city ?? "",
        pincode: profile.pincode ?? "",
        contact_number: profile.contact_number ?? "",
        email: profile.email ?? "",
      });
    }
  }, [profile, reset]);

  const submit = async (values: FormValues) => {
    const updates: Partial<Profile> = {};

    if (scope === "personal") {
      updates.full_name = values.full_name;
      updates.gender = values.gender;
      updates.date_of_birth = values.date_of_birth;
      // updates.age = values.age ?? null;
      updates.address = values.address;
      updates.state = values.state;
      updates.city = values.city;
      updates.pincode = values.pincode;
    } else if (scope === "contact") {
      updates.contact_number = values.contact_number;
      updates.email = values.email;
    }

    await onSave(updates);
    onClose();
  };

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
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold">Date of Birth</label>
                <input type="date" {...register("date_of_birth")} className="w-full px-3 py-2 border rounded" />
              </div>

              {/* <div>
                <label className="block text-sm font-semibold">Age</label>
                <input type="number" {...register("age", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded" />
              </div> */}
            </div>

            <div>
              <label className="block text-sm font-semibold">Address</label>
              <input {...register("address")} className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input {...register("state")} placeholder="State" className="px-3 py-2 border rounded" />
              <input {...register("city")} placeholder="City" className="px-3 py-2 border rounded" />
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