import { Outlet } from "react-router-dom";
import Bar from "../shared/Sidebar/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

const MainLayout = () => {
  return (
    <SidebarProvider>
      <Bar />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <Outlet />
      </main>
      <Toaster />
    </SidebarProvider>
  );
};

export default MainLayout;