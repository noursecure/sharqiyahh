import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MessageCircle, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getOrders, updateOrderStatus, deleteOrder } from "@/api";
import { generateInvoice } from "@/utils/invoiceGenerator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

// Removed old Axios wrappers since we are importing them directly from "@/api"

export default function AdminOrders() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: orders, isLoading } = useQuery({
        queryKey: ["orders"],
        queryFn: getOrders,
        refetchInterval: 10000 // Poll every 10s for new orders
    });

    const mutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            toast.success("Order status updated");
        },
        onError: () => {
            toast.error("Failed to update status");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            toast.success("Order deleted successfully");
        },
        onError: () => {
            toast.error("Failed to delete order");
        }
    });

    const handleStatusChange = (id: string, newStatus: string) => {
        mutation.mutate({ id, status: newStatus });
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this order?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleWhatsAppShare = (order: any) => {
        let itemsList = "";
        order.items.forEach((item: any) => {
            itemsList += `\n- ${item.quantity}x ${item.productName} ($${item.price})`;
        });

        const message = `Hello, ${order.firstName} ${order.lastName}.
Here is your order summary for Order #${order.id.slice(0, 8).toUpperCase()}.
Date: ${new Date(order.createdAt).toLocaleDateString()}

Items:${itemsList}

Total: $${order.total.toFixed(2)}
Status: ${order.status}

Thank you for shopping with Sharqiyah!`;

        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = order.phone.replace(/\D/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        window.open(url, '_blank');
    };

    const filteredOrders = orders?.filter((order: any) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            order.id.toLowerCase().includes(searchLower) ||
            order.firstName.toLowerCase().includes(searchLower) ||
            order.lastName.toLowerCase().includes(searchLower) ||
            order.email.toLowerCase().includes(searchLower) ||
            order.phone.includes(searchTerm)
        );
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold">Orders</h1>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search orders..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders?.map((order: any) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{order.firstName} {order.lastName}</div>
                                    <div className="text-xs text-muted-foreground">{order.email}</div>
                                    <div className="text-xs text-muted-foreground">{order.phone}</div>
                                </TableCell>
                                <TableCell>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                                <TableCell className="font-bold">${order.total?.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        order.status === 'Completed' ? 'default' :
                                            order.status === 'Cancelled' ? 'destructive' : 'secondary'
                                    }>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-[200px] text-xs">
                                        {order.items?.map((item: any) => (
                                            <div key={item.id} className="truncate">
                                                {item.quantity}x {item.productName}
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => generateInvoice(order)} title="Download Invoice">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleWhatsAppShare(order)} title="Share on WhatsApp" className="text-green-600 border-green-200 hover:bg-green-50">
                                            <MessageCircle className="h-4 w-4" />
                                        </Button>
                                        <div className="w-[130px]">
                                            <Select
                                                defaultValue={order.status}
                                                onValueChange={(value) => handleStatusChange(order.id, value)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                    <SelectItem value="Processing">Processing</SelectItem>
                                                    <SelectItem value="Completed">Completed</SelectItem>
                                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(order.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredOrders?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
