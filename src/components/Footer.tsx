import { Instagram, Facebook, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-serif font-bold mb-4">Sharqiyah</h3>
            <p className="text-sm text-muted-foreground mb-4">
             Your Smart, Modest, Feminine collection
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/sharqiyahh/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="mailto:info@sharqiyahh.com"
                className="hover:text-accent-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop?category=dresses" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dresses
                </Link>
              </li>
              <li>
                <Link to="/shop?category=abayas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Abayas
                </Link>
              </li>
              <li>
                <Link to="/shop?category=tops" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tops
                </Link>
              </li>
              <li>
                <Link to="/shop?category=trousers" className="text-muted-foreground hover:text-foreground transition-colors">
                  Trousers
                </Link>
              </li>
              <li>
                <Link to="/shop?category=chemise" className="text-muted-foreground hover:text-foreground transition-colors">
                  Chemise
                </Link>
              </li>
              <li>
                <Link to="/shop?category=basics" className="text-muted-foreground hover:text-foreground transition-colors">
                  Basics
                </Link>
              </li>
              <li>
                <Link to="/shop?filter=new" className="text-muted-foreground hover:text-foreground transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Contact Us
              </li>
              <li className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Shipping Info
              </li>
              <li className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Returns
              </li>
              <li className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Size Guide
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to get special offers and updates
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded"
              />
              <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Sharqiyah. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
