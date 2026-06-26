import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../../utils/cn";

const collections = [
  {
    id: "rings",
    title: "Rings",
    description: "Sculpted brilliance for every hand.",
    image: "https://images.unsplash.com/photo-1662434923232-0164224dbdb2?auto=format&w=800&q=80",
    size: "tall",
  },
  {
    id: "necklaces",
    title: "Necklaces",
    description: "Graceful curves in gold and stone.",
    image: "https://images.unsplash.com/photo-1722410180644-5955f83ec8b1?auto=format&w=800&q=80",
    size: "wide",
  },
  {
    id: "earrings",
    title: "Earrings",
    description: "Light-catching statements.",
    image: "https://images.pexels.com/photos/31459468/pexels-photo-31459468.jpeg?auto=compress&cs=tinysrgb&w=800",
    size: "square",
  },
  {
    id: "bracelets",
    title: "Bracelets",
    description: "Fluid elegance around the wrist.",
    image: "https://images.pexels.com/photos/13155693/pexels-photo-13155693.jpeg?auto=compress&cs=tinysrgb&w=800",
    size: "square",
  },
  {
    id: "gifts",
    title: "Luxury Gifts",
    description: "Timeless tokens of affection.",
    image: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&w=800&q=80",
    size: "wide",
  },
];

const CollectionGrid = () => {
  return (
    <section id="collections" className="py-32 px-6 md:px-12 bg-ivory">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <span className="text-[10px] uppercase tracking-[0.5em] text-graphite/30 font-bold mb-4 block">Curated Editions</span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl tracking-tighter">
              Featured <span className="italic font-light text-champagne-800/80">Collections</span>
            </h2>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-[11px] uppercase tracking-[0.25em] text-graphite/40 max-w-xs leading-relaxed font-medium mb-2"
          >
            Each piece is hand-selected and matched to your unique profile by our AI curator.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:auto-rows-[300px]">
          {collections.map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "group relative overflow-hidden hairline bg-champagne/5",
                col.size === "tall" && "lg:row-span-2",
                col.size === "wide" && "lg:col-span-2"
              )}
            >
              {/* Image */}
              <img 
                src={col.image} 
                alt={col.title}
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-700" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 flex flex-col justify-end transform transition-transform duration-700 group-hover:translate-y-[-10px]">
                <div className="flex items-center justify-between items-end">
                  <div>
                    <h3 className="text-2xl md:text-4xl text-white mb-2 tracking-tight">{col.title}</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                      {col.description}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white group-hover:bg-white group-hover:text-graphite transition-all duration-500">
                    <ArrowUpRight size={18} strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* Hover Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-champagne/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-2xl pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { CollectionGrid };
