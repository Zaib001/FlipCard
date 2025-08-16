export const cardVariants = {
  initial: { y: 14, opacity: 0 },
  in: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 18 } },
  hover: { scale: 1.02, boxShadow: "0 0 32px rgba(99,102,241,.35)" },
};

export const coinVariants = {
  start: { rotateX: 0 },
  flip: (turns=3) => ({
    rotateX: 360 * turns,
    transition: { duration: 0.8, ease: "easeInOut" }
  }),
};

export const pulseAccent = {
  animate: {
    boxShadow: ["0 0 0 rgba(0,0,0,0)", "0 0 16px rgba(99,102,241,.45)", "0 0 0 rgba(0,0,0,0)"],
    transition: { duration: 1.6, repeat: Infinity }
  }
};
