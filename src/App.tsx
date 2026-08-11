import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CartSlideout } from "@/components/CartSlideout";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import { toast } from "@/hooks/use-toast";

import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLayout from "@/components/admin/AdminLayout";
import Categories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import Subscribers from "./pages/admin/Subscribers";

const queryClient = new QueryClient();

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface WishlistItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
}

const AppContent = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const location = useLocation();

  const handleAddToCart = (product: any) => {
    const productId = product.id;
    const existingItem = cartItems.find((item) => item.id === productId);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          id: productId,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ]);
    }

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleToggleWishlist = (product: any) => {
    const isWishlisted = wishlistItems.some((item) => item.id === product.id);

    if (isWishlisted) {
      setWishlistItems(wishlistItems.filter((item) => item.id !== product.id));
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist.",
      });
    } else {
      setWishlistItems([
        ...wishlistItems,
        {
          id: product.id,
          name: product.name,
          nameAr: product.nameAr,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          category: product.category,
        },
      ]);
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been saved to your wishlist.`,
      });
    }
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistItems(wishlistItems.filter((item) => item.id !== productId));
    toast({
      title: "Removed from wishlist",
      description: "Item has been removed from your wishlist.",
    });
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;
  const wishlistIds = wishlistItems.map((item) => item.id);

  // Check if current path is admin
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminPage && <Navbar cartCount={cartCount} wishlistCount={wishlistCount} onCartOpen={() => setCartOpen(true)} />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home onAddToCart={handleAddToCart} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} />} />
          <Route path="/shop" element={<Shop onAddToCart={handleAddToCart} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} />} />
          <Route path="/product/:id" element={<ProductDetail onAddToCart={handleAddToCart} wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist} />} />
          <Route path="/checkout" element={<Checkout items={cartItems} onClearCart={handleClearCart} />} />
          <Route path="/wishlist" element={<Wishlist items={wishlistItems} onRemove={handleRemoveFromWishlist} onAddToCart={handleAddToCart} />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="categories" element={<Categories />} />
            <Route path="subscribers" element={<Subscribers />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminPage && <Footer />}
      {!isAdminPage && (
        <CartSlideout
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemoveItem}
        />
      )}
      {!isAdminPage && <WhatsAppWidget />}
      <ScrollToTop />
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
