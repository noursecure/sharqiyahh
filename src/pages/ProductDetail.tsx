import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, ChevronLeft, Truck, RefreshCw, X, ZoomIn } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { getProductById } from "@/api";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// Removed hardcoded product imports and array in favor of API fetching

import { getProducts } from "@/api";

interface ProductDetailProps {
  onAddToCart: (product: any) => void; // Changed to accept full product object
  wishlistIds: string[];
  onToggleWishlist: (product: any) => void; // Changed to accept full product object
}

export default function ProductDetail({ onAddToCart, wishlistIds, onToggleWishlist }: ProductDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState("");
  const [activeTab, setActiveTab] = useState("description"); // Added activeTab state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { data: rawProduct, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id || ""),
    enabled: !!id, // Only run query if id is available
  });

  // Adapter to handle backend data structure which might list arrays
  const product = rawProduct ? {
    ...rawProduct,
    // Ensure images is an array, combining main image and additional images
    images: [
      rawProduct.image,
      ...(rawProduct.images && typeof rawProduct.images === 'string' && rawProduct.images.length > 0
        ? rawProduct.images.split(',').map((img: string) => img.trim()).filter(Boolean)
        : [])
    ].filter(Boolean),
    // Default colors if missing, or split string if present
    colors: typeof rawProduct.colors === 'string' && rawProduct.colors.length > 0
      ? rawProduct.colors.split(',').map((c: string) => c.trim())
      : (Array.isArray(rawProduct.colors) ? rawProduct.colors : ["Default"]),
    // Default sizes if missing
    sizes: rawProduct.sizes || ["S", "M", "L", "XL"],
  } : null;

  // Fetch related products
  const { data: allProducts } = useQuery({
    queryKey: ["products", product?.category],
    queryFn: () => getProducts(product?.category),
    enabled: !!product?.category
  });

  const relatedProducts = allProducts
    ? allProducts.filter((p: any) => p.id !== id).slice(0, 3)
    : [];


  const isWishlisted = product ? wishlistIds.includes(product.id) : false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <p className="text-xl font-serif">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-serif mb-4">Product not found</h1>
        <Link to="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <Link to="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Product Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
              <div className="aspect-square overflow-hidden bg-muted rounded mb-4 relative group cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                </div>
              </div>

              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                    className="absolute -top-10 right-0 p-2 text-white hover:text-gray-200 transition-colors bg-black/50 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden bg-muted rounded border-2 transition-colors ${selectedImage === index ? "border-primary" : "border-transparent"
                    }`}
                >
                  <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              {product.category}
            </p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">{product.name}</h1>
            <p className="text-lg text-muted-foreground mb-4">{product.nameAr}</p>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold">${product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>

            <div className="mb-6">
              {product.stock > 0 ? (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.stock < 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                  {product.stock < 5 ? `Low Stock: Only ${product.stock} left` : `In Stock: ${product.stock} available`}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Out of Stock
                </span>
              )}
            </div>

            <div className="prose prose-sm mb-6">
              <p className="text-muted-foreground">{product.description}</p>
              <p className="text-muted-foreground text-right">{product.descriptionAr}</p>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Color</label>
              <div className="flex gap-3">
                {product.colors.map((color: string) => {
                  // Simple mapper for common colors, fallback to name
                  const colorMap: Record<string, string> = {
                    'Gold': '#E6BE8A',
                    'Purple': '#800080',
                    'Grey': '#808080',
                    'Gray': '#808080',
                    'Black': '#000000',
                    'White': '#ffffff',
                    'Red': '#ef4444',
                    'Blue': '#3b82f6',
                    'Green': '#22c55e',
                    'Pink': '#f472b6',
                    'Beige': '#f5f5dc',
                    'Navy': '#000080',
                    'Maroon': '#800000',
                    'Cream': '#FFFDD0',
                    'Rose': '#FF007F',
                    'Charcoal': '#36454F',
                    'Sand': '#C2B280',
                    'Blush': '#DE5D83',
                    'Ivory': '#FFFFF0',
                  };
                  const bg = colorMap[color] || color;
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border border-muted-foreground/20 transition-all focus:outline-none ${selectedColor === color
                          ? "ring-2 ring-primary ring-offset-2 scale-110"
                          : "hover:scale-105"
                        }`}
                      style={{ backgroundColor: bg }}
                      title={color}
                    >
                      <span className="sr-only">{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Size</label>
              <div className="flex gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 border rounded transition-colors ${selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <Button
                size="lg"
                className="w-full flex-1" // Changed styling
                onClick={() => onAddToCart(product)} // Pass full product
                disabled={!selectedSize || product.stock === 0} // Added disabled state for size or stock
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto" // Changed styling
                onClick={() => onToggleWishlist(product)} // Pass full product
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Features */}
            <div className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <span>Free shipping on orders over $100</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                <span>30-day return policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <h2 className="text-3xl font-serif font-bold mb-8 text-center">You May Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard
              key={relatedProduct.id}
              {...relatedProduct}
              onAddToCart={() => onAddToCart(relatedProduct)}
              isWishlisted={wishlistIds.includes(relatedProduct.id)}
              onToggleWishlist={() => onToggleWishlist(relatedProduct)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
