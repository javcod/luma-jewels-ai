import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";
import { Sparkles, ArrowRight } from "lucide-react";

const Hero = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen pt-32 pb-20 px-6 md:px-12 flex items-center overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        {/* Left Content */}
        <div className="lg:col-span-6 flex flex-col gap-10 md:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] uppercase tracking-[0.5em] text-graphite/30 font-bold mb-6 block flex items-center gap-3">
              <Sparkles size={12} className="text-champagne-800" />
              Intelligence meets elegance
            </span>
            <h1 className="text-6xl md:text-8xl lg:text-9xl leading-[0.9] mb-10 tracking-tighter">
              Jewellery Chosen <br />
              <span className="italic font-light text-champagne-800/80">by AI,</span> <br />
              Designed for You.
            </h1>
            <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-graphite/40 max-w-md leading-relaxed font-medium">
              Discover rings, necklaces, and luxury gifts matched to your personal narrative using our proprietary AI curation.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-8"
          >
            <Button variant="primary" size="lg" className="group shadow-2xl">
              Find My Style <ArrowRight size={14} className="ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="backdrop-blur-sm">
              Explore Collection
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="flex items-center gap-16 mt-6"
          >
            {[
              { label: "Hand-crafted", value: "Atelier" },
              { label: "Precision", value: "99.2% Match" },
              { label: "Maison", value: "Paris" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-2">
                <span className="text-[9px] uppercase tracking-[0.4em] text-graphite/20 font-bold">{stat.label}</span>
                <span className="text-[11px] uppercase tracking-[0.25em] text-graphite/70 font-bold">{stat.value}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Image Container */}
        <div className="lg:col-span-6 relative h-[600px] md:h-[850px] flex items-center justify-center">
          <motion.div
            style={{ y, scale }}
            className="relative w-full h-full bg-champagne/5 rounded-none overflow-hidden hairline shadow-luxury z-0"
          >
            <img 
              src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&w=1440&q=80&fit=crop" 
              alt="Luxury Jewellery"
              className="w-full h-full object-cover grayscale-[0.1] contrast-[1.05] hover:scale-105 transition-transform duration-[5s] ease-out"
            />
            {/* Soft Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-ivory/20 to-transparent pointer-events-none" />
          </motion.div>

          {/* Floating Glass Chips */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -left-16 top-1/4 z-20"
          >
            <GlassCard className="py-5 px-8 md:px-10 border-white/30 bg-white/40 shadow-2xl rounded-none">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-graphite flex items-center justify-center text-ivory text-sm font-serif italic border border-champagne/30">92%</div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-graphite/40 font-bold">Style Match</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-graphite font-bold">Perfect for you</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -right-12 bottom-1/3 z-20 hidden md:block"
          >
            <GlassCard className="py-5 px-8 border-white/30 bg-white/40 shadow-2xl rounded-none">
              <p className="text-[9px] uppercase tracking-[0.4em] text-graphite/40 font-bold mb-2 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-champagne-600 animate-pulse" />
                AI Analysis
              </p>
              <p className="text-[11px] uppercase tracking-[0.15em] text-graphite leading-relaxed font-bold italic">
                "Pairs elegantly with <br /> evening silhouettes."
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Decorative background elements */}
      <motion.div 
        style={{ opacity }}
        className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-champagne/5 to-transparent -z-10" 
      />
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20">
        <span className="text-[9px] uppercase tracking-[0.6em] text-graphite font-bold">Explore</span>
        <div className="w-px h-20 bg-graphite" />
      </div>
    </section>
  );
};

export { Hero };
