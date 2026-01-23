import { useCalender } from '@/hooks/useCalender'



export default function SlotList() {
  const { pickedDate } = useCalender()
  return (
    <div>
      {
        pickedDate ? (

          pickedDate?.toString()
        ) : (
          <span className='text-gray-400'>Please select a date to see available time slots</span>
        )
      }
    </div>
  )
}