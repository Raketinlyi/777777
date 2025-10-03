import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, TargetAndTransition } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const cubeImgs = [
  '/images/d1.png',
  '/images/d2.png',
  '/images/d3.png',
  '/images/d4.png',
  '/images/d5.png',
];

// Move phrase arrays outside component to prevent recreation
const idlePhrases = [
  'What are you doing here?',
  "Who's making noise?",
  'Oh-oh-oh...',
  "I'm not looking!",
  "Don't disturb my sleep!",
];

const successPhrases = [
  'Congrats on your new cube!',
  'Hooray, a new cube baby!',
  'Welcome, little one!',
];

type Phase = 'idle' | 'breeding' | 'success';

interface CubeObserversProps {
  selectionCount: number; // 0,1,2
  phase: Phase; // state of breeding
}

interface Observer {
  img: string;
  phrase: string;
  id: string;
  dir: 'left' | 'right' | 'top' | 'bottom'; // side where cube appears
  pos: number; // percentage along perpendicular axis
}

export default function CubeObservers({
  selectionCount,
  phase,
}: CubeObserversProps) {
  const { t } = useTranslation();
  const [observers, setObservers] = useState<Observer[]>([]);

  // Get phrases from translations – memoized so reference is stable between renders
  const { i18n } = useTranslation();
  const idlePhrases = useMemo(() => {
    return t('cubeObservers.idlePhrases', { returnObjects: true }) as string[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.resolvedLanguage]);

  const successPhrases = useMemo(() => {
    return t('cubeObservers.successPhrases', {
      returnObjects: true,
    }) as string[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.resolvedLanguage]);

  // regenerate observers whenever selection count changes (1 or 2) or phase resets to idle
  useEffect(() => {
    if (selectionCount === 0) {
      setObservers([]);
      return;
    }
    if (!idlePhrases || idlePhrases.length === 0) return; // Wait for translations to load

    // number of walkers: 1-3 (slightly calmer)
    const cnt = 1 + Math.floor(Math.random() * 3);
    const sides: Observer['dir'][] = ['left', 'right', 'bottom', 'top'];
    const arr: Observer[] = Array.from({ length: cnt }).map((_, i) => {
      const dir = sides[Math.floor(Math.random() * sides.length)]!;
      return {
        img: cubeImgs[Math.floor(Math.random() * cubeImgs.length)]!,
        phrase: idlePhrases[Math.floor(Math.random() * idlePhrases.length)]!,
        id: `${Date.now()}-${i}`,
        dir,
        pos: Math.random() * 90 + 5, // 5%..95%
      };
    });
    setObservers(arr);
  }, [selectionCount, idlePhrases]);

  // on success – update phrases & after few seconds clear
  useEffect(() => {
    if (
      phase !== 'success' ||
      observers.length === 0 ||
      !successPhrases ||
      successPhrases.length === 0
    )
      return;
    setObservers(prev =>
      prev.map(o => ({
        ...o,
        phrase:
          successPhrases[Math.floor(Math.random() * successPhrases.length)] ||
          'Congrats on your new cube!',
      }))
    );
    const timer = setTimeout(() => setObservers([]), 4000);
    return () => clearTimeout(timer);
  }, [phase, observers.length, successPhrases]);

  if (selectionCount === 0 && phase !== 'success') return null;

  return (
    <div className='pointer-events-none select-none fixed bottom-0 left-0 w-full z-40 overflow-visible'>
      {/* Removed test indicator */}
      <AnimatePresence>
        {observers.map((c, idx) => {
          // starting position based on side
          const start: TargetAndTransition =
            c.dir === 'left'
              ? { x: -200, y: `${c.pos}vh`, opacity: 0 }
              : c.dir === 'right'
                ? { x: 200, y: `${c.pos}vh`, opacity: 0 }
                : c.dir === 'top'
                  ? { y: -200, x: `${c.pos}vw`, opacity: 0 }
                  : { y: 200, x: `${c.pos}vw`, opacity: 0 }; // bottom

          return (
            <motion.div
              key={c.id}
              initial={start}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.5, delay: idx * 0.25 }}
              className='relative inline-block'
              style={{ pointerEvents: 'none' }}
            >
              {/* Walker */}
              <img
                src={c.img}
                alt='cube observer'
                className='w-48 h-48 drop-shadow-xl'
              />

              {/* Speech bubble */}
              <motion.div
                key={phase + c.phrase}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1 + idx * 0.3 }}
                className='absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white/90 text-gray-900 rounded px-3 py-2 text-sm font-semibold shadow whitespace-normal break-words max-w-[220px] text-center'
              >
                {c.phrase}
                <span className='absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-8 border-b-white/90 border-x-transparent border-t-transparent' />
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
