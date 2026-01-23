import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { subDays } from "date-fns";
import { useCalender } from "@/hooks/useCalender";

// search for on selecting the date
export default function Datepicker() {
  const { unavailableDates, pickedDateSetter, loading } = useCalender();
  return (
    <div>
      {loading ? (
        <h1>loading ...</h1>
      ) : (
        <DatePicker
          excludeDates={unavailableDates}
          placeholderText="Pick an available date"
          withPortal
          onChange={(date: Date | null) => {
            console.log(date)
            if (date) pickedDateSetter(date);
            else return;
          }}
          excludeDateIntervals={[
            {
              start: new Date(0),
              end: subDays(new Date(), 0),
            },
          ]}
        />
      )}
    </div>
  );
}
