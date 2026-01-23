export interface someAppointment {
  date: string;
  clinicName: string;
  doctorName: string;
  fileNumber: string;
  reportSummary: string;
  status: "completed" | "upcoming" | "cancelled";
}

import appointmentsData from './huda_appointments.txt?raw';

export async function fetchAppointments(): Promise<someAppointment[]> {
  try {
    console.log('Starting to fetch appointments (debug log)...');  

    await new Promise(resolve => setTimeout(resolve, 800)); 

    const data: someAppointment[] = JSON.parse(appointmentsData);
    console.log('Parsed data:', data); 
    
    return data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}