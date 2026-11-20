import { AnimatePresence, motion } from "motion/react";
import { Heart, X } from "lucide-react";

// Slide-in panel listing wishlist items (client-side only).
const WishlistPanel = ({ isOpen, onClose, items, onRemove, onProductClick }) => {
  const hasItems = items.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="luma-wishlist-heading"
          className="fixed inset-x-4 bottom-4 top-24 z-[998] flex flex-col overflow-hidden rounded-[1.5rem] border border-graphite/10 bg-white shadow-2xl sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:h-[min(600px,80vh)] sm:w-[400px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-graphite/10 bg-ivory px-6 py-5">
            <div>
              <div className="flex items-center gap-2 text-champagne-800">
                <Heart size={16} strokeWidth={1.5} />
                <h2
                  id="luma-wishlist-heading"
                  className="font-serif text-lg tracking-tight text-graphite"
                >
                  Your Wishlist
                </h2>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-graphite/40">
                {hasItems ? `${items.length} saved piece${items.length === 1 ? "" : "s"}` : "Saved on this device"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close wishlist"
              className="rounded-full p-2 text-graphite/50 transition-colors duration-300 hover:bg-graphite/5 hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {!hasItems && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-champagne/10 text-champagne-800 ring-1 ring-champagne/20">
                  <Heart size={20} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl italic text-graphite">Nothing saved yet</h3>
                <p className="mt-2 max-w-[240px] text-sm leading-6 text-graphite/60">
                  Tap the heart on any piece you love to save it here. It stays saved on this device.
                </p>
              </div>
            )}

            {hasItems && (
              <div className="flex flex-col gap-3">
                {items.map((product) => (
                  <div
                    key={product.id}
                    className="group flex items-center gap-3 border border-graphite/10 bg-white p-3 transition-colors duration-300 hover:border-champagne/40 hover:bg-champagne/5"
                  >
                    <button
                      type="button"
                      onClick={() => onProductClick?.(product)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden bg-champagne/5">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
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
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(product.id)}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="shrink-0 rounded-full p-2 text-graphite/40 transition-colors duration-300 hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50"
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { WishlistPanel };
