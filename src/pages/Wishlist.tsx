import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WishlistItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
}

interface WishlistProps {
  items: WishlistItem[];
  onRemove: (id: string) => void;
  onAddToCart: (id: string) => void;
}

export default function Wishlist({ items, onRemove, onAddToCart }: WishlistProps) {
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <Heart className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="font-serif text-3xl mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Save your favorite items here to shop them later.
          </p>
          <Link to="/shop">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center mb-2">
            My Wishlist
          </h1>
          <p className="text-center text-muted-foreground">قائمة الأمنيات</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <p className="text-sm text-muted-foreground mb-6">
          {items.length} {items.length === 1 ? "item" : "items"} saved
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const discount = item.originalPrice
              ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
              : 0;

            return (
              <div key={item.id} className="group relative hover-lift">
                <Link to={`/product/${item.id}`}>
                  <div className="aspect-square overflow-hidden bg-muted rounded-sm mb-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-elegant group-hover:scale-105"
                    />
                  </div>
                </Link>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                    -{discount}%
                  </div>
                )}

                {/* Quick Add to Cart */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-elegant bg-gradient-to-t from-background/95 to-transparent p-4 opacity-0 group-hover:opacity-100">
                  <Button
                    onClick={() => onAddToCart(item.id)}
                    className="w-full"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {item.category}
                  </p>
                  <Link to={`/product/${item.id}`}>
                    <h3 className="font-medium hover:text-accent-foreground transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.nameAr}</p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${item.price}</span>
                    {item.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${item.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
