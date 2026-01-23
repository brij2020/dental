import React from "react";
import { cn } from "@/lib/utils";

interface RecentAppointmentCardProps {          
  date: string;
  clinicName: string;
  doctorName: string;
  fileNumber: string;
  reportSummary: string;
  status: "completed" | "upcoming" | "cancelled";
  className?: string;
}

const RecentAppointmentCard: React.FC<RecentAppointmentCardProps> = ({
  date,
  clinicName,
  doctorName,
  fileNumber,
  reportSummary,
  status,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "relative rounded-sm border border-gray-300 bg-white p-4",
        "overflow-hidden group",
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Date</p>
          <p className="text-sm font-[500]">{date}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500">Clinic Name</p>
          <p className="text-sm font-[500]">{clinicName}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500">Dr. Name</p>
          <p className="text-sm font-[500]">{doctorName}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500">File Number</p>
          <p className="text-sm font-[500]">{fileNumber}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">Report/ Summary</p>
        <p className="text-sm text-gray-800">{reportSummary}</p>
      </div>

      <div className="mt-3 flex justify-end">
        <span
          className={cn(
            "text-xs px-2 py-1 rounded-full font-[500] capitalize",
            status === "completed" && "bg-green-100 text-green-800",
            status === "upcoming" && "bg-blue-100 text-blue-800",
            status === "cancelled" && "bg-red-100 text-red-800"
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export default RecentAppointmentCard;
