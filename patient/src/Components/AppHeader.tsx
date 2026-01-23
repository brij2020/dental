import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { NavLink } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import LogoutModal from "./LogoutModal";
import CustomModal from "./CustomModal";
import { useProfile } from "@/hooks/useProfile";

const AppHeader = () => {
    const [openLogoutModal, setOpenLogoutModal] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { profile } = useProfile();

    return (
        <div className={`relative flex items-center justify-between pr-2 md:pr-6 py-2 sm:py-1.5 border-b border-gray-300 bg-white dark:border-zinc-700 dark:bg-zinc-900`}>

            {/* Logo */}
            <div className='w-[52px] sm:w-[56px] md:w-[250px] md:pl-5 lg:pl-6 grid place-items-center md:place-items-start'>

                <NavLink to="/" className='flex items-center gap-12 cursor-pointer'>
                    <div className='flex items-center gap-2 text-sky-900 dark:text-sky-600'>
                        <img src="/logo.png" alt="logo" className="w-6 h-6" />
                        {/* <i className="fa-solid fa-snowflake text-2xl px-4 md:text-base md:px-0"></i> */}
                        <h3 className='hidden md:block font-extrabold '>STOMA.AI</h3>
                    </div>
                </NavLink>
            </div>


            <div className='flex items-center gap-0 absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] bg-gray-50 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner dark:shadow-[inset_0px_3px_4px_0_#101010de]'>

                {/* User Name and Popup */}
                <div className='flex items-center justify-between gap-6 min-w-44 pl-5 pr-3 min-h-12 sm:min-h-10 rounded-full sm:rounded-tr-none sm:rounded-br-none bg-transparent cursor-pointer hover:bg-[#6e6e6e0f] dark:hover:bg-[#0909092b]'>
                    <div className='py-1'>
                        <h2 className='font-bold sm:text-lg text-[17px] mt-[-3px] sm:mt-0 whitespace-nowrap max-w-44 overflow-hidden text-ellipsis'>{profile?.full_name || "N/A"}</h2>
                        <p className='text-xs font-[700] mt-[-4px] text-gray-500 dark:text-zinc-400 sm:hidden'>{profile?.uhid}</p>
                    </div>

                    <span className="material-symbols-sharp text-[20px] text-gray-400 dark:text-zinc-500">keyboard_arrow_down</span>
                </div>
                
                <div className='hidden sm:flex justify-start items-center text-gray-500 dark:text-zinc-300 pr-5 pl-0 min-w-44 min-h-12 sm:min-h-10 rounded-full  rounded-tl-none rounded-bl-none  bg-transparent'>
                    <p className='whitespace-nowrap text-sm pl-4 border-l font-[500] border-gray-300 dark:border-zinc-700 h-7 flex items-center'>UDHID:<span className='font-[700] ml-1'> {profile?.uhid}</span></p>
                </div>

            </div>

            <div className='flex items-center gap-1.5 sm:gap-4 md:gap-5'>

                {/* Theme Toggle Button */}
                <button className='h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 grid place-items-center cursor-pointer' onClick={toggleTheme}>
                    {
                        theme === 'dark' ? <span className="material-symbols-sharp text-[18px]">dark_mode</span> : <span className="material-symbols-sharp text-[18px]">light_mode</span>
                    }
                </button>

                {/* User Profile Popup */}
                <Popover>
                    <PopoverTrigger asChild>
                        {
                            profile?.avatar ? (
                                <div className='p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 grid place-items-center cursor-pointer'>
                                    <img src={profile?.avatar} alt="" className='rounded-full border border-gray-200 w-8 h-8 object-contain' />
                                </div>
                            ) : (
                                <div className='p-1 rounded-full grid hover:bg-gray-200 dark:hover:bg-zinc-700 place-items-center cursor-pointer'>
                                    <span className='text-xl font-semibold text-cyan-700 bg-zinc-100 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center'>{profile?.full_name?.charAt(0) || "U"}</span>
                                </div>
                            )
                        }

                    </PopoverTrigger>
                    <PopoverContent className='p-0 w-48 overflow-hidden dark:border dark:border-zinc-700 dark:bg-zinc-900'>
                        <div className='flex flex-col gap-0'>
                            <NavLink to={`/user-info/${profile?.uhid}`} className='flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 p-3 cursor-pointer border-b border-gray-200 dark:border-zinc-700'>
                                <span className="material-symbols-sharp text-[21px]">person</span>
                                <p className='text-sm font-[500]'>My Profile</p>
                            </NavLink>
                            <NavLink to={`/user-profile-settings/${profile?.uhid}`} className='flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 p-3 cursor-pointer border-b border-gray-200 dark:border-zinc-700'>
                                <span className="material-symbols-sharp text-[20px]">settings</span>
                                <p className='text-sm font-[500]'>Settings</p>
                            </NavLink>
                            <div className='flex items-center gap-2 hover:bg-red-50 dark:hover:bg-zinc-800 p-3 cursor-pointer text-red-700 dark:text-red-500' onClick={() => setOpenLogoutModal(true)}>
                                <span className="material-symbols-sharp text-[20px]">logout</span>
                                <p className='text-sm font-[500]'>Logout</p>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

            </div>


            <CustomModal openModal={openLogoutModal} setOpenModal={setOpenLogoutModal}>
                <LogoutModal setOpenModal={setOpenLogoutModal} />
            </CustomModal>

        </div>
    );
};

export default AppHeader;
