import React, { useState } from "react";

interface DateSelectorProps {
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
};

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {
    const [showDateList, setShowDateList] = useState(false);

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
        if (!selectedDate) return;
        const prevDate = new Date(selectedDate);
        prevDate.setDate(selectedDate.getDate() - 1);
        if (isSameOrAfterToday(prevDate)) onDateChange(prevDate);
    };

    const handleNext = () => {
        if (!selectedDate) return;
        const nextDate = new Date(selectedDate);
        nextDate.setDate(selectedDate.getDate() + 1);
        onDateChange(nextDate);
    };

    // Generate list of next 30 days
    const getAvailableDates = () => {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }

        return dates;
    };

    const availableDates = getAvailableDates();

    return (
        <div className="flex flex-col gap-2">
            {/* Navigation buttons */}
            <div className="flex items-center justify-between py-2 px-1 rounded-md border-2 border-zinc-300">
                <button 
                    onClick={handlePrev} 
                    disabled={selectedDate && isToday(selectedDate)} 
                    className={`flex items-center justify-center p-1.5 ${selectedDate && isToday(selectedDate) ? "text-zinc-300 cursor-not-allowed" : "text-zinc-500 cursor-pointer"} rounded-full hover:bg-zinc-100`}
                >
                    <span className="material-symbols-sharp text-base">arrow_back_ios_new</span>
                </button>
                <div className="flex items-center gap-2.5 flex-1 justify-center cursor-pointer" onClick={() => setShowDateList(!showDateList)}>
                    <span className="material-symbols-sharp text-[19px] text-sky-800">today</span>
                    <p className="font-semibold">{selectedDate ? formatDate(selectedDate) : "Select Date"}</p>
                    <span className="material-symbols-sharp text-base text-zinc-500">expand_more</span>
                </div>
                <button 
                    onClick={handleNext} 
                    className="flex items-center justify-center p-1.5 text-zinc-500 rounded-full hover:bg-zinc-100"
                >
                    <span className="material-symbols-sharp text-base">arrow_forward_ios</span>
                </button>
            </div>

            {/* Date list dropdown */}
            {showDateList && (
                <div className="border-2 border-zinc-200 rounded-md p-2 bg-white max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableDates.map((date) => (
                            <button
                                key={date.toISOString()}
                                onClick={() => {
                                    onDateChange(date);
                                    setShowDateList(false);
                                }}
                                className={`p-2.5 rounded-sm border-2 transition-all text-center text-sm font-medium ${
                                    selectedDate && date.toDateString() === selectedDate.toDateString()
                                        ? "bg-sky-600 border-sky-600 text-white"
                                        : "border-zinc-200 hover:border-sky-400 hover:bg-sky-50 text-zinc-700"
                                }`}
                            >
                                <div className="text-xs font-semibold">
                                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                                </div>
                                <div className="text-sm">
                                    {date.getDate()}
                                </div>
                                <div className="text-xs text-current opacity-80">
                                    {date.toLocaleDateString("en-US", { month: "short" })}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
    );
};

export default DateSelector;
