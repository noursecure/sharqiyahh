import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Truck, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createOrder } from "@/api";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

interface CheckoutProps {
  items: CartItem[];
  onClearCart: () => void;
}

const Checkout = ({ items, onClearCart }: CheckoutProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 200 ? 0 : 15;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Gather form data (a simplified approach, ideally use react-hook-form)
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const orderData = {
      firstName: formData.get("firstName") || "Guest", // Fallback for demo if id not matching perfectly
      lastName: formData.get("lastName") || "User",
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      address: (form.elements.namedItem("address") as HTMLInputElement).value,
      city: (form.elements.namedItem("city") as HTMLInputElement).value,
      region: (form.elements.namedItem("region") as HTMLInputElement).value,
      items: items,
      total: total
    };

    try {
      await createOrder(orderData);

      toast({
        title: "Order Placed Successfully!",
        description: "Thank you for your order. We have received it.",
      });
      onClearCart();
      navigate("/");
    } catch (error) {
      console.error("Order error", error);
      toast({
        title: "Order Failed",
        description: "There was an issue placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">Add some items to your cart before checking out.</p>
          <Button onClick={() => navigate("/shop")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 lg:py-16">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="font-serif text-3xl lg:text-4xl mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div className="space-y-4">
                <h2 className="font-serif text-xl">Contact Information</h2>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" placeholder="+961 XX XXX XXX" required />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Shipping Address */}
              <div className="space-y-4">
                <h2 className="font-serif text-xl">Shipping Address</h2>
                <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" placeholder="First name" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" placeholder="Last name" required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" placeholder="Street address" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
                    <Input id="apartment" name="apartment" placeholder="Apartment, suite, etc." />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" placeholder="City" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="region">Region</Label>
                      <Input id="region" name="region" placeholder="Region" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="postal">Postal Code</Label>
                      <Input id="postal" name="postal" placeholder="Postal code" />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment */}
              <div className="space-y-4">
                <h2 className="font-serif text-xl">Payment</h2>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cash on Delivery (COD)
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : `Place Order • $${total.toFixed(2)}`}
              </Button>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:pl-8">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h2 className="font-serif text-xl mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.size && (
                        <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                      )}
                    </div>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Free shipping over $200</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
