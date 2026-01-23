import React from "react";

interface DateSelectorProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
};

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {

    const isToday = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selected = new Date(date);
        selected.setHours(0, 0, 0, 0);

        return selected.getTime() === today.getTime();
    }

    // Helper to format date like "Wed, Oct 15"
    const formatDate = (date: Date) => {
        if(isToday(date)){
            return "Today"
        }

        return date.toLocaleDateString("en-US", {
            weekday: "short",
            day: "2-digit",
            month: "short",
        });
    };

    const isSameOrAfterToday = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // reset current time to 00:00:00
        const d = new Date(date);
        d.setHours(0, 0, 0, 0); // reset selected time
        return d >= today;
    };

    const handlePrev = () => {
        const prevDate = new Date(selectedDate);
        prevDate.setDate(selectedDate.getDate() - 1);
        if (isSameOrAfterToday(prevDate)) onDateChange(prevDate);
    };

    const handleNext = () => {
        const nextDate = new Date(selectedDate);
        nextDate.setDate(selectedDate.getDate() + 1);
        onDateChange(nextDate);
    };

    return (
        <div className="flex items-center justify-between py-2 px-1 rounded-md border-2 border-zinc-300">
            <button onClick={handlePrev} disabled={isToday(selectedDate)} className={`flex items-center justify-center p-1.5 ${isToday(selectedDate) ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 cursor-pointer"} rounded-full hover:bg-zinc-100`}><span className="material-symbols-sharp text-base">arrow_back_ios_new</span></button>
            <div className="flex items-center gap-2.5">
                <span className="material-symbols-sharp text-[19px] text-sky-800">today</span>
                <p className="font-semibold">{formatDate(selectedDate)}</p>
            </div>
            <button onClick={handleNext} className="flex items-center justify-center p-1.5 text-zinc-500 rounded-full hover:bg-zinc-100"><span className="material-symbols-sharp text-base">arrow_forward_ios</span></button>
        </div>
        
    );
};

export default DateSelector;
