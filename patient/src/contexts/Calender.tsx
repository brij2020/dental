import { useCallback, useEffect, useState, type ReactNode } from "react";
import { calenderContext } from "@/hooks/useCalender";
import { dateAPI } from "@/services/fakeApis";
//it needs props from parent for the information of clinic and doctor so that it can use this info to fetch unavailable dates
type calenderContextProps = {
  dentistId: string;
  clinicId?: string;
  initialDate?: string | Date | null;
  children: ReactNode;
};
//based on dentist ID and (optional clinic ID) we will fetch the unavailable dates and these
export default function CalenderProvider({
  dentistId,
  clinicId,
  initialDate,
  children,
}: calenderContextProps) {
  const [pickedDate, setDate] = useState<Date | null>(
    initialDate ? (initialDate instanceof Date ? initialDate : new Date(initialDate)) : null
  );
  const [unavailableDates, setDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const pickedDateSetter = useCallback((date: Date) => {
    setDate(date);
  }, []);
  const unavailableDatesSetter = useCallback((dates: Date[]) => {
    setDates(dates);
    setLoading(false);
  }, []);
  useEffect(() => {
    // fetch the unavailable dates from the server using dentistId and clinicId
    // unavailableDatesSetter(fetched dates)
    async function getDates() {
      const dates = await dateAPI([
        new Date(), // today
        new Date("2025-07-23"), // yesterday
        new Date("2025-07-24"), // 2 days from today
        new Date("2025-07-25"), // specific unavailable date
      ]);
      unavailableDatesSetter(dates);
    }
    getDates();
  }, [dentistId, clinicId]);

  return (
    <calenderContext.Provider
      value={{
        pickedDate,
        unavailableDates,
        pickedDateSetter,
        unavailableDatesSetter,
        loading,
      }}
    >
      {children}
    </calenderContext.Provider>
  );
}
