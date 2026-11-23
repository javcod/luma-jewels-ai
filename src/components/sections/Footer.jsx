import { ArrowUp } from "lucide-react";

const projectLinks = [
  { label: "GitHub", href: "https://github.com/javcod/luma-jewels-ai" },
  { label: "API Docs", href: "https://lumajewel-backend.onrender.com/docs" },
];

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
            A jewellery storefront with an AI shopping assistant grounded in a real product catalog.
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-12 md:gap-24">
          <div className="flex flex-col gap-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-graphite/80 underline underline-offset-8 decoration-champagne/50">Collection</span>
            <div className="flex flex-col gap-4">
              {["Rings", "Necklaces", "Earrings", "Bracelets"].map((link) => (
                <a key={link} href="#collections" className="text-[10px] uppercase tracking-[0.25em] text-graphite/40 hover:text-graphite transition-all group flex items-center gap-1">
                  {link} <ArrowUp size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-graphite/80 underline underline-offset-8 decoration-champagne/50">Project</span>
            <div className="flex flex-col gap-4">
              {projectLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] uppercase tracking-[0.25em] text-graphite/40 hover:text-graphite transition-all group flex items-center gap-1"
                >
                  {link.label} <ArrowUp size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[8px] uppercase tracking-[0.4em] text-graphite/30">
          &copy; 2026 Luma Jewels AI
        </p>
        <p className="text-[8px] uppercase tracking-[0.4em] text-graphite/30">
          Portfolio demo by Prabhuji Mishra. Not a real store; products and prices are sample data.
        </p>
      </div>
    </footer>
  );
};

export { Footer };
