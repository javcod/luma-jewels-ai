import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function WishlistToast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.94 }}
          className="fixed bottom-6 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full border border-amber-200/30 bg-[#120b07]/95 px-6 py-4 text-sm text-amber-100 shadow-2xl backdrop-blur-xl"
        >
          <Heart size={18} className="fill-amber-200 text-amber-200" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}