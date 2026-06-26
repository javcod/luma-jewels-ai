import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, ShoppingBag, Sparkles, ChevronRight, Info } from "lucide-react";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";
import { cn } from "../../utils/cn";

const recommendations = [
  {
    id: 1,
    name: "Astraea Diamond Ring",
    price: "$2,450",
    image: "https://images.unsplash.com/photo-1613945407943-59cd755fd69e?auto=format&w=800&q=80",
    match: "98%",
    reason: "Matched with your preference for minimalist gold designs and occasion: evening wear.",
    material: "18K Solid Gold, 0.5ct VVS Diamond",
  },
  {
    id: 2,
    name: "Luna Pearl Earrings",
    price: "$1,120",
    image: "https://images.pexels.com/photos/1395305/pexels-photo-1395305.jpeg?auto=compress&cs=tinysrgb&w=800",
    match: "96%",
    reason: "Complements your cool skin tone and penchant for timeless classic silhouettes.",
    material: "Tahitian Black Pearl, Platinum",
  },
  {
    id: 3,
    name: "Seraphina Gold Necklace",
    price: "$3,800",
    image: "https://images.unsplash.com/photo-1625792508272-bc6ad2788b14?auto=format&w=800&q=80",
    match: "94%",
    reason: "Aligned with your style profile: 'Editorial Modern' and search history for statement pieces.",
    material: "Hand-crafted 14K Gold Link",
  },
  {
    id: 4,
    name: "Ethereal Diamond Studs",
    price: "$1,850",
    image: "https://images.pexels.com/photos/5370644/pexels-photo-5370644.jpeg?auto=compress&cs=tinysrgb&w=800",
    match: "92%",
    reason: "Perfect balance of daily wearability and luxury, matching your 'Understated' style filter.",
    material: "Round-cut Diamonds, White Gold",
  },
];

const AIRecommendation = () => {
  const [activeItem, setActiveItem] = useState(recommendations[0]);

  return (
    <section id="ai-match" className="py-32 px-6 md:px-12 bg-pearl">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-champagne/40 bg-champagne/5 text-[9px] uppercase tracking-[0.5em] font-bold text-champagne-800 mb-8 shadow-luxury"
          >
            <Sparkles size={12} />
            Your Personal AI Curator
          </motion.div>
          <h2 className="text-6xl md:text-8xl tracking-tighter mb-8">
            Recommended <span className="italic font-light text-champagne-800/80 underline underline-offset-16 decoration-champagne/30">for You</span>
          </h2>
          <p className="text-[11px] uppercase tracking-[0.3em] text-graphite/40 max-w-lg mx-auto leading-loose font-medium">
            Our neural engine has meticulously analysed your style parameters to surface pieces that resonate with your current narrative.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Thumbnail Strip */}
          <div className="lg:col-span-4 relative">
            <div className="flex lg:flex-col gap-6 overflow-x-auto lg:overflow-x-visible pb-6 lg:pb-0 scrollbar-hidden snap-x">
              {recommendations.map((item) => (
                <motion.div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className={cn(
                    "flex-shrink-0 w-28 h-28 lg:w-full lg:h-36 hairline cursor-pointer transition-all duration-1000 relative overflow-hidden group flex items-center p-4 snap-center",
                    activeItem.id === item.id ? "bg-white shadow-luxury ring-1 ring-champagne/40 lg:translate-x-2" : "bg-transparent opacity-40 hover:opacity-100"
                  )}
                >
                  <img src={item.image} alt={item.name} className="w-20 h-20 lg:w-28 lg:h-28 object-cover shadow-sm group-hover:scale-105 transition-transform duration-700" />
                  <div className="hidden lg:block ml-6 pr-8">
                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-graphite mb-2 truncate w-44">{item.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-graphite/40 font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-champagne animate-pulse" />
                      {item.match} Match
                    </p>
                  </div>
                  {activeItem.id === item.id && (
                    <motion.div layoutId="indicator" className="absolute left-0 top-0 bottom-0 w-1.5 bg-champagne" />
                  )}
                </motion.div>
              ))}
            </div>
            {/* Mobile Scroll Indicator */}
            <div className="lg:hidden absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {recommendations.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    activeItem.id === item.id ? "w-4 bg-champagne" : "w-1 bg-graphite/10"
                  )} 
                />
              ))}
            </div>
          </div>

          {/* Detail View */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24"
              >
                <div className="aspect-[4/5] bg-white hairline overflow-hidden shadow-luxury relative group ring-[20px] ring-white/50 ring-inset">
                  <img 
                    src={activeItem.image} 
                    alt={activeItem.name} 
                    className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110"
                  />
                  <div className="absolute top-10 right-10">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-champagne/60 flex flex-col items-center justify-center bg-white/40 backdrop-blur-xl shadow-2xl">
                      <span className="text-[10px] uppercase tracking-tighter text-graphite font-bold leading-none opacity-50">Score</span>
                      <span className="text-2xl font-serif italic text-graphite leading-none mt-1">{activeItem.match}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-10">
                  <div>
                    <h3 className="text-4xl md:text-5xl lg:text-6xl mb-6 tracking-tighter leading-tight">{activeItem.name}</h3>
                    <p className="text-2xl font-serif italic text-champagne-800 mb-6">{activeItem.price}</p>
                    <p className="text-[12px] uppercase tracking-[0.25em] text-graphite/40 font-bold mb-10 border-l-2 border-champagne pl-4">{activeItem.material}</p>
                  </div>

                  <GlassCard className="p-8 md:p-10 bg-champagne/10 border-champagne/20 rounded-none shadow-none ring-1 ring-white/20" hover={false}>
                    <div className="flex items-start gap-6">
                      <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-graphite flex items-center justify-center text-ivory border border-champagne/30">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-graphite/40 font-bold mb-3">AI Curation Note</p>
                        <p className="text-[13px] uppercase tracking-[0.1em] text-graphite leading-loose font-bold italic">
                          "{activeItem.reason}"
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <div className="flex items-center gap-8 mt-6">
                    <Button variant="primary" size="lg" className="flex-grow rounded-none shadow-2xl py-5">
                      Secure this Piece <ShoppingBag size={14} className="ml-4" />
                    </Button>
                    <button className="w-16 h-16 border border-graphite/10 flex items-center justify-center hover:bg-champagne/10 transition-all duration-500 rounded-none group">
                      <Heart size={24} strokeWidth={1} className="group-hover:scale-110 group-hover:fill-champagne transition-all" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 text-graphite/30 hover:text-graphite transition-all duration-500 cursor-pointer group mt-4 border-t border-black/5 pt-6">
                    <Info size={14} strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Request Virtual Presentation</span>
                    <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform duration-500" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export { AIRecommendation };
