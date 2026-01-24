import AppointmentCard from '@/Components/Appointments/AppointmentCard';
import Loading from '@/Components/Loading';
import { useProfile } from '@/hooks/useProfile'
import useGetAppointments from '@/hooks/useGetAppointments';
import { getAppointmentCountdown } from '@/services/getAppointmentCountdown';
import { Link } from 'react-router-dom';
import AppointmentStatCard from '@/Components/dashboard/AppointmentStatCard';
import QuickActionCard from '@/Components/dashboard/QuickActionCard';

const SectionContainer = ({ className, children }) => {
	return (
		<div className={`flex flex-col gap-3.5 ${className}`}>
			{children}
		</div>
	)
}

const SectionHeader = ({ icon, title }) => {
	return (
		<p className='text-base md:text-[17px] font-semibold text-slate-700 flex items-center gap-2'>
			<span className='material-symbols-sharp text-xl font-semibold'>{icon}</span>
			<span className='whitespace-nowrap'>{title}</span>
		</p>
	)
}

const QuotesIcon = () => {
	return (
		<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" className="text-dark-green" height="2em" width="2em" xmlns="http://www.w3.org/2000/svg">
			<path d="M3.691 6.292C5.094 4.771 7.217 4 10 4h1v2.819l-.804.161c-1.37.274-2.323.813-2.833 1.604A2.902 2.902 0 0 0 6.925 10H10a1 1 0 0 1 1 1v7c0 1.103-.897 2-2 2H3a1 1 0 0 1-1-1v-5l.003-2.919c-.009-.111-.199-2.741 1.688-4.789zM20 20h-6a1 1 0 0 1-1-1v-5l.003-2.919c-.009-.111-.199-2.741 1.688-4.789C16.094 4.771 18.217 4 21 4h1v2.819l-.804.161c-1.37.274-2.323.813-2.833 1.604A2.902 2.902 0 0 0 17.925 10H21a1 1 0 0 1 1 1v7c0 1.103-.897 2-2 2z"></path>
		</svg>
	)
}


const DashboardLanding = () => {
	const { loading: profileLoading, profile } = useProfile();
	const { appointments: { upcoming, previous, missed }, loading: appointmentsLoading } = useGetAppointments();
	console.log(upcoming)

	const countDown = getAppointmentCountdown(upcoming[0]?.appointment_date, upcoming[0]?.appointment_time);

	// Only show loading if profile is still loading. Appointments can load in background
	if (profileLoading) {
		return (
			<Loading size={"500px"} />
		)
	}

	return (
		<div className='flex flex-col gap-8 p-0 md:px-2 xs:py-1'>

			<div className='flex flex-col'>
				<h2 className='font-bold text-xl xs:text-2xl text-sky-800'>Welcome back, {profile?.full_name?.split(" ")[0] || ""} 👋</h2>
				<p className='text-xs xs:text-sm text-zinc-500'>Manage your appointments and treatment in one place.</p>
			</div>

			<div className='grid grid-cols-10 gap-x-4 2xl:gap-x-6 gap-y-8 md:gap-y-12'>

				{/* Next Appointment */}
				<SectionContainer className="col-span-10 md:col-span-7 xl2:col-span-8 bg-white rounded-md p-3">
					<div className='flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2'>
						<SectionHeader icon="event_upcoming" title="Your Next Appointment" />
						{
							countDown && (
								<div className='flex items-center gap-1 text-[11px] bg-yellow-200 text-yellow-800 rounded-full px-2.5 py-1 font-semibold'>
									<span className="material-symbols-sharp text-[14px]">hourglass_top</span>
									<p className='whitespace-nowrap'>
										{
											countDown?.type === "days" ? (
												`${countDown?.days} day${countDown?.days !== 1 ? "s" : ""} left`
											) : (
												`${countDown?.hours} hrs, ${countDown?.minutes} mins left`
											)
										}
									</p>
								</div>
							)
						}

					</div>
					<div>
						{
							upcoming?.length > 0 ? (
								<AppointmentCard appointment={upcoming[0]} appointmentType='upcoming' className='bg-zinc-100' />
							) : (
								<div className='flex flex-col gap-4 bg-zinc-50 rounded-md p-3 xs:p-4'>
									<div className='flex items-center gap-1.5 text-xs text-zinc-400'>
										<span className="material-symbols-outlined text-[14px]">info</span>
										<p>You don't have any appointments scheduled right now.</p>
									</div>
									<Link to="/book-appointment-clinics" className='flex items-center gap-2 font-semibold bg-sky-700 hover:bg-sky-500 w-fit text-white rounded-md py-2 px-3 text-sm'>
										<p>Book Appointment</p>
										<span className='material-symbols-sharp'>arrow_forward</span>
									</Link>
								</div>
							)
						}

					</div>
				</SectionContainer>

				{/* Daily Care Tip */}
				<SectionContainer className="col-span-10 md:col-span-3 xl2:col-span-2 bg-white rounded-md p-3">
					<div className='flex items-center justify-between gap-2'>
						<SectionHeader icon="dentistry" title="Daily Smile Tips" />
					</div>
					<div className='bg-sky-400/10 rounded-md h-full grid place-items-center p-2'>
						<div className='flex flex-col text-sky-900 p-2 gap-1'>

							<QuotesIcon />
							<p className='text-sm font-semibold'>Brush twice daily for at least 2 minutes.</p>
						</div>
					</div>
				</SectionContainer>

				{/* Quick Actions */}
				<SectionContainer className="col-span-10 md:col-span-5 xl:col-span-4">
					<SectionHeader icon="action_key" title="Quick Actions" />
					<div className='grid grid-cols-1 xs:grid-cols-2 auto-rows-fr gap-4 md:gap-2 xl:gap-3 2xl:gap-4'>
						<QuickActionCard path='/book-appointment-clinics' icon="calendar_add_on" title={<>Book<br />Appointment</>} />
						<QuickActionCard path='/appointment-follow-up' icon="autorenew" title={<>Schedule<br />Follow Up</>} />
						<QuickActionCard path='/upcoming-appointments' icon="backup_table" title={<>View<br />Appointments</>} />
						<QuickActionCard path={`/user-info/${profile?.uhid}`} icon="id_card" title={<>Update<br />Profile</>} />
					</div>
				</SectionContainer>

				{/* Appointment Overview */}
				<SectionContainer className="col-span-10 md:col-span-5 xl:col-span-6 ml-0 md:ml-2 lg:ml-4 xl:ml-6">
					<SectionHeader icon="event_note" title="Appointment Overview" />
					<div className='grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-4 md:gap-2 xl:gap-3 2xl:gap-4 '>

						<AppointmentStatCard path='/previous-appointments' icon="calendar_check" count={previous?.length} label="Completed" color='violet' />
						<AppointmentStatCard path='/upcoming-appointments' icon="event_upcoming" count={upcoming?.length} label="Upcoming" color='cyan' />
						<AppointmentStatCard path='/missed-appointments' icon="event_busy" count={missed?.length} label="Missed" color='red' />

					</div>
				</SectionContainer>
			</div>


		</div>
	)
}

export default DashboardLanding