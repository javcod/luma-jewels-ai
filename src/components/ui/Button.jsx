import React from "react";
import { motion } from "motion/react";
import { cn } from "../../utils/cn";

const Button = React.forwardRef(({ className, variant = "primary", size = "md", children, ...props }, ref) => {
  const variants = {
    primary: "bg-graphite text-ivory",
    outline: "bg-transparent border border-graphite/20 text-graphite hover:border-graphite/40",
    ghost: "bg-transparent text-graphite hover:bg-champagne/20",
    champagne: "bg-champagne text-graphite hover:bg-[#F0D8B2]",
  };

  const sizes = {
    sm: "px-5 py-2 text-[10px] tracking-[0.15em]",
    md: "px-7 py-3 text-xs tracking-[0.2em]",
    lg: "px-10 py-4 text-sm tracking-[0.25em]",
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      className={cn(
        "inline-flex items-center justify-center font-sans font-medium transition-all duration-500 disabled:opacity-50 disabled:pointer-events-none uppercase",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
});

Button.displayName = "Button";

export { Button };
