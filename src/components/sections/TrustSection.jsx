import React from "react";
import { motion } from "motion/react";

const capabilities = [
  {
    title: "Handpicked Collections",
    detail: "Meticulously selected by artisans",
    metric: "Atelier Certified",
  },
  {
    title: "AI-Powered Personalization",
    detail: "Neural style-matching algorithms",
    metric: "99.2% Accuracy",
  },
  {
    title: "Secure Luxury Checkout",
    detail: "Encrypted Maison-grade protection",
    metric: "Global Assurance",
  },
  {
    title: "Crafted for Gifting",
    detail: "Signature champagne-lined packaging",
    metric: "Concierge Standard",
  },
  {
    title: "Ethically Sourced Maison",
    detail: "Traceable brilliance from mine to finger",
    metric: "RJC Member",
  },
];

const TrustSection = () => {
  return (
    <section className="py-40 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
        <div className="lg:col-span-4 sticky top-40">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <span className="text-[11px] uppercase tracking-[0.6em] text-graphite/30 font-bold mb-8 block">Maison Protocol</span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.9] mb-12">
              The <br />
              <span className="italic font-light text-champagne-800/80">Luma</span> <br />
              Standard
            </h2>
            <p className="text-[12px] uppercase tracking-[0.3em] text-graphite/40 leading-loose font-medium max-w-xs">
              Every interaction with LUMAJewels AI is governed by our commitment to precision, heritage, and the future of luxury.
            </p>
          </motion.div>
        </div>

        <div className="lg:col-span-8 flex flex-col">
          {capabilities.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col md:flex-row md:items-center justify-between py-12 border-b border-graphite/10 last:border-b-0 relative"
            >
              <div className="flex flex-col gap-2 relative z-10">
                <h3 className="text-2xl md:text-3xl lg:text-4xl tracking-tight text-graphite transition-all duration-700 group-hover:translate-x-2">
                  {item.title}
                </h3>
                <p className="text-[10px] uppercase tracking-[0.4em] text-graphite/30 font-bold">
                  {item.detail}
                </p>
              </div>
              
              <div className="mt-8 md:mt-0 relative z-10">
                <span className="inline-block px-8 py-3 border border-champagne/40 bg-champagne/5 text-[10px] uppercase tracking-[0.3em] font-bold text-champagne-900 shadow-sm transition-all duration-700 group-hover:bg-champagne/10 group-hover:border-champagne group-hover:shadow-luxury">
                  {item.metric}
                </span>
              </div>

              {/* Hover Effect Reveal */}
              <div className="absolute inset-0 bg-ivory/30 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-[1s] ease-out pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { TrustSection };
