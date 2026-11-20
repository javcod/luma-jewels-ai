import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

const Navbar = ({ onToggleConcierge, wishlistCount = 0, onOpenWishlist }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Collections", href: "#collections" },
    { name: "Curated Edit", href: "#ai-match" },
    { name: "Style Quiz", href: "#quiz" },
  ];

  const hasWishlistItems = wishlistCount > 0;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-700 px-6 md:px-12",
        isScrolled ? "py-4 bg-white/80 backdrop-blur-xl border-b border-black/5" : "py-8 bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.a
          href="#"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-serif tracking-tighter text-graphite flex items-center gap-2"
        >
          <span className="w-8 h-8 bg-graphite rounded-full flex items-center justify-center text-ivory text-xs italic border border-champagne/30">L</span>
          LUMA<span className="font-light italic text-champagne-700">Jewels</span> <span className="text-[8px] tracking-[0.3em] font-sans font-bold align-top ml-1 opacity-50 uppercase">AI</span>
        </motion.a>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.name}
              href={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="group relative text-[10px] uppercase tracking-[0.25em] font-medium text-graphite/50 hover:text-graphite transition-colors duration-500"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-champagne transition-all duration-500 group-hover:w-full"></span>
            </motion.a>
          ))}
        </div>

        {/* Icons & CTA */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex items-center gap-5 text-graphite/60">
            <button className="hover:text-graphite transition-all duration-300">
              <Search size={18} strokeWidth={1.2} />
            </button>
            <button
              type="button"
              onClick={onOpenWishlist}
              aria-label={hasWishlistItems ? `Open wishlist (${wishlistCount} saved)` : "Open wishlist"}
              className="relative hover:text-graphite transition-all duration-300"
            >
              <Heart size={18} strokeWidth={1.2} />
              {hasWishlistItems && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-champagne px-1 text-[8px] font-bold leading-none text-graphite border border-ivory">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button className="hover:text-graphite transition-all duration-300">
              <ShoppingBag size={18} strokeWidth={1.2} />
            </button>
          </div>
          
          <Button
            variant="primary"
            size="sm"
            className="hidden sm:flex rounded-none shadow-luxury"
            onClick={onToggleConcierge}
          >
            Find My Style
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-graphite p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} strokeWidth={1.2} /> : <Menu size={24} strokeWidth={1.2} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-black/5 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col gap-8 p-10">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm uppercase tracking-[0.3em] font-medium text-graphite/70 hover:text-graphite transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-black/5" />
              <div className="flex items-center gap-10 py-2 text-graphite/60">
                <Search size={22} strokeWidth={1} />
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenWishlist?.();
                  }}
                  aria-label={hasWishlistItems ? `Open wishlist (${wishlistCount} saved)` : "Open wishlist"}
                  className="relative"
                >
                  <Heart size={22} strokeWidth={1} />
                  {hasWishlistItems && (
                    <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-champagne px-1 text-[9px] font-bold leading-none text-graphite border border-ivory">
                      {wishlistCount}
                    </span>
                  )}
                </button>
                <ShoppingBag size={22} strokeWidth={1} />
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onToggleConcierge?.();
                }}
              >
                Find My Style
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export { Navbar };
