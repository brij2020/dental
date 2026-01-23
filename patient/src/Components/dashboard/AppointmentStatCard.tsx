import { NavLink } from "react-router-dom";

interface AppointmentStatCardProps {
    path: string;
    icon: string;
    count: number;
    label: string;
    color?: string;
}

const COLOR_MAP = {
    violet: {
        bg: "bg-violet-700 hover:bg-violet-500",
        text: "text-violet-700",
    },
    cyan: {
        bg: "bg-cyan-600 hover:bg-cyan-500",
        text: "text-cyan-600",
    },
    red: {
        bg: "bg-red-700 hover:bg-red-500",
        text: "text-red-700",
    },
};


const AppointmentStatCard: React.FC<AppointmentStatCardProps> = ({ path, icon, count, label, color = "violet" }) => {
    const classes = COLOR_MAP[color] || COLOR_MAP.violet;

    return (
        <NavLink to={path} className={`${classes.bg} cursor-pointer h-[110px] rounded-md px-4 md:px-3 xl:px-4 text-white flex items-center gap-4 md:gap-3 lg:gap-4`}>
            <div className={`bg-white ${classes.text} min-w-14 min-h-14 sm:min-w-12 sm:min-h-12 xl:min-w-14 xl:min-h-14 rounded-full grid place-items-center`}>
                <span className="material-symbols-sharp text-[30px] sm:text-[27px] xl:text-[30px]">{icon}</span>
            </div>
            <div className='flex flex-col'>
                <p className='text-4xl md:text-3xl xl:text-4xl'>{count}</p>
                <p className='text-[13px] font-light'>{label}</p>
            </div>
        </NavLink>
    )
}

export default AppointmentStatCard;