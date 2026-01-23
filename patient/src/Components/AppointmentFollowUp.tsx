import React, { useState } from 'react'
import Input from './input'

interface SectionProps {
  setActiveSection: (section: string) => void
}

const Appointment: React.FC<SectionProps> = ({setActiveSection}) => {
    return (
        <>
            <div className='px-5 py-3 bg-gray-100 flex flex-col items-center'>
                <h2 className='font-bold text-xl text-cyan-800'>Schedule an Appointment</h2>
                <p className='text-xs text-gray-500'>Confirm your visit by filling the form</p>
            </div>

            <form className='flex flex-col gap-4 px-5 pb-5'>
                <div className='flex items-center gap-6'>
                    <div className='flex-1 flex flex-col'>
                        <Input label="State" type="text" id='state' className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm' />
                    </div>
                    <div className='flex-1 flex flex-col'>
                        <Input label="City" type="text" id='city' className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm' />
                    </div>
                </div>

                <div className='flex items-center gap-6'>
                    <div className='flex-1 flex flex-col'>
                        <Input label="District" type="text" id='district' className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm' />
                    </div>
                    <div className='flex-1 flex flex-col'>
                        <Input label="Pincode" type="text" id='pincode' className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm' />
                    </div>
                </div>


                <div className='flex items-center gap-6'>
                    <div className='flex-1'>
                        <Input as="select" label="Clinic" id="clinic" className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm'>
                            <option disabled selected>Select a Clinic</option>
                            <option>Clinic 1</option>
                            <option>Clinic 2</option>
                            <option>Clinic 3</option>
                            <option>Clinic 4</option>
                        </Input>
                    </div>
                </div>

                <div className='flex items-center gap-6'>
                    <div className='flex-1'>
                        <Input as="select" label="Doctor" id="doctor" className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm'>
                            <option disabled selected>Select a Doctor</option>
                            <option>Doctor 1</option>
                            <option>Doctor 2</option>
                            <option>Doctor 3</option>
                            <option>Doctor 4</option>
                        </Input>
                    </div>
                </div>


                <div className='flex items-center gap-6'>
                    <div className='flex-1 flex flex-col'>
                        <Input label="Date" type="date" id='date' className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm' />
                    </div>
                    <div className='flex-1 flex flex-col'>
                        <Input label="Time" type="time" id='time' className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm' />
                    </div>
                </div>

                <div className='w-full text-center'>
                    <button type='submit' className='w-full rounded-sm bg-cyan-800 text-white py-2.5 px-4 text-sm font-[500] mt-2 hover:bg-cyan-700'>Proceed to Book</button>
                </div>

                <p className='text-center text-sm text-gray-600'>Already had an appointment? <span className='font-bold text-cyan-800 hover:underline cursor-pointer' onClick={() => setActiveSection("follow-up")}>Follow Up</span></p>

            </form>
        </>
    )
}

const FollowUp: React.FC<SectionProps> = ({setActiveSection}) => {
    return (
        <>
           <div className='px-5 py-3 bg-gray-100 flex flex-col items-center'>
                <h2 className='font-bold text-xl text-cyan-800'>Schedule a Follow-Up</h2>
                <p className='text-xs text-gray-500'>Complete the form to continue your care</p>
            </div>

            <form className='flex flex-col gap-4 px-5 pb-5'>

                <div className='flex items-center gap-6'>
                    <div className='flex-1'>
                        <Input as="select" label="Clinic" id="clinic" className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm'>
                            <option disabled selected>Select a Clinic</option>
                            <option>Clinic 1</option>
                            <option>Clinic 2</option>
                            <option>Clinic 3</option>
                            <option>Clinic 4</option>
                        </Input>
                    </div>
                </div>

                <div className='flex items-center gap-6'>
                    <div className='flex-1 flex flex-col'>
                        <Input label="Date" type="date" id='date' className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm' />
                    </div>
                    <div className='flex-1 flex flex-col'>
                        <Input label="Time" type="time" id='time' className='w-full outline-none border border-gray-400 rounded-sm p-2 text-sm' />
                    </div>
                </div>

                <div className='w-full text-center'>
                    <button type='submit' className='w-full rounded-sm bg-cyan-800 text-white py-2.5 px-4 text-sm font-[500] mt-2 hover:bg-cyan-700'>Continue to Confirm</button>
                </div>

                <p className='text-center text-sm text-gray-600'>Proceeding with a new visit? <span className='font-bold text-cyan-800 hover:underline cursor-pointer' onClick={() => setActiveSection("appointment")}>Book Appointment</span></p>

            </form> 
        </>
    )
}

const AppointmentFollowUp: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>("appointment");

    return (
        <div>
            <div className='flex flex-col gap-6 '>
                {
                    activeSection == 'appointment' && (
                        <Appointment setActiveSection={setActiveSection}/>
                    )
                }

                {
                    activeSection == 'follow-up' && (
                        <FollowUp setActiveSection={setActiveSection}/>
                    )
                }

            </div>



        </div>
    )
}

export default AppointmentFollowUp
