import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

const Navbar = () => {
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
    { name: "AI Match", href: "#ai-match" },
    { name: "Style Quiz", href: "#quiz" },
    { name: "Wishlist", href: "#wishlist" },
  ];

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
            <button className="hover:text-graphite transition-all duration-300 relative">
              <Heart size={18} strokeWidth={1.2} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-champagne rounded-full border border-ivory scale-75 animate-pulse"></span>
            </button>
            <button className="hover:text-graphite transition-all duration-300">
              <ShoppingBag size={18} strokeWidth={1.2} />
            </button>
          </div>
          
          <Button variant="primary" size="sm" className="hidden sm:flex rounded-none shadow-luxury">
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
              <div className="flex gap-10 py-2 text-graphite/60">
                <Search size={22} strokeWidth={1} />
                <Heart size={22} strokeWidth={1} />
                <ShoppingBag size={22} strokeWidth={1} />
              </div>
              <Button variant="primary" size="lg" className="w-full">
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
