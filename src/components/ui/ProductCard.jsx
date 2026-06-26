import React, { useState } from "react";
import { motion } from "motion/react";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { Button } from "../ui/Button";

const ProductCard = ({ product, onClick, onWishlist }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    setIsWishlisted(true);
    onWishlist?.(product);
  };

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

        {/* Match Badge */}
        <div className="absolute right-5 top-5 z-10">
          <div className="flex h-14 w-14 -rotate-12 transform flex-col items-center justify-center rounded-full border border-dashed border-champagne/60 bg-white/30 shadow-2xl ring-4 ring-white/20 backdrop-blur-md transition-all duration-700 group-hover:rotate-0 group-hover:scale-110">
            <span className="text-[8px] font-bold uppercase leading-none tracking-tighter text-graphite opacity-40">
              Match
            </span>
            <span className="mt-1 font-serif text-[16px] italic leading-none text-graphite">
              {product.match}
            </span>
          </div>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-5 bg-black/10 opacity-0 backdrop-blur-[2px] transition-all duration-700 group-hover:opacity-100">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "#F7E7CE" }}
            onClick={handleWishlistClick}
            className="flex h-12 w-12 translate-y-6 items-center justify-center rounded-full bg-white text-graphite shadow-2xl duration-700 delay-75 group-hover:translate-y-0"
            aria-label="Add to wishlist"
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
            {product.price}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-grow bg-black/[0.06]" />

          <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.4em] text-graphite/20">
            Neural Curated
          </span>

          <div className="h-px flex-grow bg-black/[0.06]" />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleWishlistClick}
          className="group/btn w-full rounded-none py-4 transition-all duration-700 hover:bg-graphite hover:text-white"
        >
          {isWishlisted ? "Added to Collection" : "Add to Collection"}

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