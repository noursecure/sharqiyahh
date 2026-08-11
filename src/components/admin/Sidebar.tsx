import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { LayoutDashboard, Tags, LogOut, ShoppingBag, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/api";
import logoDefault from "@/assets/logo.png";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: ShoppingBag, label: "Orders", href: "/admin/orders" },
    { icon: Tags, label: "Categories", href: "/admin/categories" },
    { icon: Mail, label: "Subscribers", href: "/admin/subscribers" },
];

export function Sidebar({ className }: { className?: string }) {
    const location = useLocation();
    const navigate = useNavigate();

    const { data: settings } = useQuery({ 
        queryKey: ["settings"], 
        queryFn: getSettings 
    });

    const logo = settings?.siteLogo || logoDefault;

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
        toast({ title: "Logged out", description: "You have been logged out successfully." });
    };

    return (
        <div className={cn("w-64 bg-card border-r min-h-screen p-4 flex flex-col shadow-sm", className)}>
            <div className="mb-8 px-4 flex flex-col items-center">
                <img src={logo} alt="Sharqiyah" className="h-20 w-auto mb-2 object-contain" />
                <h2 className="text-sm font-serif font-bold tracking-widest uppercase text-muted-foreground">Admin Portal</h2>
            </div>
            <nav className="space-y-1">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            location.pathname === item.href
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors w-full"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </div >
    );
}
