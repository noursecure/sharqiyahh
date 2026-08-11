import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

import { useQuery } from "@tanstack/react-query";
import { getProducts, subscribeToNewsletter } from "@/api";
import { toast } from "@/hooks/use-toast";

// ... (imports remain)

// Removed hardcoded featuredProducts array


const categories = [
  {
    name: "Dresses",
    nameAr: "فساتين",
    image: product2,
    link: "/shop?category=dresses",
  },
  {
    name: "Abayas",
    nameAr: "عبايات",
    image: product1,
    link: "/shop?category=abayas",
  },
  {
    name: "Tops",
    nameAr: "بلوزات",
    image: product4,
    link: "/shop?category=tops",
  },
  {
    name: "Trousers",
    nameAr: "بناطيل",
    image: product3,
    link: "/shop?category=trousers",
  },
  {
    name: "Chemise",
    nameAr: "شيميز",
    image: product4,
    link: "/shop?category=chemise",
  },
  {
    name: "Basics",
    nameAr: "أساسيات",
    image: product1,
    link: "/shop?category=basics",
  },
];

interface HomeProps {
  onAddToCart: (productId: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: any) => void;
}

export default function Home({ onAddToCart, wishlistIds, onToggleWishlist }: HomeProps) {
  const { data: products, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: () => getProducts()
  });

  // Take first 4 for featured
  const featuredProducts = products?.slice(0, 4) || [];

  return (
    <div>
      <Hero />

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Shop by Category</h2>
          <p className="text-muted-foreground">تسوقي حسب الفئة</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link key={category.name} to={category.link} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded hover-lift">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-elegant group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent flex items-end p-6">
                  <div className="text-center w-full">
                    <h3 className="text-2xl font-serif font-bold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.nameAr}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-20 bg-muted/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Featured Collection</h2>
          <p className="text-muted-foreground">المجموعة المميزة</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            <div className="col-span-4 text-center">Loading...</div>
          ) : (
            featuredProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                {...product}
                onAddToCart={() => onAddToCart(product)}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={() => onToggleWishlist(product)}
              />
            ))
          )}
        </div>
        <div className="text-center">
          <Button size="lg" variant="outline" asChild onClick={() => window.scrollTo(0, 0)}>
            <Link to="/shop">
              View All Products
            </Link>
          </Button>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center bg-accent/20 rounded-lg p-6 md:p-12">
          <h2 className="text-3xl font-serif font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to receive exclusive offers and new collection updates
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const emailInput = (e.target as HTMLFormElement).email.value;
              try {
                await subscribeToNewsletter(emailInput);
                toast({
                  title: "Subscribed!",
                  description: "You have successfully subscribed to our newsletter.",
                });
                (e.target as HTMLFormElement).reset();
              } catch (error: any) {
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: error.response?.data?.error || "Failed to subscribe. Please try again.",
                });
              }
            }}
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 border border-input bg-background rounded"
            />
            <Button size="lg" className="w-full sm:w-auto" type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
