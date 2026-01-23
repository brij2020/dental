interface RescheduleModalProps {
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({setOpenModal}) => {
    return (
        <div className='p-3 flex flex-col gap-6 w-[600px] max-w-full' >
            <div className='flex flex-col'>
                <div className='font-semibold text-lg'>Confirm Reschedule</div>
                <p className='text-sm text-zinc-500 whi'>Are you sure you want to reschedule this appointment?</p>
            </div>
            <div className='flex items-center gap-3'>
                <button onClick={() => setOpenModal(false)} className='bg-zinc-500 hover:bg-zinc-400 text-white text-sm px-3 min-w-[100px] h-8 cursor-pointer rounded-sm'>Close</button>
                <button className='bg-sky-900 hover:bg-sky-700 text-white text-sm px-3 min-w-[100px] h-8 cursor-pointer rounded-sm'>Confirm</button>
            </div>
        </div>
    )
}

export default RescheduleModal