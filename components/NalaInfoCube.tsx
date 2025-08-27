import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Shows cute Nala cube once per 24h per wallet in Info page
export default function NalaInfoCube() {
  const { address } = useAccount();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!address) return;
    const key = `nala-last-${address}`;
    const lastStr = localStorage.getItem(key);
    const now = Date.now();
    if (!lastStr || now - parseInt(lastStr) > 86_400_000) {
      setVisible(true);
      localStorage.setItem(key, now.toString());
      // auto hide after 12 seconds
      setTimeout(() => setVisible(false), 12000);
    }
  }, [address]);

  const phrases = t('info.nalaPhrases', { returnObjects: true }) as string[];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)] || '';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: '100vw', y: 0, opacity: 0 }}
          animate={{ x: '-160px', opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 15, ease: 'linear' }}
          className='fixed bottom-0 z-50 select-none pointer-events-none'
        >
          <div className='relative w-[160px] h-[160px]'>
            <Image src='/images/nala1.png' alt='Nala' fill priority />
            {/* bubble appears after 2s and hides after 10s */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { delay: 2 } }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
              className='absolute -top-4 left-1/2 -translate-x-1/2'
            >
              <div className='bg-white text-black px-3 py-2 rounded-lg shadow max-w-[220px] text-center text-sm font-semibold break-words whitespace-pre-line relative'>
                {phrase}
                <span className='absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-white rotate-45'></span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
