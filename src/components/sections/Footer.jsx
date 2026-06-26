import React from "react";
import { motion } from "motion/react";
import { Mail, Globe, Sparkles, ArrowUp } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-ivory border-t border-graphite/10 pt-20 pb-10 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 md:gap-10">
        {/* Brand */}
        <div className="flex flex-col gap-6 max-w-sm">
          <div className="text-2xl font-serif tracking-tighter text-graphite flex items-center gap-2">
            <span className="w-8 h-8 bg-graphite rounded-full flex items-center justify-center text-ivory text-xs italic border border-champagne/30">L</span>
            LUMA<span className="font-light italic text-champagne-700">Jewels</span> <span className="text-[8px] tracking-[0.3em] font-sans font-bold align-top ml-1 opacity-50 uppercase">AI</span>
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] leading-loose text-graphite/40 font-medium">
            Redefining luxury through the lens of artificial intelligence. Hand-crafted elegance, algorithmically matched to your personal narrative.
          </p>
          <div className="flex gap-6 text-graphite/30 mt-2">
            <Mail size={18} strokeWidth={1.5} />
<Globe size={18} strokeWidth={1.5} />
<Sparkles size={18} strokeWidth={1.5} />
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-12 md:gap-24">
          <div className="flex flex-col gap-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-graphite/80 underline underline-offset-8 decoration-champagne/50">Collection</span>
            <div className="flex flex-col gap-4">
              {["Rings", "Necklaces", "Earrings", "Bracelets", "Luxury Gifts"].map((link) => (
                <a key={link} href="#" className="text-[10px] uppercase tracking-[0.25em] text-graphite/40 hover:text-graphite transition-all group flex items-center gap-1">
                  {link} <ArrowUp size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-graphite/80 underline underline-offset-8 decoration-champagne/50">Maison</span>
            <div className="flex flex-col gap-4">
              {["Our Story", "Atelier", "Sustainability", "Care Guide", "Concierge"].map((link) => (
                <a key={link} href="#" className="text-[10px] uppercase tracking-[0.25em] text-graphite/40 hover:text-graphite transition-all group flex items-center gap-1">
                  {link} <ArrowUp size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col gap-6 w-full md:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-graphite/80 underline underline-offset-8 decoration-champagne/50">Newsletter</span>
          <p className="text-[10px] uppercase tracking-widest text-graphite/40">Subscribe to receive AI-curated trends.</p>
          <div className="flex items-center gap-2 group relative">
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-transparent border-b border-graphite/10 py-3 text-[10px] uppercase tracking-widest focus:outline-none focus:border-champagne transition-all duration-700 w-full md:w-64 pr-10"
            />
            <button className="absolute right-0 text-graphite/50 hover:text-graphite transition-colors">
              <Mail size={18} strokeWidth={1} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[8px] uppercase tracking-[0.4em] text-graphite/30">
          &copy; 2026 LUMAJewels AI. All rights reserved. Crafting the future of brilliance.
        </p>
        <div className="flex gap-10">
          <a href="#" className="text-[8px] uppercase tracking-[0.4em] text-graphite/30 hover:text-graphite transition-colors">Privacy Policy</a>
          <a href="#" className="text-[8px] uppercase tracking-[0.4em] text-graphite/30 hover:text-graphite transition-colors">Terms of Maison</a>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
