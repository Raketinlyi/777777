
import React from 'react';
import { motion } from 'framer-motion';

interface NeonTitleProps {
  title: string;
  className?: string;
}

const NeonTitle: React.FC<NeonTitleProps> = ({ title, className }) => {
  return (
    <div className="relative">
      <h2 className={`font-bold text-2xl text-white drop-shadow-[0_0_5px_#fff,0_0_10px_#fff,0_0_20px_#ff00ff,0_0_30px_#ff00ff,0_0_40px_#ff00ff,0_0_50px_#ff00ff] ${className}`}>
        {title}
      </h2>
      {/* Sparks effect for neon titles */}
      <div className='absolute inset-0 pointer-events-none overflow-hidden'>
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`title-spark-${i}`}
            className='absolute w-0.5 h-0.5 bg-fuchsia-300 rounded-full'
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              x: [0, (Math.random() - 0.5) * 20],
              y: [0, (Math.random() - 0.5) * 20],
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeOut'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NeonTitle;
