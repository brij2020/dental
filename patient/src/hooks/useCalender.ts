import { createContext, useContext } from "react";
// the type calenderContext containes the type of the value provided by the calender context
type calenderContext = {
  pickedDate: Date | null;
  unavailableDates: Date[];
  loading:boolean,
  pickedDateSetter: (date:Date | null) => void;
  unavailableDatesSetter: (dates:Date[]) => void;
};
export const calenderContext = createContext<calenderContext | null>(null);

export function useCalender() {
  const context = useContext(calenderContext);
  if (!context) throw Error("calender context is used outside its scope");
  return context;
}
