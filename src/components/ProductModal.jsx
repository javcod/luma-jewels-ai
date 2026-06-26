import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Sparkles, Gem, ShieldCheck } from "lucide-react";

export default function ProductModal({ product, isOpen, onClose, onWishlist }) {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ duration: 0.35 }}
            className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-amber-200/20 bg-[#0d0805] shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>

            <div className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
              <div className="overflow-hidden rounded-[1.5rem] bg-white/5">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-[420px] w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-center">
                <p className="mb-3 text-sm uppercase tracking-[0.35em] text-amber-200">
                  AI Curated Piece
                </p>

                <h2 className="text-4xl font-semibold text-white md:text-5xl">
                  {product.name}
                </h2>

                <p className="mt-4 text-lg text-white/60">
                  {product.category || "Luxury Jewellery"}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-5 py-2 text-sm text-amber-100">
                    {product.match || product.matchScore || 96}% AI Match
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/70">
                    {product.metal || "Premium Finish"}
                  </span>
                </div>

                <p className="mt-6 text-3xl font-semibold text-amber-100">
                  {product.price}
                </p>

                <p className="mt-6 leading-8 text-white/65">
                  {product.description ||
                    "A refined jewellery piece selected through Luma AI based on elegance, occasion, design preference, and gifting intent."}
                </p>

                <div className="mt-7 rounded-3xl border border-amber-200/15 bg-white/[0.04] p-5">
                  <div className="mb-3 flex items-center gap-2 text-amber-200">
                    <Sparkles size={18} />
                    <p className="font-medium">Why Luma AI recommends this</p>
                  </div>

                  <p className="text-sm leading-7 text-white/60">
                    This piece matches your luxury profile because it balances
                    occasion suitability, premium design language, visual
                    elegance, and personalised style preference.
                  </p>
                </div>

                <div className="mt-7 grid gap-3 text-sm text-white/65">
                  <div className="flex items-center gap-3">
                    <Gem className="text-amber-200" size={18} />
                    Handpicked luxury-inspired design
                  </div>

                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-amber-200" size={18} />
                    Secure premium shopping experience
                  </div>
                </div>

                <button
                  onClick={() => onWishlist(product)}
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-amber-200 px-7 py-4 font-semibold text-black transition hover:scale-[1.02] hover:bg-amber-100"
                >
                  <Heart size={19} />
                  Add to Luma Wishlist
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}