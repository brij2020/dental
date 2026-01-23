export interface Appointment {
    id: string;
    status: string;
    appointment_uid: string;
    appointment_date: string;
    appointment_time: string;
    doctor_id: string;
    clinics: Clinic | null;
}


export interface Clinic {
  id: string;             
  name: string;            
  address: string;         
  city: string;            
  State: string;     
  pincode: string;      
  contact_number: string;   
  contact_name: string;
  doctor_id: string;
}