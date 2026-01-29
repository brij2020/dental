import { useState, useEffect } from "react";
import { UserProfileCard, UserProfileField } from "@/Components/UserInfoCard";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/imageUrlHelper";
import EditProfileModal from "@/Components/EditProfileModal";
import { toast } from "react-toastify";
import { useProfile } from "@/hooks/useProfile";
import CustomModal from "@/Components/CustomModal";
import Loading from "@/Components/Loading";
import useUpdateProfile from "@/hooks/useUpdateProfile";
import useAvatarUpload from "@/hooks/useAvatarUpload";

export default function UserInfo() {
  const { loading, profile, setProfile } = useProfile();
  const { updateProfile } = useUpdateProfile();
  const { uploading, localPreview, fileInputRef, handleFileChange, openFilePicker } = useAvatarUpload();
  const [openModal, setOpenModal] = useState(false);
  const [modalScope, setModalScope] = useState<"personal" | "contact">("personal");

  if (loading) {
    return (
      <Loading size={"500px"}></Loading>
    );
  }

  const openEdit = (scope: "personal" | "contact") => {
    setModalScope(scope);
    setOpenModal(true);
  };

  const handleSave = async (updates: Partial<typeof profile>) => {
    const res = await updateProfile(updates);
    if (!res.success || res.error) {
      console.error("Failed to save profile:", res.error);
      const errorMessage = res.error instanceof Error 
        ? res.error.message 
        : "Failed to save profile. Please try again.";
      toast.error(errorMessage);
    } else {
      // Sync the updated profile data with the context
      if (res.data && profile) {
        setProfile({ ...profile, ...res.data });
      }
      toast.success("Profile updated successfully");
    }
  };

  const displayedAvatar = profile?.avatar?.trim() ? profile?.avatar : localPreview;

  // Debug: Log the avatar URL being used
  useEffect(() => {
    if (displayedAvatar) {
      const fullUrl = getImageUrl(displayedAvatar);
      console.log("Avatar URL Debug:", {
        original: displayedAvatar,
        fullUrl: fullUrl,
        isLocalPreview: displayedAvatar === localPreview
      });
    }
  }, [displayedAvatar, localPreview]);

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-0 md:p-4">


      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-shrink-0 self-center lg:self-start">
          <div className="relative group">
            
            {/* Profile Image (click to change) */}
            <div className="p-1 rounded-full cursor-pointer" onClick={openFilePicker} title="Click to change photo">
              <div className={cn("relative w-24 h-24 rounded-full overflow-hidden", "border-[5px] border-white")}>
                {
                displayedAvatar ? (
                  <img 
                    src={getImageUrl(displayedAvatar)} 
                    alt={profile?.full_name || "avatar"} 
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onLoad={() => console.log("✅ Image loaded successfully")}
                    onError={(e) => {
                      console.error("❌ Image failed to load:", {
                        src: (e.currentTarget as HTMLImageElement).src,
                        original: displayedAvatar,
                        error: e.type
                      });
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-3xl font-bold text-gray-600 group-hover:text-blue-800 transition-colors">{profile?.full_name?.charAt(0) || "U"}</span>
                  </div>
                )}

                {/* Uploading overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white text-xs">Saving...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Camera icon picker button */}
            <div className={cn("absolute bottom-1 right-1 cursor-pointer", "bg-blue-600 rounded-full w-8 h-8 shadow-md", "transition-all duration-300", "group-hover:bg-blue-700 group-hover:scale-110", "flex items-center justify-center", uploading && "opacity-50 pointer-events-none")} onClick={openFilePicker} title="Click to pick image and save">
              <span className="material-symbols-sharp text-white text-base">photo_camera</span>
            </div>

            {/* hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange}/>
            
            {/* Status indicator */}
            {localPreview && !uploading && (
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span className="text-xs text-green-600 font-medium">✓ Image saved</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 grid gap-6 w-full">

          <UserProfileCard title="Personal Details" openEdit={openEdit}>
            <UserProfileField label="Full Name" value={profile?.full_name || "N/A"} />
            <UserProfileField label="Gender" value={profile?.gender?.toUpperCase() || "N/A"} />
            <UserProfileField
              label="DOB"
              value={formatDate(profile?.date_of_birth)}
            />
            <UserProfileField label="Address" value={profile?.address || "N/A"} />
            <UserProfileField label="State" value={profile?.state || "N/A"} />
            <UserProfileField label="City" value={profile?.city || "N/A"} />
            <UserProfileField label="Pincode" value={profile?.pincode || "N/A"} />
          </UserProfileCard>


          <UserProfileCard title="Contact Details">
            <UserProfileField
              label="Mobile No."
              value={`(+91) ${profile?.contact_number  || "N/A"}`}
            />
            <UserProfileField label="Email" value={profile?.email  || "N/A"} />
          </UserProfileCard>
        </div>
      </div>

      <CustomModal openModal={openModal} setOpenModal={setOpenModal}>
        <EditProfileModal
          onClose={() => setOpenModal(false)}
          profile={profile}
          onSave={async (updates) => {
            await handleSave(updates);
          }}
          scope={modalScope}
        />
      </CustomModal>

    </div>
  );
}