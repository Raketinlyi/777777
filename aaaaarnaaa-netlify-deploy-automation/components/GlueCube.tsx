import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface GlueCubeProps {
  delay?: number; // seconds before appearance
  className?: string;
}

export function GlueCube({ delay = 0, className = '' }: GlueCubeProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);

  // Get phrases from translations
  const phrases = t('glueCube.phrases', { returnObjects: true }) as string[];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  // Switch phrases every 2.5 seconds
  useEffect(() => {
    if (!visible || phrases.length === 0) return;
    const id = setInterval(
      () => setPhraseIdx(i => (i + 1) % phrases.length),
      2500
    );
    return () => clearInterval(id);
  }, [visible, phrases.length]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: '-160px' }}
          animate={{ x: 'calc(100vw - 160px)' }}
          transition={{
            duration: 25,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className={`fixed bottom-0 left-0 select-none pointer-events-none ${className}`}
          style={{ width: '12rem', height: '12rem' }}
        >
          {/* wrapper to keep relative positioning */}
          <div className='relative' style={{ width: '12rem', height: '12rem' }}>
            {/* Cube image */}
            <img
              src='/images/skot.png'
              alt='Glue cube'
              className='w-full h-full'
            />

            {/* Speech bubble */}
            <motion.div
              key={phraseIdx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className='absolute left-full bottom-10 ml-4 bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm font-semibold max-w-xs'
            >
              {phrases && phrases[phraseIdx]
                ? phrases[phraseIdx]
                : 'Loading...'}
              <span className='absolute -left-2 bottom-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent' />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
