import AppointmentCard from '@/Components/Appointments/AppointmentCard';
import Loading from '@/Components/Loading';
import useGetAppointments from '@/hooks/useGetAppointments';


export default function UpcomingAppointments() {

  const { appointments: { upcoming }, loading, error } = useGetAppointments();
  console.log(upcoming);
  
  
  return (
    <div className='flex flex-col gap-5 p-0 md:p-4'>
      <div className="text-[18px] font-semibold">Upcoming Appointments</div>
      <div className=" flex flex-col gap-3">
        {
           error && (
            <div className="text-sm text-red-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">dangerous</span>
              <p>{error}</p>
            </div>
          )
        }
        {
          loading ? (
            <Loading size={"500px"}/>
          ) : (
            upcoming?.length === 0 ? (
              <div className="text-sm text-zinc-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <p>No upcoming appointments scheduled!</p>
              </div>
            ) : (
              upcoming.map((appointment) => (
                <AppointmentCard key={appointment?.id} appointment={appointment} appointmentType="upcoming" />
              ))
            )
          )
        }
        

      </div>
    </div>
  );
}

