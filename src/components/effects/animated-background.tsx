"use client";

import { motion } from "framer-motion";

// Fixed, pointer-events-none decorative layer behind all page content: a
// faint grid plus a few large blurred brand-color orbs drifting slowly.
// Renders once in the root layout so every page gets it.
export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "clamp(2rem,5vw,3rem) clamp(2rem,5vw,3rem)",
        }}
      />
      <motion.div
        className="absolute size-[clamp(16rem,50vw,32rem)] rounded-full bg-primary/25 blur-3xl dark:bg-primary/15"
        style={{ top: "-15%", left: "-10%" }}
        animate={{ x: ["0%", "25%", "0%"], y: ["0%", "20%", "0%"] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute size-[clamp(14rem,40vw,28rem)] rounded-full bg-primary/15 blur-3xl dark:bg-primary/10"
        style={{ bottom: "-15%", right: "-8%" }}
        animate={{ x: ["0%", "-20%", "0%"], y: ["0%", "-15%", "0%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute size-[clamp(10rem,25vw,18rem)] rounded-full bg-primary/10 blur-3xl dark:bg-primary/10"
        style={{ top: "40%", left: "50%" }}
        animate={{ x: ["-50%", "-30%", "-50%"], y: ["-50%", "-65%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
