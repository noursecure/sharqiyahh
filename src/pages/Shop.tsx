import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Filter, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useQuery } from "@tanstack/react-query";
import { getProducts, getCategories } from "@/api";
import type { APIProduct } from "@/types";

interface ShopProps {
  onAddToCart: (product: APIProduct) => void;
  wishlistIds: string[];
  onToggleWishlist: (product: APIProduct) => void;
}

export default function Shop({ onAddToCart, wishlistIds, onToggleWishlist }: ShopProps) {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");

  // Client-side state for category selector (defaults to URL param or 'all')
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("all");
    }
  }, [categoryParam]);

  const priceRanges = [
    { id: "0-75", min: 0, max: 75, label: "Under $75" },
    { id: "75-125", min: 75, max: 125, label: "$75 - $125" },
    { id: "125-200", min: 125, max: 200, label: "$125 - $200" },
    { id: "200-inf", min: 200, max: undefined, label: "Over $200" },
  ];

  const handlePriceChange = (rangeId: string, checked: boolean) => {
    if (checked) {
      setSelectedPriceRanges([...selectedPriceRanges, rangeId]);
    } else {
      setSelectedPriceRanges(selectedPriceRanges.filter((id) => id !== rangeId));
    }
  };

  // Calculate active min and max price
  const activeRanges = priceRanges.filter((r) => selectedPriceRanges.includes(r.id));
  const minPrice = activeRanges.length > 0 ? Math.min(...activeRanges.map((r) => r.min)) : undefined;
  const maxPrice = activeRanges.length > 0
    ? (activeRanges.some((r) => r.max === undefined) ? undefined : Math.max(...activeRanges.map((r) => r.max as number)))
    : undefined;

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products", selectedCategory, searchParam, minPrice, maxPrice],
    queryFn: () => getProducts(
      selectedCategory === "all" ? undefined : selectedCategory,
      searchParam || undefined,
      minPrice,
      maxPrice
    )
  });

  const filteredProducts = Array.isArray(products) ? products : [];

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories
  });

  const filterCategories = [
    { id: "all", label: "All Products", labelAr: "جميع المنتجات" },
    ...categories.map(c => ({ id: c.id, label: c.name, labelAr: c.name_ar }))
  ];

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground">Failed to load products. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center mb-2">Shop</h1>
          <p className="text-center text-muted-foreground">متجر</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Categories
              </h3>
              <div className="space-y-2">
                {filterCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`block w-full text-left px-3 py-2 rounded transition-colors ${selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                      }`}
                  >
                    {category.label}
                    <span className="block text-sm opacity-70">{category.labelAr}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-semibold mb-4">Price Range</h3>
                <div className="space-y-2 text-sm">
                  {priceRanges.map((range) => (
                    <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedPriceRanges.includes(range.id)}
                        onChange={(e) => handlePriceChange(range.id, e.target.checked)}
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden fixed bottom-4 right-4 z-10">
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button className="rounded-full shadow-lg">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Refine your search</SheetDescription>
                </SheetHeader>
                <div className="mt-8">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {filterCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setShowFilters(false);
                        }}
                        className={`block w-full text-left px-3 py-2 rounded transition-colors ${selectedCategory === category.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                          }`}
                      >
                        {category.label}
                        <span className="block text-sm opacity-70">{category.labelAr}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-border">
                    <h3 className="font-semibold mb-4">Price Range</h3>
                    <div className="space-y-2 text-sm">
                      {priceRanges.map((range) => (
                        <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedPriceRanges.includes(range.id)}
                            onChange={(e) => handlePriceChange(range.id, e.target.checked)}
                          />
                          <span>{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} products
              </p>
              <select className="px-3 py-2 text-sm border border-input bg-background rounded">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No products found.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product: APIProduct) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    onAddToCart={() => onAddToCart(product)}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={() => onToggleWishlist(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
