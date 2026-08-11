import { Sidebar } from "./Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/api";

import logoDefault from "@/assets/logo.png";

export default function AdminLayout() {
    const navigate = useNavigate();

    const { data: settings } = useQuery({ 
        queryKey: ["settings"], 
        queryFn: getSettings 
    });

    const logo = settings?.siteLogo || logoDefault;

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            navigate("/admin/login");
        }
    }, [navigate]);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col">
                {/* Mobile Header */}
                <div className="md:hidden p-3 border-b flex items-center justify-between bg-card">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
                        <h1 className="font-serif font-bold text-sm tracking-tight">Admin Portal</h1>
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0">
                            <Sidebar className="w-full border-none" />
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
