import useLogout from "@/hooks/useLogout";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const LogoutModal = ({setOpenModal}) => {

   const navigate = useNavigate();
    const { logout, loading: isLoggingOut } = useLogout();
    const handleLogout = async () => {
        const response = await logout();

        if(!response.success){
            toast.error(response.error || "Something went wrong while Logging out!");
            return;
        }

        navigate("/login");
        toast.success(response.message || "Logged out successfully");

    }

    return (
        <div className='p-3 flex flex-col gap-6 w-[600px] max-w-full' >
            <div className='flex flex-col'>
                <div className='font-semibold text-lg'>Confirm Logout</div>
                <p className='text-sm text-zinc-500'>Are you sure you want to log out of your account?</p>
            </div>
            <div className='flex items-center gap-3'>
                <button onClick={() => setOpenModal(false)} className='bg-zinc-500 hover:bg-zinc-400 text-white text-sm min-w-[100px] px-3 h-8 cursor-pointer rounded-sm'>Cancel</button>
                <button onClick={handleLogout} className={`${isLoggingOut ? "bg-zinc-400 cursor-not-allowed" : "bg-red-700 hover:bg-red-500 cursor-pointer"} text-white text-sm min-w-[100px] h-8 rounded-sm px-3`}>{isLoggingOut ? "Logging out..." : "Logout"}</button>
            </div>
        </div>
    )
}

export default LogoutModal