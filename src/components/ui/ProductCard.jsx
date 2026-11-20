import { motion } from "motion/react";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { Button } from "../ui/Button";

// `isWishlisted` is real state owned by the caller (see src/hooks/useWishlist.js)
// — this component never tracks its own "added" flag, so the heart/button
// state can never drift from the actual wishlist.
const ProductCard = ({ product, onClick, onWishlist, compact = false, isWishlisted = false }) => {
  const handleWishlistClick = (e) => {
    e.stopPropagation();
    onWishlist?.(product);
  };

  // Compact variant: a small horizontal row, used for recommendations
  // rendered inside the narrow Luma Concierge panel (Phase 5B/5C). The
  // default (non-compact) card below — used by the main product grid — is
  // unchanged. Same component, same click-to-open-ProductModal contract;
  // just a smaller layout for a space-constrained context. A real <button>
  // (not a clickable div) so it's keyboard-focusable and Enter/Space-
  // activatable without extra handlers.
  if (compact) {
    return (
      <motion.button
        type="button"
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={onClick}
        className="group flex w-full items-center gap-3 border border-graphite/10 bg-white p-3 text-left transition-all duration-300 hover:border-champagne/40 hover:bg-champagne/5 focus-visible:border-champagne/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden bg-champagne/5">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-graphite/30">
            {product.category}
          </p>
          <h4 className="truncate text-sm font-medium tracking-tight text-graphite">{product.name}</h4>
          <p className="mt-0.5 font-serif text-sm italic text-champagne-800">
            {product.price_display || product.price}
          </p>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-none bg-white hairline transition-all duration-700 hover:shadow-luxury"
    >
      {/* Image Area */}
      <div
        className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-champagne/5 ring-1 ring-black/[0.03] ring-inset"
        onClick={onClick}
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-110"
        />

        {/* Hover Actions */}
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-5 bg-black/10 opacity-0 backdrop-blur-[2px] transition-all duration-700 group-hover:opacity-100">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#F7E7CE" }}
            onClick={handleWishlistClick}
            className="flex h-12 w-12 translate-y-6 items-center justify-center rounded-full bg-white text-graphite shadow-2xl duration-700 delay-75 group-hover:translate-y-0"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={20}
              strokeWidth={1.5}
              className={
                isWishlisted
                  ? "fill-red-500 text-red-500"
                  : "text-graphite"
              }
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#F7E7CE" }}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="flex h-12 w-12 translate-y-6 items-center justify-center rounded-full bg-white text-graphite shadow-2xl duration-700 delay-150 group-hover:translate-y-0"
            aria-label="View product"
          >
            <Eye size={20} strokeWidth={1} />
          </motion.button>
        </div>
      </div>

      {/* Info */}
      <div className="relative z-10 flex flex-col gap-6 p-8 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-graphite/30">
              {product.category}
            </p>

            <h4 className="text-xl font-medium leading-none tracking-tighter text-graphite md:text-2xl">
              {product.name}
            </h4>
          </div>

          <p className="shrink-0 font-serif text-xl italic text-champagne-800">
            {product.price_display || product.price}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-grow bg-black/[0.06]" />

          <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.4em] text-graphite/20">
            Luma Collection
          </span>

          <div className="h-px flex-grow bg-black/[0.06]" />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleWishlistClick}
          className="group/btn w-full rounded-none py-4 transition-all duration-700 hover:bg-graphite hover:text-white"
        >
          {isWishlisted ? "Saved to Wishlist" : "Add to Wishlist"}

          <ShoppingBag
            size={12}
            className="ml-3 transition-transform duration-500 group-hover/btn:translate-y-[-2px]"
          />
        </Button>
      </div>

      {/* Hover Glow Effect */}
      <div className="pointer-events-none absolute -inset-10 bg-gradient-to-tr from-champagne/10 via-transparent to-transparent opacity-0 blur-[80px] transition-opacity duration-1000 group-hover:opacity-100" />
    </motion.div>
  );
};

export { ProductCard };