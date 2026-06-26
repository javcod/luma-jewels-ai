import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Heart, ShoppingBag, Sparkles, ShieldCheck, Truck, Package, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";

const ProductModal = ({ product, isOpen, onClose }) => {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 md:p-12 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ivory/90 backdrop-blur-2xl cursor-pointer"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
            className="relative w-full max-w-7xl bg-white shadow-[0_50px_100px_-20px_rgba(52,52,52,0.15)] hairline overflow-hidden z-10 grid grid-cols-1 lg:grid-cols-12 my-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 z-30 w-12 h-12 flex items-center justify-center hover:bg-black/5 rounded-full transition-all duration-500 text-graphite group"
            >
              <X size={28} strokeWidth={1} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>

            {/* Left: Image Gallery (Visual Hero) */}
            <div className="lg:col-span-7 aspect-[4/5] lg:aspect-auto lg:h-full bg-champagne/5 relative group overflow-hidden border-r border-black/5 min-h-[400px]">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              
              {/* Image Thumbnails / Meta */}
              <div className="absolute bottom-12 left-12 flex flex-col gap-6">
                <div className="flex gap-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -5 }}
                      className="w-16 h-20 bg-white/40 backdrop-blur-md hairline p-1 cursor-pointer transition-all ring-1 ring-white/30"
                    >
                      <img src={product.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/70 font-bold">Ref. Maison {product.id}00-LX</p>
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="lg:col-span-5 p-10 md:p-20 flex flex-col gap-12 overflow-y-auto lg:max-h-[85vh] scrollbar-hidden bg-pearl/30">
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-champagne/50 bg-champagne/10 text-[10px] uppercase tracking-[0.4em] font-bold text-champagne-800 shadow-sm shadow-champagne/20"
                >
                  <Sparkles size={12} className="animate-pulse" />
                  Neural Curated • {product.match} Profile Match
                </motion.div>
                <h3 className="text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.85] text-graphite font-serif">{product.name}</h3>
                <p className="text-3xl font-serif italic text-champagne-800 font-light">{product.price}</p>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase tracking-[0.5em] text-graphite/30 font-bold">The Material</span>
                  <p className="text-[12px] uppercase tracking-[0.2em] text-graphite/70 leading-relaxed font-medium">
                    {product.material || "Exclusively crafted in 18K recycled solid gold with VVS-grade ethically sourced diamonds. Every facet is hand-polished by master artisans at our Paris atelier."}
                  </p>
                </div>
                
                <GlassCard className="p-8 bg-graphite text-ivory border-none rounded-none shadow-2xl relative group overflow-hidden" hover={false}>
                  <div className="flex items-start gap-6 relative z-10">
                    <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center text-graphite border border-champagne/30">
                      <Sparkles size={20} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.5em] text-ivory/40 font-bold">Neural Insight</p>
                      <p className="text-[14px] uppercase tracking-[0.1em] text-ivory leading-loose font-bold italic">
                        "{product.reason || "The structural tension and geometric elegance of this piece mirrors your preference for high-fashion editorial styling, defining a bold silhouette for gala silhouettes."}"
                      </p>
                    </div>
                  </div>
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-champagne/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                </GlassCard>
              </div>

              <div className="grid grid-cols-2 gap-10 py-10 border-y border-black/5">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-ivory flex items-center justify-center text-graphite/50 shadow-inner">
                    <ShieldCheck size={20} strokeWidth={1} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-graphite">Assurance</p>
                    <p className="text-[9px] uppercase tracking-widest text-graphite/40 font-medium whitespace-nowrap">Lifetime Warranty</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-ivory flex items-center justify-center text-graphite/50 shadow-inner">
                    <Truck size={20} strokeWidth={1} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-graphite">Concierge</p>
                    <p className="text-[9px] uppercase tracking-widest text-graphite/40 font-medium whitespace-nowrap">White Glove Delivery</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 pt-4">
                <Button variant="primary" size="lg" className="flex-grow rounded-none shadow-luxury py-6 group/btn relative overflow-hidden">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Acquire this Brilliance <ShoppingBag size={14} className="group-hover/btn:scale-110 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-champagne/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-700" />
                </Button>
                <button className="w-20 h-20 border border-graphite/10 flex items-center justify-center hover:bg-champagne/10 transition-all duration-700 rounded-none group shrink-0">
                  <Heart size={28} strokeWidth={1} className="group-hover:fill-champagne-600 group-hover:scale-110 transition-all duration-500" />
                </button>
              </div>

              <p className="text-[9px] uppercase tracking-[0.4em] text-graphite/30 text-center font-bold pb-4">
                Complimentary resizing & engraving available upon request.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export { ProductModal };
