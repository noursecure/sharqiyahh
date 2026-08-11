import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSubscribers, deleteSubscriber } from "@/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isToday, subDays, isAfter } from "date-fns";
import { Mail, Download, Search, Trash2, Copy, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/hooks/use-toast";
import type { Subscriber } from "@/types";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";



export default function Subscribers() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const { data: subscribers, isLoading } = useQuery<Subscriber[]>({
        queryKey: ["subscribers"],
        queryFn: getSubscribers,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSubscriber,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscribers"] });
            toast({ title: "Subscriber removed" });
        },
        onError: () => {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    });

    const filteredSubscribers = useMemo(() => {
        if (!subscribers) return [];
        return subscribers.filter(s => 
            s.email.toLowerCase().includes(debouncedSearch.toLowerCase())
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [subscribers, debouncedSearch]);

    const stats = useMemo(() => {
        if (!subscribers) return { total: 0, today: 0, last7Days: 0 };
        const today = new Date();
        const sevenDaysAgo = subDays(today, 7);
        
        return {
            total: subscribers.length,
            today: subscribers.filter(s => isToday(new Date(s.createdAt))).length,
            last7Days: subscribers.filter(s => isAfter(new Date(s.createdAt), sevenDaysAgo)).length
        };
    }, [subscribers]);

    const copyToClipboard = (email: string) => {
        navigator.clipboard.writeText(email);
        toast({ title: "Email copied!" });
    };

    const handleExport = () => {
        if (!subscribers) return;
        const csvContent = "Email,Date Joined\n"
            + subscribers.map((s) => `${s.email},${format(new Date(s.createdAt), "yyyy-MM-dd HH:mm")}`).join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `subscribers_${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-tight">Newsletter Insights</h1>
                    <p className="text-muted-foreground text-sm">Monitor and manage your style community</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2 shadow-sm border-brand-beige hover:bg-brand-beige">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Audience</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active subscriptions</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-brand-blush">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Growth (7 Days)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-brand-blush" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">+{stats.last7Days}</div>
                        <p className="text-xs text-muted-foreground mt-1">New members this week</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.today}</div>
                        <p className="text-xs text-muted-foreground mt-1">Subscriptions today</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-2 max-w-md bg-card border rounded-lg px-3 py-1 shadow-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by email address..." 
                    className="border-0 focus-visible:ring-0 px-0 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="font-bold py-4">Subscriber Email</TableHead>
                            <TableHead className="font-bold">Registration Date</TableHead>
                            <TableHead className="text-right font-bold pr-6">Manage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredSubscribers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="bg-muted p-4 rounded-full">
                                            <Mail className="h-8 w-8 text-muted-foreground opacity-30" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-medium">No results found</p>
                                            <p className="text-sm text-muted-foreground">Adjust your search or wait for new trendsetters to join.</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSubscribers.map((subscriber) => (
                                <TableRow key={subscriber.id} className="hover:bg-muted/50 transition-colors group">
                                    <TableCell className="py-4">
                                        <div className="font-medium flex items-center gap-2">
                                            {subscriber.email}
                                            <button 
                                                onClick={() => copyToClipboard(subscriber.email)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                                                title="Copy email"
                                            >
                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm italic">
                                        {format(new Date(subscriber.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove Subscriber?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently unsubscribe <span className="font-bold text-foreground">{subscriber.email}</span> from all marketing communications.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => deleteMutation.mutate(subscriber.id)}
                                                        className="bg-destructive hover:bg-destructive/90 transition-colors"
                                                    >
                                                        Remove Forever
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
