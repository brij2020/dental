import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const MenuItem = ({ icon, title, path }) => {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center cursor-pointer rounded-full lg:rounded-sm lg:h-full lg:w-full lg:justify-start justify-center ${
          isActive
            ? "bg-gray-800 dark:bg-zinc-700 text-white hover:none"
            : "hover:bg-gray-200 dark:hover:bg-zinc-800"
        }`
      }
    >
      <div className="grid place-items-center h-10 w-10 lg:h-9 lg:w-9">
        {/* <i className="fa-solid fa-calendar-plus"></i> */}
        <span className="material-symbols-sharp text-[21px]">{icon}</span>
      </div>
      <p className="hidden lg:block text-sm font-[500] pr-3 whitespace-nowrap ">
        {title}
      </p>
    </NavLink>
  );
};

const CollapsibleMenuItem = ({ icon, title, isOpen, onToggle, children }) => {
  return (
    <>
      <div
        className="flex items-center cursor-pointer rounded-full lg:rounded-sm lg:h-full lg:w-full lg:justify-between justify-center hover:bg-gray-200 dark:hover:bg-zinc-800"
        onClick={onToggle}
      >
        <div className="flex items-center">
          <div className="grid place-items-center h-10 w-10 lg:h-9 lg:w-9 ">
            <span className="material-symbols-sharp text-[21px]">{icon}</span>
          </div>
          <p className="hidden lg:block text-sm font-[500] pr-3 whitespace-nowrap ">
            {title}
          </p>
        </div>

        <div
          className={`hidden lg:grid place-items-center h-7 w-7 transition-transform duration-100 ${
            isOpen && "rotate-90"
          }`}
        >
          <span className="material-symbols-sharp text-[20px] text-gray-500 dark:text-gray-400">
            chevron_right
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="w-full grid place-items-center lg:place-items-start lg:pl-[18px]">
          <div className="lg:border-l lg:border-gray-300 dark:border-zinc-700 flex flex-col gap-1.5 lg:pl-1 items-center w-full">
            {children}
          </div>
        </div>
      )}
    </>
  );
};

const SubMenuItem = ({ icon, title, path }) => {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `text-gray-700 dark:text-gray-200 h-10 w-10 flex items-center cursor-pointer rounded-full lg:rounded-sm lg:h-full lg:w-full lg:justify-start justify-center ${
          isActive
            ? "bg-gray-800 dark:bg-zinc-700 text-white hover:none"
            : "hover:bg-gray-200 dark:hover:bg-zinc-800"
        }`
      }
    >
      <div className="lg:hidden grid place-items-center h-10 w-10 lg:h-9 lg:w-9 ">
        <span className="material-symbols-sharp text-[21px]">{icon}</span>
      </div>
      <p className="hidden lg:block text-[13px] font-[500] px-3 py-2 whitespace-nowrap">
        {title}
      </p>
    </NavLink>
  );
};

const AIButton = ({ icon, title }) => {
  return (
    <div className="group flex items-center cursor-pointer justify-center p-1 bg-[linear-gradient(163deg,_rgba(12,_242,_201,_1)_0%,_rgba(41,_122,_217,_1)_50%,_rgba(170,_58,_177,_1)_100%)] rounded-full transition-all duration-400 hover:shadow-[0_2px_6px_0_#0039ffa6]">
      <button
        className={`h-9 w-9 flex items-center gap-3 cursor-pointer rounded-full bg-white dark:bg-zinc-700 group-dark:hover:bg-[#4040405c] group-hover:bg-[#4040405c] group-hover:text-white transition-transform duration-400 lg:px-3.5 lg:w-full lg:justify-start justify-center shadow-[inset_0px_0px_5px_0px_#0c23e9]`}
      >
        {icon}
        <p className="hidden lg:block text-[15px] font-[700]">{title}</p>
      </button>
    </div>
  );
};

const AppSidebar = () => {
  const { pathname } = useLocation();
  const [openLogs, setOpenLogs] = useState<boolean>(() => {
    return pathname === "/upcoming-appointments" ||
      pathname === "/previous-appointments" ||
      pathname === "/missed-appointments"
      ? true
      : false;
  });

  //    const openLogs =
  useEffect(() => {
    if (
      pathname === "/upcoming-appointments" ||
      pathname === "/previous-appointments" ||
      pathname === "/missed-appointments"
    ) {
      setOpenLogs(true);
    }
  }, [pathname]);

  return (
    <div className="flex flex-col justify-between bg-gray-100 dark:bg-zinc-900 border-r border-gray-300 dark:border-zinc-700 h-full">
      {/* Upper Part */}
      <div>
        {/* Sidebar Menu */}
        <div className="flex flex-col gap-1.5 py-3 lg:px-3 px-0 items-center">
          <MenuItem
            icon="calendar_add_on"
            title="Book Appointment"
            path="/book-appointment-clinics"
          />
          <MenuItem
            icon="autorenew"
            title="Follow Up"
            path="/appointment-follow-up"
          />

          <CollapsibleMenuItem
            icon="format_list_bulleted"
            title="Log"
            isOpen={openLogs}
            onToggle={() => setOpenLogs(!openLogs)}
          >
            <>
              <SubMenuItem
                icon="event_upcoming"
                title="Upcoming Appointments"
                path="/upcoming-appointments"
              />
              <SubMenuItem
                icon="calendar_check"
                title="Previous Appointments"
                path="/previous-appointments"
              />
              <SubMenuItem
                icon="event_busy"
                title="Missed Appointments"
                path="/missed-appointments"
              />

              {/* Recent Appointments */}
              {/* <SubMenuItem icon="calendar_clock" title="Recent Appointments" path="/recent-appointments"/> */}
            </>
          </CollapsibleMenuItem>

          {/* Logs Sub-menu */}
          {openLogs && (
            <div className="w-full grid place-items-center lg:place-items-start lg:pl-[18px]">
              <div className="lg:border-l lg:border-gray-300 dark:border-zinc-700 flex flex-col gap-1.5 lg:pl-1 items-center  w-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* AI Part */}
      <div className="py-4 flex flex-col gap-3 border-t border-gray-300 dark:border-zinc-700 lg:px-3 px-1 sm:px-1.5 md:px-2">
        <AIButton
          icon={<i className="fa-solid fa-tooth text-xl"></i>}
          title="X-Ray Interpretation"
        />
        <AIButton
          icon={<i className="fa-solid fa-teeth-open text-lg"></i>}
          title="Intraoral Scan"
        />

        <p className="hidden lg:block text-gray-400 dark:text-zinc-700 text-[10px] text-center mt-2">
          Powered by <span className="font-bold">Saral Pixel - AI Labs</span>
        </p>
      </div>
    </div>
  );
};

export default AppSidebar;
