import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/api";
import heroBannerDefault from "@/assets/hero-banner.jpg";

export const Hero = () => {
  const { data: settings } = useQuery({ 
    queryKey: ["settings"], 
    queryFn: getSettings 
  });

  const bannerImages = settings?.heroBanner ? settings.heroBanner.split(',').filter(Boolean) : [heroBannerDefault];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const heroTitle = settings?.heroTitle || "Discover Our\nModest Collection";
  const heroTitleAr = settings?.heroTitleAr || "اكتشفي مجموعتنا المتواضعة";
  const heroSubtitle = settings?.heroSubtitle || "Elegant designs that celebrate modesty and femininity";

  return (
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
      {bannerImages.map((image: string, index: number) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url("${image}")` }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/40" />
      
      <div className="relative z-10 text-center max-w-3xl px-4 animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight whitespace-pre-line">
          {heroTitle}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {heroTitleAr}
        </p>
        <p className="text-base md:text-lg text-muted-foreground mb-8">
          {heroSubtitle}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/shop">
            <Button size="lg" className="text-base px-8">
              Shop Now
            </Button>
          </Link>
          <Link to="/shop?filter=new">
            <Button size="lg" variant="outline" className="text-base px-8">
              New Arrivals
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
