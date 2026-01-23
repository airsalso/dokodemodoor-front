"use client";

import { motion } from "framer-motion";

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <motion.svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        initial="initial"
        whileHover="hover"
      >
        {/* Glow Effect */}
        <defs>
          <filter id="door-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Frame (The everywhere door is pink!) */}
        <rect
          x="20"
          y="15"
          width="60"
          height="75"
          rx="4"
          stroke="#FF79C6"
          strokeWidth="6"
          className="drop-shadow-[0_0_8px_rgba(255,121,198,0.5)]"
        />

        {/* Portal Background (Inside the door) */}
        <rect
          x="26"
          y="21"
          width="48"
          height="63"
          fill="#1a1b26"
        />

        {/* AI Portal Glow / Effect */}
        <motion.ellipse
          cx="50"
          cy="52"
          rx="15"
          ry="25"
          fill="url(#portal-gradient)"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* The Door Leaf (Slightly Open) */}
        <motion.path
          d="M74 21L26 21V84L74 84V21Z"
          fill="#FF79C6"
          stroke="#FF79C6"
          strokeWidth="2"
          variants={{
            initial: { rotateY: 0, originX: "0%" },
            hover: { rotateY: -45, originX: "0%" }
          }}
          transition={{ type: "spring", stiffness: 100 }}
          style={{ transformOrigin: "26px" }}
        />

        {/* Golden Doorknob */}
        <motion.circle
          cx="65"
          cy="55"
          r="4"
          fill="#F1FA8C"
          variants={{
            initial: { x: 0 },
            hover: { x: -5 }
          }}
        />

        <defs>
          <radialGradient id="portal-gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 52) rotate(90) scale(40 25)">
            <stop stopColor="#8BE9FD" />
            <stop offset="1" stopColor="#8BE9FD" stopOpacity="0" />
          </radialGradient>
        </defs>
      </motion.svg>
    </div>
  );
}
