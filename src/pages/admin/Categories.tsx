import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, createCategory, updateCategory, deleteCategory, uploadImage } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function Categories() {
    const queryClient = useQueryClient();
    const { data: categories, isLoading } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("name-asc");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    const filteredCategories = categories?.filter((category: any) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.nameAr.includes(searchTerm)
    ).sort((a: any, b: any) => {
        if (sortOrder === "name-asc") {
            return a.name.localeCompare(b.name);
        } else if (sortOrder === "name-desc") {
            return b.name.localeCompare(a.name);
        } else if (sortOrder === "newest") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortOrder === "oldest") {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return 0;
    });

    const [formData, setFormData] = useState({
        name: "",
        nameAr: "",
        image: "/src/assets/product-1.jpg", // Default placeholder
    });

    const createMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Category created" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Category updated" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast({ title: "Category deleted" });
        },
    });

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({
            name: "",
            nameAr: "",
            image: "/src/assets/product-1.jpg",
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const { url } = await uploadImage(file);
                setFormData({ ...formData, image: url });
                toast({ title: "Image uploaded successfully" });
            } catch (error) {
                toast({ title: "Upload failed", variant: "destructive" });
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            nameAr: category.nameAr,
            image: category.image,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this category?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif font-bold">Manage Categories</h1>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label>Name (English)</label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <label>Name (Arabic)</label>
                                <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} required dir="rtl" />
                            </div>
                            <div className="space-y-2">
                                <label>Image</label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="cursor-pointer"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">Or enter URL manually:</div>
                                <Input value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} required />
                            </div>
                            <Button type="submit" className="w-full">{editingCategory ? "Update" : "Create"}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1" // Allow to grow
                />
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
                <div className="p-4 min-w-[600px] grid grid-cols-12 gap-4 font-semibold border-b bg-muted/50">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-4">Image</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>
                {isLoading ? (
                    <div className="p-8 text-center">Loading categories...</div>
                ) : (
                    filteredCategories?.map((category: any) => (
                        <div key={category.id} className="p-4 min-w-[600px] grid grid-cols-12 gap-4 items-center border-b last:border-0 hover:bg-muted/30">
                            <div className="col-span-5">
                                <div className="font-medium">{category.name}</div>
                                <div className="text-sm text-muted-foreground">{category.nameAr}</div>
                            </div>
                            <div className="col-span-4 truncate text-sm text-muted-foreground">{category.image}</div>
                            <div className="col-span-3 flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(category.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
