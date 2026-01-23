import { cn } from "@/lib/utils";
import React from "react";

interface UserProfileCardProps {
    className?: string;
    children: React.ReactNode;
    title: string;
    openEdit?: (scope: "personal" | "contact") => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
    className,
    children,
    title,
    openEdit,
}) => {
    return (
        <div
            className={cn(
                "rounded-sm border border-gray-300 bg-white p-6 relative overflow-hidden",
                className
            )}
        >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 relative z-10">
                <h3 className="text-lg font-semibold text-cyan-800">{title}</h3>
                {
                    openEdit && (
                        <button onClick={() => openEdit("personal")} className="bg-sky-600 text-sm rounded-sm text-white px-4 py-1.5 hover:bg-sky-500 hover:scale-105 transition-all duration-200">Edit</button>

                    )
                }
            </div>
            <div className="space-y-4 relative z-10">{children}</div>
        </div>
    );
};

interface UserProfileFieldProps {
    label: string;
    value: string;
    className?: string;
}

export const UserProfileField: React.FC<UserProfileFieldProps> = ({
    label,
    value,
    className,
}) => {
    return (
        <div className={cn("flex items-start gap-4 group-hover:gap-2 transition-all duration-300", className)}>
            <p className="text-sm text-gray-500 font-medium w-24 group-hover:text-gray-600 transition-colors">{label}:</p>
            <p className="text-sm font-[500] text-gray-800 flex-1 group-hover:text-gray-900 transition-colors">{value}</p>
        </div>
    );
};