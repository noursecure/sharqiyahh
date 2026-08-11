import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, createProduct, deleteProduct, updateProduct, uploadImage, getCategories, getSettings, updateSettings } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, X, Settings as SettingsIcon, Image as ImageIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Product, Category, APIProduct } from "@/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [filterCategory, setFilterCategory] = useState("all");

    const { data: products, isLoading } = useQuery<APIProduct[]>({
        queryKey: ["products", debouncedSearch, filterCategory],
        queryFn: () => getProducts(filterCategory === "all" ? undefined : filterCategory, debouncedSearch || undefined)
    });
    const { data: categories } = useQuery<Category[]>({ queryKey: ["categories"], queryFn: getCategories });
    const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<APIProduct | null>(null);

    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: "",
        nameAr: "",
        price: "",
        originalPrice: "",
        category: "",
        image: "/src/assets/product-1.jpg",
        description: "",
        descriptionAr: "",
        stock: "",
        colors: "",
        images: "",
    });

    const createMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Product created successfully" });
        },
        onError: () => {
            toast({ title: "Failed to create product", variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsDialogOpen(false);
            resetForm();
            toast({ title: "Product updated successfully" });
        },
        onError: () => {
            toast({ title: "Failed to update product", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast({ title: "Product deleted successfully" });
        },
        onError: () => {
            toast({ title: "Failed to delete product", variant: "destructive" });
        }
    });

    const updateSettingsMutation = useMutation({
        mutationFn: updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            toast({ title: "Settings updated successfully" });
        },
        onError: (error: any) => {
            console.error(error);
            toast({ title: "Failed to update settings", description: error?.message || "Unknown error", variant: "destructive" });
        }
    });

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            name: "",
            nameAr: "",
            price: "",
            originalPrice: "",
            category: "",
            image: "/src/assets/product-1.jpg",
            description: "",
            descriptionAr: "",
            stock: "",
            colors: "",
            images: "",
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

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const uploadedUrls: string[] = [];
            try {
                await Promise.all(files.map(async (file) => {
                    const { url } = await uploadImage(file);
                    uploadedUrls.push(url);
                }));
                const currentBanners = settings?.heroBanner ? settings.heroBanner.split(',').filter(Boolean) : [];
                const newBanners = [...currentBanners, ...uploadedUrls].join(',');
                updateSettingsMutation.mutate({ heroBanner: newBanners });
                e.target.value = "";
                toast({ title: `Added ${uploadedUrls.length} banner(s) successfully` });
            } catch (error) {
                toast({ title: "Upload failed", variant: "destructive" });
            }
        }
    };

    const removeBannerImage = (urlToRemove: string) => {
        const currentBanners = settings?.heroBanner?.split(',').filter(Boolean) || [];
        const newBanners = currentBanners.filter((url: string) => url !== urlToRemove).join(',');
        updateSettingsMutation.mutate({ heroBanner: newBanners });
    };

    const handleAdditionalImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const uploadedUrls: string[] = [];
            try {
                await Promise.all(files.map(async (file) => {
                    const { url } = await uploadImage(file);
                    uploadedUrls.push(url);
                }));
                const currentImages = formData.images ? formData.images.split(',').filter(Boolean) : [];
                // Append new images to the list
                const newImages = [...currentImages, ...uploadedUrls].join(',');
                setFormData(prev => ({ ...prev, images: newImages }));

                // Clear the input value so the same file can be selected again or user sees it's "done"
                e.target.value = "";

                toast({ title: `Added ${uploadedUrls.length} image(s) successfully` });
            } catch (error) {
                toast({ title: "Upload failed", variant: "destructive" });
            }
        }
    };

    const removeAdditionalImage = (urlToRemove: string) => {
        const currentImages = formData.images.split(',').filter(Boolean);
        const newImages = currentImages.filter(url => url !== urlToRemove).join(',');
        setFormData({ ...formData, images: newImages });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            price: parseFloat(String(formData.price)),
            originalPrice: formData.originalPrice ? parseFloat(String(formData.originalPrice)) : null,
            stock: parseInt(String(formData.stock)) || 0,
            colors: formData.colors || "",
            images: formData.images || "",
        };

        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (product: APIProduct) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            nameAr: product.nameAr,
            price: String(product.price),
            originalPrice: product.originalPrice ? String(product.originalPrice) : "",
            category: product.category,
            image: product.image,
            description: product.description || "",
            descriptionAr: product.descriptionAr || "",
            stock: String(product.stock || 0),
            colors: product.colors || "",
            images: product.images || "",
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8" >
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif font-bold">Admin Dashboard</h1>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline"><SettingsIcon className="h-4 w-4 mr-2" /> Application Settings</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Application Settings</DialogTitle>
                            </DialogHeader>
                            <Tabs defaultValue="banner" className="w-full mt-4">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="banner">Banner</TabsTrigger>
                                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                                    <TabsTrigger value="logo">Logo</TabsTrigger>
                                    <TabsTrigger value="hero">Hero</TabsTrigger>
                                </TabsList>

                                <TabsContent value="banner" className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Hero Banners (Slideshow)</Label>
                                        <div className="flex flex-col gap-4 mt-2">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleBannerUpload}
                                                className="cursor-pointer"
                                            />
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {(settings?.heroBanner ? settings.heroBanner.split(',').filter(Boolean) : []).map((img: string, idx: number) => (
                                                    <div key={idx} className="relative aspect-[21/9] border rounded group">
                                                        <img src={img} className="w-full h-full object-cover rounded" alt={`Banner ${idx + 1}`} />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBannerImage(img)}
                                                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full shadow-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="whatsapp" className="space-y-4 py-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>WhatsApp Number</Label>
                                            <Input
                                                value={settings?.whatsappNumber || "96171016965"}
                                                onChange={(e) => updateSettingsMutation.mutate({ whatsappNumber: e.target.value })}
                                                placeholder="e.g. 96171016965"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Include country code without + (e.g., 961...)</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Welcome Message</Label>
                                            <Textarea
                                                value={settings?.whatsappMessage || "Hi there 👋\nHow can I help you?"}
                                                onChange={(e) => updateSettingsMutation.mutate({ whatsappMessage: e.target.value })}
                                                placeholder="Message shown in the widget"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Support Title</Label>
                                                <Input
                                                    value={settings?.whatsappTitle || "Support"}
                                                    onChange={(e) => updateSettingsMutation.mutate({ whatsappTitle: e.target.value })}
                                                    placeholder="e.g. Support"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Status Message</Label>
                                                <Input
                                                    value={settings?.whatsappStatus || "Typically replies within a day"}
                                                    onChange={(e) => updateSettingsMutation.mutate({ whatsappStatus: e.target.value })}
                                                    placeholder="e.g. Online now"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="logo" className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Site Logo</Label>
                                        <div className="flex gap-4 items-center">
                                            <div className="p-2 border rounded bg-muted/50 w-24 h-24 flex items-center justify-center">
                                                <img
                                                    src={settings?.siteLogo || "/src/assets/logo.png"}
                                                    className="max-w-full max-h-full object-contain"
                                                    alt="Current Logo"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            try {
                                                                const { url } = await uploadImage(e.target.files[0]);
                                                                updateSettingsMutation.mutate({ siteLogo: url });
                                                            } catch (error) {
                                                                toast({ title: "Upload failed", variant: "destructive" });
                                                            }
                                                        }
                                                    }}
                                                    className="cursor-pointer"
                                                />
                                                <Input
                                                    value={settings?.siteLogo || ""}
                                                    onChange={(e) => updateSettingsMutation.mutate({ siteLogo: e.target.value })}
                                                    placeholder="Or enter Image URL"
                                                    className="text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="hero" className="space-y-4 py-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Hero Title (English)</Label>
                                            <Textarea
                                                value={settings?.heroTitle || "Discover Our\nModest Collection"}
                                                onChange={(e) => updateSettingsMutation.mutate({ heroTitle: e.target.value })}
                                                placeholder="Use a new line for better layout"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hero Title (Arabic)</Label>
                                            <Input
                                                value={settings?.heroTitleAr || "اكتشفي مجموعتنا المتواضعة"}
                                                onChange={(e) => updateSettingsMutation.mutate({ heroTitleAr: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hero Subtitle</Label>
                                            <Textarea
                                                value={settings?.heroSubtitle || "Elegant designs that celebrate modesty and femininity"}
                                                onChange={(e) => updateSettingsMutation.mutate({ heroSubtitle: e.target.value })}
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="general">General</TabsTrigger>
                                        <TabsTrigger value="content">Content</TabsTrigger>
                                        <TabsTrigger value="images">Images</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="general" className="space-y-4 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Name (English)</Label>
                                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Name (Arabic)</Label>
                                                <Input value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} required dir="rtl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Price ($)</Label>
                                                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Original Price (Optional)</Label>
                                                <Input type="number" step="0.01" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Stock</Label>
                                                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Select
                                                    value={formData.category}
                                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories?.map((category: Category) => (
                                                            <SelectItem key={category.id} value={category.name}>
                                                                {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Colors (comma separated)</Label>
                                                <Input value={formData.colors} onChange={(e) => setFormData({ ...formData, colors: e.target.value })} placeholder="Red, Blue, Green" />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="content" className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Description (English)</Label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={4}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description (Arabic)</Label>
                                            <Textarea
                                                value={formData.descriptionAr}
                                                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                                dir="rtl"
                                                rows={4}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="images" className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Main Image</Label>
                                            <div className="flex gap-4 items-start">
                                                <div className="relative w-24 h-24 border rounded overflow-hidden flex-shrink-0">
                                                    <img src={formData.image} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="cursor-pointer"
                                                    />
                                                    <Input
                                                        value={formData.image}
                                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                        placeholder="Image URL"
                                                        className="text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 border-t pt-4">
                                            <Label>Additional Images</Label>
                                            <div className="flex gap-2 items-center mb-4">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleAdditionalImagesChange}
                                                    className="cursor-pointer"
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {formData.images.split(',').filter(Boolean).map((img, idx) => (
                                                    <div key={idx} className="relative aspect-square border rounded group">
                                                        <img src={img} className="w-full h-full object-cover rounded" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAdditionalImage(img)}
                                                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full shadow-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                        {editingProduct ? "Update Product" : "Create Product"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Input
                        placeholder="Search products by name or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="w-full md:w-64">
                    <Select
                        value={filterCategory}
                        onValueChange={setFilterCategory}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map((category: any) => (
                                <SelectItem key={category.id} value={category.name}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-x-auto">
                <div className="p-4 min-w-[700px] grid grid-cols-12 gap-4 font-semibold border-b bg-muted/50 items-center">
                    <div className="col-span-1">Image</div>
                    <div className="col-span-3">Product Name</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Stock Level</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {isLoading ? (
                    <div className="divide-y">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-4 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-1"><Skeleton className="h-10 w-10 rounded" /></div>
                                <div className="col-span-3"><Skeleton className="h-4 w-3/4 mb-1" /><Skeleton className="h-3 w-1/2" /></div>
                                <div className="col-span-2"><Skeleton className="h-4 w-20" /></div>
                                <div className="col-span-2"><Skeleton className="h-4 w-12" /></div>
                                <div className="col-span-2"><Skeleton className="h-4 w-16" /></div>
                                <div className="col-span-2 flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-8 w-8 rounded-full" /></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    products?.map((product: APIProduct) => (
                        <div key={product.id} className="p-4 min-w-[700px] grid grid-cols-12 gap-4 items-center border-b hover:bg-muted/30 transition-colors">
                            <div className="col-span-1">
                                <img src={product.image} alt={product.name} className="h-10 w-10 object-cover rounded shadow-sm border" />
                            </div>
                            <div className="col-span-3">
                                <div className="font-medium truncate">{product.name}</div>
                                <div className="text-xs text-muted-foreground truncate" dir="rtl">{product.nameAr}</div>
                            </div>
                            <div className="col-span-2">
                                <Badge variant="secondary" className="font-normal">{product.category}</Badge>
                            </div>
                            <div className="col-span-2">
                                <span className="font-medium">${product.price}</span>
                                {product.originalPrice && (
                                    <span className="text-xs text-muted-foreground line-through block italic">${product.originalPrice}</span>
                                )}
                            </div>
                            <div className="col-span-2">
                                {product.stock <= 0 ? (
                                    <Badge variant="destructive" className="animate-pulse">Out of Stock</Badge>
                                ) : product.stock < 5 ? (
                                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Low: {product.stock}</Badge>
                                ) : (
                                    <span className="text-sm font-medium">{product.stock} in stock</span>
                                )}
                            </div>
                            <div className="col-span-2 flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="h-8 w-8 hover:bg-brand-beige" title="Edit">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)} title="Delete">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
