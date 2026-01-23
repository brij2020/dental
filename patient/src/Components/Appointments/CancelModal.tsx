interface CancelModalProps {
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const CancelModal: React.FC<CancelModalProps> = ({setOpenModal}) => {
  return (
    <div>
        <div className='p-3 flex flex-col gap-6 w-[600px] max-w-full' >
            <div className='flex flex-col'>
                <div className='font-semibold text-lg'>Cancel Appointment</div>
                <p className='text-sm text-zinc-500'>Are you sure you want to cancel this appointment? This action cannot be undone.</p>
            </div>
            <div className='flex items-center gap-3'>
                <button onClick={() => setOpenModal(false)} className='bg-zinc-500 hover:bg-zinc-400 text-white text-sm px-3 min-w-[100px] h-8 cursor-pointer rounded-sm'>Close</button>
                <button className='bg-red-700 hover:bg-red-500 text-white text-sm px-3 min-w-[100px] h-8 cursor-pointer rounded-sm'>Cancel</button>
            </div>
        </div>
    </div>
  )
}

export default CancelModal