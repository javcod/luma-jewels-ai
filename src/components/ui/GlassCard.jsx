import React from "react";
import { motion } from "motion/react";
import { cn } from "../../utils/cn";

const GlassCard = React.forwardRef(({ className, children, hover = true, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={hover ? { y: -5, shadow: "0 20px 40px rgba(0,0,0,0.1)" } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn("glass p-6 md:p-8 relative overflow-hidden", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = "GlassCard";

export { GlassCard };
