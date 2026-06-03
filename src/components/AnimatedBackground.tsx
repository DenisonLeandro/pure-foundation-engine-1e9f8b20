import { motion } from "framer-motion";

/**
 * Animated background with floating orbs, grid, particles, and aurora effect.
 * Used on auth pages (login, signup, forgot password) and setup.
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#09090b]">
      {/* Base gradient with entrance */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-violet-950/90 via-[#09090b] to-fuchsia-950/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Grid pattern — fades in */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.06 }}
        transition={{ duration: 2, delay: 0.3 }}
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.4) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Aurora / ribbon — large, visible, slow rotation */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "-40%",
          left: "-20%",
          width: "140%",
          height: "180%",
          background:
            "conic-gradient(from 200deg at 50% 50%, rgba(139,92,246,0) 0deg, rgba(139,92,246,0.25) 50deg, rgba(217,70,239,0.2) 100deg, rgba(139,92,246,0) 150deg, rgba(217,70,239,0.22) 220deg, rgba(139,92,246,0.18) 290deg, rgba(139,92,246,0) 360deg)",
          filter: "blur(60px)",
        }}
        initial={{ opacity: 0, rotate: -30 }}
        animate={{ opacity: 0.4, rotate: 330 }}
        transition={{
          opacity: { duration: 2, ease: "easeOut" },
          rotate: { duration: 80, repeat: Infinity, ease: "linear" },
        }}
      />

      {/* Primary orb — top left, entrance from outside */}
      <motion.div
        className="absolute h-[600px] w-[600px] rounded-full bg-violet-600/30 blur-[100px]"
        initial={{ x: -300, y: -300, opacity: 0, scale: 0.5 }}
        animate={{
          x: [-80, 40, -80],
          y: [-60, 20, -60],
          opacity: 1,
          scale: [1, 1.15, 1],
        }}
        transition={{
          x: { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 },
          y: { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 },
          scale: { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 },
          opacity: { duration: 1.5, ease: "easeOut" },
        }}
        style={{ top: "-10%", left: "-10%" }}
      />

      {/* Secondary orb — bottom right, entrance from outside */}
      <motion.div
        className="absolute h-[500px] w-[500px] rounded-full bg-fuchsia-600/30 blur-[90px]"
        initial={{ x: 300, y: 300, opacity: 0, scale: 0.5 }}
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          opacity: 1,
          scale: [1, 1.2, 1],
        }}
        transition={{
          x: { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
          y: { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
          scale: { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
          opacity: { duration: 1.5, ease: "easeOut", delay: 0.3 },
        }}
        style={{ bottom: "-8%", right: "-8%" }}
      />

      {/* Center pulse orb — scales in */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[80px]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          scale: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
          opacity: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
        }}
      />

      {/* Accent orb — upper right */}
      <motion.div
        className="absolute h-[250px] w-[250px] rounded-full blur-[80px]"
        style={{
          top: "15%",
          right: "15%",
          background: "radial-gradient(circle, rgba(217,70,239,0.3) 0%, transparent 70%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.6, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 50, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Floating particles — staggered entrance */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${8 + i * 9}%`,
            left: `${5 + i * 9}%`,
            width: i % 3 === 0 ? 4 : 2,
            height: i % 3 === 0 ? 4 : 2,
            background:
              i % 2 === 0
                ? "rgba(139,92,246,0.6)"
                : "rgba(217,70,239,0.5)",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            y: [0, -(25 + i * 6), 0],
            x: [0, 12 + i * 4, 0],
            opacity: [0, 1, 0],
            scale: 1,
          }}
          transition={{
            y: { duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 + i * 0.3 },
            x: { duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 + i * 0.3 },
            opacity: { duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 + i * 0.3 },
            scale: { duration: 0.5, delay: 1 + i * 0.15 },
          }}
        />
      ))}

      {/* Diagonal light streaks — slide in */}
      <motion.div
        className="absolute top-0 left-1/4 h-[200vh] w-[2px] bg-gradient-to-b from-transparent via-violet-500/20 to-transparent rotate-[25deg]"
        initial={{ opacity: 0, y: -200 }}
        animate={{
          opacity: [0, 0.7, 0],
          y: 0,
        }}
        transition={{
          opacity: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
          y: { duration: 1, ease: "easeOut" },
        }}
      />
      <motion.div
        className="absolute top-0 right-1/3 h-[200vh] w-[2px] bg-gradient-to-b from-transparent via-fuchsia-500/20 to-transparent rotate-[25deg]"
        initial={{ opacity: 0, y: -200 }}
        animate={{
          opacity: [0, 0.6, 0],
          y: 0,
        }}
        transition={{
          opacity: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 },
          y: { duration: 1.2, ease: "easeOut", delay: 0.5 },
        }}
      />
      <motion.div
        className="absolute top-0 left-2/3 h-[200vh] w-px bg-gradient-to-b from-transparent via-violet-400/15 to-transparent rotate-[-20deg]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Vignette */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      />
    </div>
  );
}
