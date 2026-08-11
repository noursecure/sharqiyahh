import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  onAddToCart?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
}

export const ProductCard = ({
  id,
  name,
  nameAr,
  price,
  originalPrice,
  image,
  category,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
}: ProductCardProps) => {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const navigate = useNavigate();

  return (
    <div className="group relative hover-lift">
      <Link to={`/product/${id}`}>
        <div className="aspect-square overflow-hidden bg-muted rounded-sm mb-3">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-elegant group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Wishlist Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
        onClick={onToggleWishlist}
      >
        <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current text-destructive" : ""}`} />
      </Button>

      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
          -{discount}%
        </div>
      )}

      {/* Quick Actions on Hover */}


      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{category}</p>
        <Link to={`/product/${id}`}>
          <h3 className="font-medium hover:text-accent-foreground transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">{nameAr}</p>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-semibold">${price}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">${originalPrice}</span>
          )}
        </div>
        <Button
          onClick={() => navigate(`/product/${id}`)}
          className="w-full mt-2"
          size="sm"
        >
          Select Options
        </Button>
      </div>
    </div>
  );
};
