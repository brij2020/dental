import { useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useProfile } from "./useProfile";
import useUpdateProfile from "./useUpdateProfile";
import { api } from "@/lib/apiClient";

export default function useAvatarUpload() {
    const { profile, setProfile } = useProfile();
    const { updateProfile } = useUpdateProfile();
    const [uploading, setUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const validateFile = (file: File): string | null => {
        if (!file) return "Please select a file.";
        if (!file.type.startsWith("image/")) return "Only image files are allowed.";
        if (file.size > 10 * 1024 * 1024) return "Image too large. Max 10 MB.";
        return null;
    };

    // ---------- Main Upload Handler ----------
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const error = file ? validateFile(file) : "Please select a file.";
        if (error) {
            toast.error(error);
            return;
        }

        if (!profile?.patient_id) {
            toast.error("Profile information is missing. Please refresh the page.");
            return;
        }

        setUploading(true);
        let objectUrl: string | null = null;
        try {
            objectUrl = URL.createObjectURL(file);
            setLocalPreview(objectUrl);
            console.log("📷 Image preview set:", objectUrl);
        } catch (err) {
            console.error("Error creating object URL:", err);
            toast.error("Failed to preview image. Please try again.");
            setUploading(false);
            return;
        }

        try {
            console.log("⏳ Starting upload for patient:", profile.patient_id);
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append("avatar", file);

            // Upload to backend
            console.log("📤 Uploading to backend...");
            const response: any = await api.post(
                `/api/patients/${profile.patient_id}/upload-avatar`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log("Backend upload response:", response);

            if (!response.success) {
                throw new Error(response.error || "Upload failed");
            }

            // Get the avatar URL from response - API wrapper adds extra layer
            // Backend response: { success, data: { patient, avatar, filename } }
            // API wrapper adds: { success, data: backendResponse, status }
            // So avatar is at response.data?.data?.avatar OR response.data?.avatar (if backend response is the data)
            const avatarUrl = response.data?.data?.avatar || response.data?.avatar;
            if (!avatarUrl) {
                console.error("Response structure:", response);
                throw new Error("No avatar URL in response");
            }

            console.log("✅ Upload successful, avatar URL:", avatarUrl);

            // Update the local profile state immediately with new avatar
            if (profile) {
                setProfile({
                    ...profile,
                    avatar: avatarUrl
                });
            }

            console.log("✅ Profile updated with new avatar");
            toast.success("✓ Profile photo saved successfully!");
        } catch (err: any) {
            console.error("Avatar upload error:", err);
            const errorMessage = err.response?.data?.message || err.message || "Unexpected upload error.";
            toast.error(errorMessage);

            // Clean up preview on error
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                setLocalPreview(null);
            }
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [profile, setProfile]);

    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return { uploading, localPreview, fileInputRef, handleFileChange, openFilePicker };
}
