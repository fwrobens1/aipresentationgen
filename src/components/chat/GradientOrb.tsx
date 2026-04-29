import { motion } from 'framer-motion';

export function GradientOrb() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-6">
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 via-accent/40 to-primary/20 blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-2 rounded-full bg-gradient-to-tr from-primary/70 via-accent/50 to-primary/30 blur-md"
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary via-accent to-primary opacity-80" />
    </div>
  );
}
