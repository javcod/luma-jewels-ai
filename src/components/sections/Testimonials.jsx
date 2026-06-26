import React from "react";
import { motion } from "motion/react";

const testimonials = [
  {
    quote: "Finding the perfect anniversary gift felt impossible until Luma's AI matched my wife's style perfectly. It wasn't just jewelry; it was a story revealed through data.",
    author: "Jameson V.",
    role: "Collector",
    id: "01",
  },
  {
    quote: "The 'Editorial Modern' recommendation for my gala appearance was breathtaking. The neural engine understands silhouettes better than any stylist I've worked with.",
    author: "Elena Rose",
    role: "Fashion Curator",
    id: "02",
  },
  {
    quote: "Precision meets poetry. The match score was 98%, and when I opened the box, it felt like the piece was sculpted specifically for my aura.",
    author: "Marcello D.",
    role: "Bespoke Patron",
    id: "03",
  },
];

const Testimonials = () => {
  return (
    <section className="py-40 px-6 md:px-12 bg-pearl/50 border-t border-black/5 overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex justify-between items-center mb-24 border-b border-black/5 pb-10">
          <span className="text-[11px] uppercase tracking-[0.6em] text-graphite/30 font-bold">The Patron Voice</span>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-px bg-champagne" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-graphite/60 font-bold italic">Editorial Series</span>
          </div>
        </div>

        <div className="flex flex-col gap-32">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center text-center max-w-4xl mx-auto group"
            >
              <span className="absolute -top-16 left-1/2 -translate-x-1/2 text-8xl font-serif italic text-black/[0.03] select-none pointer-events-none">
                {item.id}
              </span>
              
              <blockquote className="text-3xl md:text-5xl lg:text-6xl font-serif italic leading-[1.2] text-graphite tracking-tight mb-12 relative z-10 group-hover:text-champagne-900 transition-colors duration-1000">
                "{item.quote}"
              </blockquote>
              
              <div className="flex flex-col items-center gap-3">
                <p className="text-[12px] uppercase tracking-[0.5em] font-bold text-graphite">{item.author}</p>
                <div className="w-10 h-px bg-champagne/40" />
                <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-graphite/30 italic">{item.role}</p>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-1/2 left-0 w-24 h-px bg-gradient-to-r from-champagne/20 to-transparent -translate-x-full hidden lg:block" />
              <div className="absolute top-1/2 right-0 w-24 h-px bg-gradient-to-l from-champagne/20 to-transparent translate-x-full hidden lg:block" />
            </motion.div>
          ))}
        </div>

        <div className="mt-40 text-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-block p-10 hairline bg-white/40 backdrop-blur-md cursor-pointer group"
          >
            <p className="text-[11px] uppercase tracking-[0.5em] text-graphite/40 font-bold mb-2 transition-colors group-hover:text-graphite">Join the Maison</p>
            <p className="text-2xl font-serif italic text-graphite">Curate Your Narrative</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export { Testimonials };
