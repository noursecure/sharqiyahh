import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { loginAdmin, getSettings } from "@/api";
import { toast } from "@/hooks/use-toast";

import logoDefault from "@/assets/logo.png";
import heroBannerDefault from "@/assets/hero-banner.jpg";

export default function AdminLogin() {
    const { data: settings } = useQuery({ 
        queryKey: ["settings"], 
        queryFn: getSettings 
    });
    
    const bannerImage = settings?.heroBanner || heroBannerDefault;
    const logo = settings?.siteLogo || logoDefault;

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { token } = await loginAdmin({ username, password });
            if (token) {
                localStorage.setItem("adminToken", token);
                toast({ title: "Logged in successfully" });
                navigate("/admin/dashboard");
            }
        } catch (error: any) {
            toast({ 
                title: "Login failed", 
                description: error.response?.data?.message || "Invalid credentials", 
                variant: "destructive" 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                style={{ backgroundImage: `url(${bannerImage})` }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </div>

            {/* Login Card */}
            <div className="z-10 w-full max-w-md p-8 bg-background/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-10">
                    <div className="bg-white/50 p-3 rounded-full mb-4 shadow-inner">
                        <img src={logo} alt="Sharqiyah Logo" className="h-12 w-auto" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-primary">Admin Portal</h1>
                    <p className="text-sm text-muted-foreground mt-2">Elite access for Sharqiyah Fashion House</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                            id="username"
                            placeholder="Enter your administrative ID"
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            className="bg-white/50 border-white/30 focus:bg-white transition-all duration-300"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <button type="button" className="text-xs text-primary/70 hover:text-primary transition-colors underline-offset-4 hover:underline">
                                Forgot password?
                            </button>
                        </div>
                        <Input 
                            id="password"
                            type="password" 
                            placeholder="••••••••"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className="bg-white/50 border-white/30 focus:bg-white transition-all duration-300"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember" className="border-white/40" />
                        <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground cursor-pointer">
                            Keep me logged in for 30 days
                        </Label>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-black text-white py-6 rounded-xl transition-all duration-500 font-serif text-lg tracking-wide shadow-lg"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Authenticating...
                            </div>
                        ) : "Institutional Login"}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                        &copy; 2026 Sharqiyah Modest Fashion &bull; Secure Environment
                    </p>
                </div>
            </div>
        </div>
    );
}
