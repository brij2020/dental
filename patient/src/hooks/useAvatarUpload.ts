import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { useProfile } from "./useProfile";
import useUpdateProfile from "./useUpdateProfile";

export default function useAvatarUpload() {
    const { profile } = useProfile();
    const { updateProfile } = useUpdateProfile();
    const [uploading, setUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // ---------- Helpers ----------
    // const sanitizeForPath = useCallback((s: string | null) => {
    //     if (!s) return "unknown";
    //     return s.trim().toLowerCase()
    //         .replace(/\s+/g, "_")
    //         .replace(/[^a-z0-9_-]/g, "");
    // }, []);

    const validateFile = (file: File): string | null => {
        if (!file) return "Please select a file.";
        if (!file.type.startsWith("image/")) return "Only image files are allowed.";
        if (file.size > 10 * 1024 * 1024) return "Image too large. Max 10 MB.";
        return null;
    };

    const buildPath = (file: File) => {
        // const sanitizedName = sanitizeForPath(profile.full_name);
        if (!profile?.id) {
            throw new Error("Profile ID is required for avatar upload");
        }
        const timestamp = Date.now();
        const safeName = `${timestamp}-${file.name.replace(/\s+/g, "_")}`;
        console.log(safeName);
        return `${profile.id}/profile-pic-${timestamp}`;
    };

    const getPublicOrSignedUrl = async (filePath: string) => {
        const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);

        if (publicData?.publicUrl) return publicData.publicUrl;

        const signedRes = await supabase.storage
            .from("avatars")
            .createSignedUrl(filePath, 300);

        if (signedRes.error || !signedRes.data?.signedUrl) {
            throw new Error("Uploaded but failed to generate public/signed URL.");
        }

        return signedRes.data.signedUrl;
    };

    // ---------- Main Upload Handler ----------
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const error = file ? validateFile(file) : "Please select a file.";
        if (error) return toast.error(error);

        if (!profile?.id) {
            toast.error("Profile information is missing. Please refresh the page.");
            return;
        }

        setUploading(true);
        let objectUrl: string | null = null;
        try {
            objectUrl = URL.createObjectURL(file);
            setLocalPreview(objectUrl);
        } catch (err) {
            console.error("Error creating object URL:", err);
            toast.error("Failed to preview image. Please try again.");
            setUploading(false);
            return;
        }

        try {
            const filePath = buildPath(file);

            const { data: files } = await supabase
                .storage
                .from("avatars")
                .list(profile.id);

            if (files && Array.isArray(files) && files.length > 0) {
                const paths = files.map(f => `${profile.id}/${f.name}`).filter(Boolean);
                if (paths.length > 0) {
                    await supabase.storage.from("avatars").remove(paths);
                }
            }

            // Upload to Supabase
            const uploadRes = await supabase.storage
                .from("avatars")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: true,
                });

            if (uploadRes.error) {
                console.error(uploadRes.error);
                toast.error(uploadRes.error.message);
                return;
            }

            const finalUrl = await getPublicOrSignedUrl(filePath);

            const { error: updateErr } = await updateProfile({ avatar: finalUrl });
            if (updateErr) throw new Error("Failed to update profile.");

            toast.success("Profile photo updated.");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Unexpected upload error.");

            // Clean up preview on error
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                setLocalPreview(null);
            }
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const openFilePicker = () => fileInputRef.current?.click();

    return { uploading, localPreview, fileInputRef, handleFileChange, openFilePicker };
}
