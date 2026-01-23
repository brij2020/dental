import AppSidebar from "./AppSidebar";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";

const AppLayout = () => {
  return (
    <div className={`grid grid-rows-[auto_1fr] h-screen lg:grid-cols-[minmax(250px_1fr)_1fr] grid-cols-[auto_1fr] grid-areas-layout`}>

      {/* Header */}
      <header className="col-span-2 grid-in-header">
        <AppHeader/>
      </header>

      {/* Sidebar */}
      <aside className="grid-in-sidebar lg:min-w-[250px]">
        <AppSidebar />
      </aside >

      {/* Working Space */}
      <main className="bg-gray-200 dark:bg-zinc-800 p-4 overflow-y-auto grid-in-main">
        <Outlet />
      </main>

    </div>

  );
};

export default AppLayout;
