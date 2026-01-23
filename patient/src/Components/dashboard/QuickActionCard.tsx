import { NavLink } from "react-router-dom";

interface QuickActionCardProps {
    path: string;
    icon: string;
    title: React.ReactNode;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ path, icon, title }) => {
    return (
        <NavLink to={path} className={`bg-white flex flex-col p-3 rounded-md h-[110px] hover:bg-gradient-to-tl hover:shadow-md hover:-translate-y-1
  transition-all duration-300 ease-out relative cursor-pointer text-sky-800 hover:from-sky-700 hover:text-white hover:to-sky-300`}>
            <p className='uppercase font-extrabold text-[15px] md:text-[14px] xl:text-[15px] '>{title}</p>
            <span className='material-symbols-sharp text-4xl xs:text-3xl sm:text-4xl md:text-3xl 2xl:text-4xl self-end'>{icon}</span>
        </NavLink>

    )
}

export default QuickActionCard;