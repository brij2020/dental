import React, { useEffect, useState } from "react";                                  
import { fetchAppointments, type someAppointment } from "@/services/huda_fakeApis";     
import RecentAppointmentCard from "@/Components/Appointments/RecentAppointmentCard";

 const RecentAppointments: React.FC = () => {

 // HARDCODED- replaced with dummy API calls 
  {/* const recentAppointments = [                                    
    {
      date: "16-06-2025",
      clinicName: "SPAI Labs",
      doctorName: "Dr. Nupur",
      fileNumber: "SP-1254",
      reportSummary: "Routine checkup is completed. Next visit is recommended in 2 months with 8 week medication prescribed.",
      status: "completed" as const,
    },
    {
      date: "20-06-2025",
      clinicName: "SPAI Labs",
      doctorName: "Dr. Ajay",
      fileNumber: "SP-3087",
      reportSummary: "Scheduled for braces adjustment. Patient reported mild discomfort. Some pre-treatment medicines prescribed.",
      status: "upcoming" as const,
    },
    {
      date: "26-06-2025",
      clinicName: "SPAI Labs",
      doctorName: "Dr. Rehman",
      fileNumber: "SP-0421",
      reportSummary: "Dental X-rays taken: Cavities are found. Treatment plan created including 2 fillings. Next session is scheduled for next week.",
      status: "completed" as const,
    }
  ]; 
  */} 
                                                                                
  const [appointments, setAppointments] = useState<someAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      const data = await fetchAppointments();
      setAppointments(data);
      setLoading(false);
    };
    
    loadAppointments();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="h-[68px]"></div>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-800"></div>
        </div>
      </div>
    );
  }

  return (
   <div className="flex flex-col gap-4 p-0 md:p-4">          
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-semibold">Recent Appointments</h1>
        <button className="text-sm text-cyan-800 font-[500] hover:underline">                  
          View All
        </button>
      </div>
      
      <div className="grid gap-3">  
        {appointments.map((appointment, index) => (                         
          <RecentAppointmentCard
            key={index}
            {...appointment}
          />
        ))}
      </div>
       
      {appointments.length === 0 && (                                       
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-gray-400 mb-2">
            <i className="fa-regular fa-calendar text-4xl"></i>
          </div>
          <p className="text-gray-500">No recent appointments found</p>
        </div>
      )}
    </div> 
  );
};

export default RecentAppointments;