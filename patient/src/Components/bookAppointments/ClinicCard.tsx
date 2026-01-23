import type { Clinic } from "./types";

interface ClinicCardProps {
  clinic: Clinic;
  onBookClick: () => void;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onBookClick }) => {
  return (
    <div
      key={clinic?.id}
      className="p-2 relative bg-white rounded-sm border border-gray-300 flex gap-3 items-start group"
    >
      <div className="flex-1 flex flex-col">

        {/* Clinic Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="font-semibold text-cyan-800 text-base flex items-center gap-1">
            <span className="material-symbols-outlined text-[30px]">
              home_health
            </span>
            <span className="font-bold line-clamp-1 ">{clinic?.name}</span>
          </div>

          <button
            onClick={onBookClick}
            className="text-[12px] bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 pr-3 rounded-sm flex items-center gap-1.5 hover:scale-[105%] transition-all duration-100 hover:shadow-md"
          >
            <span className="material-symbols-sharp text-[15px]">
              calendar_check
            </span>
            <p className="whitespace-nowrap">Book Now</p>
          </button>
        </div>

        {/* Clinic Details */}
        <div className="text-[12px] px-1.5 py-2.5 border-t">
          <div className="flex gap-3">
            <span className="material-symbols-sharp text-[15px] mt-1">
              location_on
            </span>
            <div>
              <p className="text-zinc-800">{clinic?.address?.street || "-"}</p>
              <p className="text-zinc-800">
                {[clinic?.address?.city, clinic?.address?.state, clinic?.address?.postal_code]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </p>
            </div>
          </div>
          <p className="mt-1 font-semibold flex items-center gap-3">
            <span className="material-symbols-sharp text-[15px]">call</span>
            <span>{clinic?.phone}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
