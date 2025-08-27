'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Music, VolumeX, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import React from 'react';

// Optimize the SpeechBubble component to use memo for better performance
const SpeechBubble = React.memo(function SpeechBubble({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* The arrow points upward since the bubble will now be at the bottom */}
      <div className='absolute w-4 h-4 bg-white rotate-45 top-[-8px] left-1/2 transform -translate-x-1/2'></div>
      {/*
        • max-w-[80vw] — on mobile devices, the bubble expands to a maximum of 80% of the screen width,
          so long phrases do not go beyond the window.
        • sm:max-w-[220px] — on desktops, the limit remains the same.
        • break-words — break long words.
      */}
      <div className='bg-white text-black px-4 py-3 rounded-xl shadow-md min-w-[120px] max-w-[80vw] sm:max-w-[220px] break-words z-10 relative'>
        <p className='text-center text-sm font-medium whitespace-pre-line'>
          {text}
        </p>
      </div>
    </div>
  );
});

// Optimize MusicTrack type
type MusicTrack = {
  id: string;
  name: string;
  url: string;
  theme: 'party' | 'retro' | 'chill' | 'dance';
  color: string;
  cubeIndices: number[]; // Cube indices for this track
};

// Enable audio - user confirmed that links are working
const AUDIO_DISABLED = false;

const musicTracks: MusicTrack[] = [
  {
    id: 'track1',
    name: 'Space Walk',
    url: '/myzzzz/678.mp3',
    theme: 'party',
    color: 'blue',
    cubeIndices: [0, 4, 7],
  },
  {
    id: 'track2',
    name: 'Deep Bass',
    url: '/myzzzz/890.mp3',
    theme: 'retro',
    color: 'purple',
    cubeIndices: [0, 2, 6],
  },
  {
    id: 'track3',
    name: 'Neon Flux',
    url: '/myzzzz/zzz55.mp3',
    theme: 'chill',
    color: 'green',
    cubeIndices: [0, 5, 8],
  },
  {
    id: 'track4',
    name: 'Retro Wave',
    url: '/myzzzz/456-1.mp3',
    theme: 'dance',
    color: 'pink',
    cubeIndices: [0, 3, 7],
  },
];

// Optimize animation theme functions by moving them outside the component
const getAnimationForTheme = (theme: string) => {
  switch (theme) {
    case 'party':
      return {
        y: [0, -15, 0],
        scale: [1, 1.05, 1],
      };
    case 'retro':
      return {
        y: [0, -10, 0],
        scale: [1, 1.1, 0.95, 1],
      };
    case 'chill':
      return {
        y: [0, -5, 0],
        scale: [1, 1.03, 1],
      };
    case 'dance':
      return {
        y: [0, -20, -5, -15, 0],
        scale: [1, 1.08, 1.02, 1.05, 1],
      };
    default:
      return {
        y: [0, -15, 0],
        scale: [1, 1.05, 1],
      };
  }
};

const getBackgroundForTheme = (theme: string) => {
  switch (theme) {
    case 'party':
      return 'bg-blue-500/30';
    case 'retro':
      return 'bg-purple-500/30';
    case 'chill':
      return 'bg-green-500/30';
    case 'dance':
      return 'bg-pink-500/30';
    default:
      return 'bg-blue-500/30';
  }
};

// Create a memoized music notes array
const musicNotes = ['♩', '♪', '♫', '♬', '🎵', '🎶'];

// Updated array of cube images with new pictures
const cubeImages = [
  '/images/cube1.png', // 0: Blue sad cube (main)
  '/images/cube2.png', // 1
  '/images/cube3.png', // 2
  '/images/cube4.png', // 3
  '/images/party-cube.png', // 4
  '/images/cube5.png', // 5: Pink cube with spikes
  '/images/cube6.png', // 6: Red cube with party hat
  '/images/cube7.png', // 7: Purple cube with coins
  '/images/cube8.png', // 8: Orange cube with white hat
];

type CubeAnimationProps = {
  desktopScale?: number; // scale factor for desktop sizes
};

export function CubeAnimation({ desktopScale = 1 }: CubeAnimationProps) {
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cubesLeft, setCubesLeft] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
  ]);
  const [showSpeechBubbles, setShowSpeechBubbles] = useState(false);
  const [showLastCubeBubble, setShowLastCubeBubble] = useState(false);
  const [partyMode, setPartyMode] = useState(false);
  const [showMusicButton, setShowMusicButton] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showBoombox, setShowBoombox] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [currentPartyPhrase, setCurrentPartyPhrase] = useState(0);
  const [showPartyPhrase, setShowPartyPhrase] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const partyPhraseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayPromiseRef = useRef<Promise<void> | null>(null);

  // New states for music waiting phrases
  const [waitingForMusicPhraseIndex, setWaitingForMusicPhraseIndex] =
    useState(0);
  const [showWaitingForMusicPhrase, setShowWaitingForMusicPhrase] =
    useState(false);
  const waitingPhraseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isMobile = useMobile();
  const { t, i18n } = useTranslation();

  // Function to get unique random cube indices
  const getUniqueRandomCubeIndices = useCallback(
    (count: number, excludeIndex?: number) => {
      const indices: number[] = [];
      const availableIndices = [...Array(cubeImages.length).keys()].filter(
        i => i !== excludeIndex
      );

      while (indices.length < count && availableIndices.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        const selectedIndex = availableIndices[randomIndex];
        if (selectedIndex !== undefined) {
          indices.push(selectedIndex);
        }
        // Remove the selected index from available ones
        availableIndices.splice(randomIndex, 1);
      }

      return indices;
    },
    []
  );

  //
  // State for storing cube indices
  const [initialCubeIndices, setInitialCubeIndices] = useState<number[]>([]);

  // Initialize cube indices on load
  useEffect(() => {
    if (isClient) {
      // Select 4 random unique cubes for initial animation
      const initialIndices = getUniqueRandomCubeIndices(4);
      // Add a fixed cube for the last one (blue sad cube)
      initialIndices.push(0); // Index 0 is the blue sad cube
      setInitialCubeIndices(initialIndices);

      // Set the first track as default
      setCurrentTrack(musicTracks[0] || null);
    }
  }, [isClient, getUniqueRandomCubeIndices]);

  // Function for safe audio playback
  const safePlayAudio = useCallback(() => {
    if (AUDIO_DISABLED || !audioRef.current) return Promise.resolve();

    // If there's already an active playback promise, return it
    if (audioPlayPromiseRef.current) {
      return audioPlayPromiseRef.current;
    }

    // Create a new playback promise
    const playPromise = audioRef.current.play();

    // Save the promise in ref
    audioPlayPromiseRef.current = playPromise
      .then(() => {
        setIsMusicPlaying(true);
        setShowBoombox(true);
        // Clear ref after successful execution
        audioPlayPromiseRef.current = null;
      })
      .catch(() => {
        setIsMusicPlaying(false);
        setShowBoombox(false);
        // Clear ref after error
        audioPlayPromiseRef.current = null;
      });

    return audioPlayPromiseRef.current;
  }, []);

  // Function for safe audio stopping
  const safePauseAudio = useCallback(() => {
    if (AUDIO_DISABLED || !audioRef.current) return;

    // If there's an active playback promise, wait for it to complete before pausing
    if (audioPlayPromiseRef.current) {
      audioPlayPromiseRef.current
        .then(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsMusicPlaying(false);
            setShowBoombox(false);
          }
        })
        .catch(() => {
          // If the promise completed with an error, still try to pause
          if (audioRef.current) {
            audioRef.current.pause();
            setIsMusicPlaying(false);
            setShowBoombox(false);
          }
        });
    } else {
      // If there's no active promise, just pause
      audioRef.current.pause();
      setIsMusicPlaying(false);
      setShowBoombox(false);
    }
  }, []);

  // Optimize toggle music function with useCallback
  const toggleMusic = useCallback(() => {
    if (AUDIO_DISABLED || !audioRef.current) return;

    if (audioRef.current.paused) {
      safePlayAudio();
    } else {
      safePauseAudio();
    }
  }, [safePlayAudio, safePauseAudio]);

  // Optimize select track function with useCallback
  const selectTrack = useCallback(
    (track: MusicTrack) => {
      // Remember if music was playing before changing the track
      const wasPlaying = audioRef.current && !audioRef.current.paused;

      // If audio is already playing, stop it first
      if (wasPlaying && audioRef.current) {
        safePauseAudio();
      }

      // Set the new track
      setCurrentTrack(track);

      // Update the audio URL
      if (audioRef.current) {
        audioRef.current.src = track.url;
        // Force browser to re-evaluate sources for reliability
        audioRef.current.load();

        // If music was already playing, continue playback with the new track
        if (wasPlaying) {
          // Use setTimeout to give the browser time to process the src change
          setTimeout(() => {
            safePlayAudio();
          }, 300); // Increase delay for reliability
        }
      }
    },
    [safePauseAudio, safePlayAudio]
  );

  // Reload audio when track changes (covers initial set and non-manual src updates)
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
    }
  }, [currentTrack]);

  // Function for cycling through music waiting phrases
  const startWaitingForMusicPhrasesCycle = useCallback(() => {
    // Clear previous timer if it exists
    if (waitingPhraseTimerRef.current) {
      clearTimeout(waitingPhraseTimerRef.current);
    }

    // Function to show the next phrase
    const showNextWaitingPhrase = () => {
      // Get music waiting phrases from translations
      const waitingPhrases = t('cubeAnimation.waitingForMusicPhrases', {
        returnObjects: true,
      }) as string[];
      if (!waitingPhrases || waitingPhrases.length === 0) return;

      // Show the next phrase in order
      setWaitingForMusicPhraseIndex(prev => (prev + 1) % waitingPhrases.length);
      setShowWaitingForMusicPhrase(true);

      // Schedule showing the next phrase in 5 seconds
      waitingPhraseTimerRef.current = setTimeout(showNextWaitingPhrase, 5000);
    };

    // Show the first phrase
    setWaitingForMusicPhraseIndex(0);
    setShowWaitingForMusicPhrase(true);

    // Schedule showing the next phrase
    waitingPhraseTimerRef.current = setTimeout(showNextWaitingPhrase, 5000);
  }, [t, i18n.language]);

  // Optimize startPartyPhrasesCycle with useCallback
  const startPartyPhrasesCycle = useCallback(() => {
    // Clear previous timer if it exists
    if (partyPhraseTimerRef.current) {
      clearTimeout(partyPhraseTimerRef.current);
    }

    // Function to show the next phrase
    const showNextPhrase = () => {
      // Get party phrases from translations
      const partyPhrases = t('cubeAnimation.partyPhrases', {
        returnObjects: true,
      }) as string[];

      // Show a random phrase
      setCurrentPartyPhrase(Math.floor(Math.random() * partyPhrases.length));
      setShowPartyPhrase(true);

      // Schedule showing the next phrase after a random interval (4-6 seconds)
      const nextPhraseDelay = 4000 + Math.random() * 2000;
      partyPhraseTimerRef.current = setTimeout(showNextPhrase, nextPhraseDelay);
    };

    // Start the cycle
    showNextPhrase();
  }, [t, i18n.language]);

  // Initialize client state
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animation sequence - UPDATED LOGIC
  useEffect(() => {
    if (!isClient || initialCubeIndices.length === 0) return;

    // Phase 0: Cubes stand still for 4 seconds
    const phase1Timer = setTimeout(() => {
      setAnimationPhase(1);
      setShowSpeechBubbles(true);

      // Phase 1: Cubes talk for 2 seconds
      const phase2Timer = setTimeout(() => {
        setAnimationPhase(2);
        setShowSpeechBubbles(false);

        // Start removing cubes one by one
        const disappearTimers: NodeJS.Timeout[] = [];

        // Remove cubes with delay
        for (let i = 0; i < 4; i++) {
          disappearTimers.push(
            setTimeout(() => {
              setCubesLeft(prev => {
                const newState = [...prev];
                newState[i] = false;
                return newState;
              });
            }, i * 600) // Every 600ms one cube disappears
          );
        }

        // Phase 2: Cubes disappear, the last one stands
        const phase3Timer = setTimeout(() => {
          setAnimationPhase(3);
          // Blue cube asks "where is everyone?"
          setShowLastCubeBubble(true);

          // Phase 3: The last cube talks for 4 seconds
          const phase4Timer = setTimeout(() => {
            setAnimationPhase(4);
            setShowLastCubeBubble(false);

            // Phase 4: Show the music button and start the waiting phrases cycle
            const phase5Timer = setTimeout(() => {
              setAnimationPhase(5);
              setShowMusicButton(true);

              // Start the music waiting phrases cycle
              startWaitingForMusicPhrasesCycle();
            }, 1000);

            return () => clearTimeout(phase5Timer);
          }, 4000);

          return () => clearTimeout(phase4Timer);
        }, 3000);

        return () => {
          clearTimeout(phase3Timer);
          disappearTimers.forEach(timer => clearTimeout(timer));
        };
      }, 2000);

      return () => clearTimeout(phase2Timer);
    }, 4000);

    return () => clearTimeout(phase1Timer);
  }, [isClient, startWaitingForMusicPhrasesCycle, initialCubeIndices]);

  // Effect for transitioning to party mode when music is turned on
  const [showPartyBubble, setShowPartyBubble] = useState(false);
  useEffect(() => {
    if (isMusicPlaying && !partyMode) {
      // Stop the waiting phrases cycle
      if (waitingPhraseTimerRef.current) {
        clearTimeout(waitingPhraseTimerRef.current);
      }
      setShowWaitingForMusicPhrase(false);

      // Transition to party mode
      setPartyMode(true);

      // Show the initial party bubble
      setShowPartyBubble(true);

      // After 3 seconds, hide the initial bubble and start the party phrases cycle
      setTimeout(() => {
        setShowPartyBubble(false);
        startPartyPhrasesCycle();
      }, 3000);
    }
  }, [isMusicPlaying, partyMode, startPartyPhrasesCycle]);

  // Effect for updating phrases when language changes
  useEffect(() => {
    // Force refresh all translations when language changes
    // Force re-render by updating state
    setShowSpeechBubbles(prev => prev);
    setShowLastCubeBubble(prev => prev);
    setShowPartyPhrase(prev => prev);
    setShowWaitingForMusicPhrase(prev => prev);

    // If we're in party mode and showing a phrase, update it when language changes
    if (partyMode && showPartyPhrase) {
      // Get party phrases from translations
      const partyPhrases = t('cubeAnimation.partyPhrases', {
        returnObjects: true,
      }) as string[];
      // Update the current phrase, keeping its index within the array bounds
      setCurrentPartyPhrase(prev => prev % partyPhrases.length);
    }

    // If we're showing a music waiting phrase, update it when language changes
    if (showWaitingForMusicPhrase && !partyMode) {
      // Get music waiting phrases from translations
      const waitingPhrases = t('cubeAnimation.waitingForMusicPhrases', {
        returnObjects: true,
      }) as string[];
      if (waitingPhrases && waitingPhrases.length > 0) {
        // Update the current phrase, keeping its index within the array bounds
        setWaitingForMusicPhraseIndex(prev => prev % waitingPhrases.length);
      }
    }
  }, [i18n.language, partyMode, showPartyPhrase, showWaitingForMusicPhrase, t]);

  // Clear timers when unmounting
  useEffect(() => {
    return () => {
      if (partyPhraseTimerRef.current) {
        clearTimeout(partyPhraseTimerRef.current);
      }
      if (waitingPhraseTimerRef.current) {
        clearTimeout(waitingPhraseTimerRef.current);
      }
    };
  }, []);

  // Add error handling for audio loading
  useEffect(() => {
    if (audioRef.current) {
      const audioElement = audioRef.current;

      const handleError = (e: Event) => {
        setIsMusicPlaying(false);
        setShowBoombox(false);
        audioPlayPromiseRef.current = null;
      };

      // Add canplaythrough event handler for more reliable playback
      const handleCanPlay = () => {};

      audioElement.addEventListener('error', handleError);
      audioElement.addEventListener('canplaythrough', handleCanPlay);

      return () => {
        audioElement.removeEventListener('error', handleError);
        audioElement.removeEventListener('canplaythrough', handleCanPlay);
      };
    }
    return undefined;
  }, []);

  if (!isClient) {
    return <div className='h-[400px] w-full' />;
  }

  // Get all translations with dependency on language
  const speechBubbles = t('cubeAnimation.speechBubbles', {
    returnObjects: true,
  }) as string[];
  const partyBubble = t('cubeAnimation.partyBubble');
  const whereIsEveryone = t('cubeAnimation.whereIsEveryone');
  const partyPhrases = t('cubeAnimation.partyPhrases', {
    returnObjects: true,
  }) as string[];
  const waitingForMusicPhrases = t('cubeAnimation.waitingForMusicPhrases', {
    returnObjects: true,
  }) as string[];

  // Force re-render when language changes
  const languageKey = i18n.language;

  // Determine cube size - responsive + desktop scaling
  let cubeSize = isMobile ? 120 : Math.round(450 * Math.max(0.5, desktopScale));

  return (
    <motion.div
      key={languageKey} // Force re-render when language changes
      ref={containerRef}
      className={`relative w-full ${isMobile ? 'h-[40vh]' : 'h-[400px]'} flex items-center justify-center overflow-hidden`}
    >
      {/* Audio element with preload="auto" for preloading */}
      {!AUDIO_DISABLED && (
        <audio
          ref={audioRef}
          loop
          preload='metadata'
          onError={(error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : 'Audio error';
            // Удаляем console.error для production безопасности
            // console.error('Audio error:', errorMessage);
          }}
        >
          <source src={currentTrack?.url || musicTracks[0]?.url || ''} type='audio/mpeg' />
          <source src={currentTrack?.url || musicTracks[0]?.url || ''} type='audio/mp3' />
        </audio>
      )}

      {/* Button for selecting and playing music */}
      {showMusicButton && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='absolute top-4 right-4 z-30'
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size='sm'
                variant='outline'
                className='bg-black/50 border-cyan-500/50 text-cyan-300 hover:bg-black/70'
              >
                {isMusicPlaying ? (
                  <>
                    <VolumeX className='mr-2 h-4 w-4' />
                    {currentTrack?.name || t('cubeAnimation.musicOn')}
                  </>
                ) : (
                  <>
                    <Music className='mr-2 h-4 w-4' />
                    {t('cubeAnimation.musicOff')}
                  </>
                )}
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='bg-black/80 border-cyan-500/50 text-cyan-300'
            >
              {musicTracks.map(track => (
                <DropdownMenuItem
                  key={track.id}
                  onClick={() => {
                    selectTrack(track);
                  }}
                  className={`cursor-pointer ${currentTrack?.id === track.id ? 'bg-cyan-900/30' : ''}`}
                >
                  <Music className='mr-2 h-4 w-4' />
                  {track.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={toggleMusic}
                className='cursor-pointer border-t border-cyan-500/30 mt-1 pt-1'
              >
                {isMusicPlaying ? (
                  <>
                    <VolumeX className='mr-2 h-4 w-4' />
                    {t('cubeAnimation.musicOn')}
                  </>
                ) : (
                  <>
                    <Music className='mr-2 h-4 w-4' />
                    {t('cubeAnimation.musicOff')}
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      )}

      {/* Enhanced background effects */}
      <div className='absolute inset-0 overflow-hidden'>
        {/* Animated gradient background */}
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 30% 30%, rgba(34, 211, 238, 0.3) 0%, transparent 70%)',
              'radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
              'radial-gradient(circle at 30% 30%, rgba(34, 211, 238, 0.3) 0%, transparent 70%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'linear',
          }}
          className='absolute inset-0'
        />

        {/* Several glowing orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl'
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 7,
            repeat: Number.POSITIVE_INFINITY,
            delay: 1,
          }}
          className='absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl'
        />
      </div>

      {/* Musical notes that appear when music is turned on */}
      {isMusicPlaying && (
        <>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`note-${i}`}
              className='absolute text-2xl md:text-3xl font-bold z-20'
              initial={{
                opacity: 0,
                scale: 0,
                x: 0,
                y: 0,
                rotate: 0,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
                x: [0, (Math.random() - 0.5) * 300],
                y: [0, -150 - Math.random() * 150],
                rotate: [0, Math.random() * 360],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
                ease: 'easeOut',
              }}
              style={{
                left: `${50 + (Math.random() - 0.5) * 20}%`,
                bottom: '30%',
                color:
                  currentTrack?.theme === 'retro'
                    ? `hsl(${Math.floor(Math.random() * 60 + 270)}, 80%, 60%)` // Purple shades for retro
                    : currentTrack?.theme === 'chill'
                      ? `hsl(${Math.floor(Math.random() * 60 + 120)}, 80%, 60%)` // Green shades for chill
                      : currentTrack?.theme === 'dance'
                        ? `hsl(${Math.floor(Math.random() * 60 + 300)}, 80%, 60%)` // Pink shades for dance
                        : `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`, // All colors for party
                textShadow: '0 0 5px rgba(255,255,255,0.7)',
              }}
            >
              {musicNotes[Math.floor(Math.random() * musicNotes.length)]}
            </motion.div>
          ))}
        </>
      )}

      {/* Cube characters with enhanced effects */}
      <div className='relative flex flex-wrap items-center justify-center gap-6 md:gap-12 z-10'>
        {/* Display all cubes except the last one */}
        {cubesLeft.slice(0, 4).map(
          (isVisible, index) =>
            isVisible &&
            initialCubeIndices.length > index && (
              <motion.div
                key={`cube-${index}`}
                initial={{ opacity: 1, scale: 1 }}
                animate={
                  animationPhase >= 2
                    ? { opacity: 0, scale: 0, y: [0, -50] }
                    : { y: animationPhase >= 1 ? [0, -5, 0] : 0 }
                }
                transition={
                  animationPhase >= 2
                    ? { duration: 0.8, delay: index * 0.2 }
                    : {
                        duration: 1,
                        repeat:
                          animationPhase >= 1 ? Number.POSITIVE_INFINITY : 0,
                      }
                }
                className='relative group'
              >
                <div
                  className={'relative'}
                  style={{ width: `${cubeSize}px`, height: `${cubeSize}px` }}
                >
                  <Image
                    src={
                      cubeImages[initialCubeIndices[index] ?? 0] ??
                      '/placeholder.svg'
                    }
                    alt={`Cube Character ${index + 1}`}
                    width={cubeSize}
                    height={cubeSize}
                    className='object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transform transition-transform group-hover:scale-110'
                  />

                  {/* Speech bubble - moved below the cube */}
                  {showSpeechBubbles && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className='absolute bottom-[-60px] left-1/2 -translate-x-1/2 z-20'
                    >
                      <SpeechBubble
                        text={
                          speechBubbles && speechBubbles.length > 0
                            ? (speechBubbles[index % speechBubbles.length] ??
                              '')
                            : ''
                        }
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
        )}

        {/* Blue cube - now it always stays in place */}
        {initialCubeIndices.length > 4 && (
          <motion.div
            initial={{ opacity: 1, scale: 1, rotate: 0 }}
            animate={
              partyMode
                ? getAnimationForTheme(currentTrack?.theme || 'party')
                : { y: animationPhase >= 1 ? [0, -5, 0] : 0 }
            }
            transition={{
              y: {
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'reverse',
              },
              scale: {
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'reverse',
              },
            }}
            className='relative group'
          >
            <motion.div
              className={`absolute inset-0 rounded-full ${
                partyMode
                  ? getBackgroundForTheme(currentTrack?.theme || 'party')
                  : 'bg-blue-500/30'
              } blur-xl`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: 0.3,
              }}
            />
            <div
              className={'relative'}
              style={{ width: `${cubeSize}px`, height: `${cubeSize}px` }}
            >
              <Image
                src={
                  cubeImages[initialCubeIndices[4] ?? 0] ?? '/placeholder.svg'
                }
                alt='Blue Sad Pizza Cube'
                width={cubeSize}
                height={cubeSize}
                className='object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transform transition-transform group-hover:scale-110'
                priority={true}
              />

              {/* Speech bubble for the phrase "where is everyone?" */}
              {showLastCubeBubble && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className='absolute bottom-[-60px] left-1/2 -translate-x-1/2 z-20'
                >
                  <SpeechBubble text={whereIsEveryone || ''} />
                </motion.div>
              )}

              {/* Speech bubble for music waiting phrases */}
              {showWaitingForMusicPhrase &&
                !partyMode &&
                waitingForMusicPhrases &&
                waitingForMusicPhrases.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className='absolute bottom-[-60px] left-1/2 -translate-x-1/2 z-20'
                  >
                    <SpeechBubble
                      text={
                        waitingForMusicPhrases[
                          waitingForMusicPhraseIndex %
                            waitingForMusicPhrases.length
                        ] ?? ''
                      }
                    />
                  </motion.div>
                )}

              {/* Speech bubble for the party */}
              {partyMode && (
                <>
                  {/* Initial party bubble */}
                  {showPartyBubble && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      className='absolute bottom-[-60px] left-1/2 -translate-x-1/2 z-20'
                    >
                      <SpeechBubble text={partyBubble || ''} />
                    </motion.div>
                  )}

                  {/* Speech bubbles for party phrases */}
                  {showPartyPhrase && partyPhrases.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      className='absolute bottom-[-60px] left-1/2 -translate-x-1/2 z-20'
                    >
                      <SpeechBubble
                        text={
                          partyPhrases[
                            currentPartyPhrase % partyPhrases.length
                          ] ?? ''
                        }
                      />
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* */}
        {/* Additional cubes in party mode */}
        {partyMode && currentTrack && (
          <>
            {currentTrack.cubeIndices.slice(1).map((cubeIndex, index) => (
              <motion.div
                key={`party-cube-${index}`}
                initial={{ opacity: 1, scale: 1 }}
                animate={getAnimationForTheme(currentTrack.theme)}
                transition={{
                  y: {
                    duration: 0.8 + index * 0.1,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: 'reverse',
                  },
                  scale: {
                    duration: 0.8 + index * 0.1,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: 'reverse',
                  },
                }}
                className='relative group'
              >
                <motion.div
                  className={`absolute inset-0 rounded-full ${getBackgroundForTheme(currentTrack.theme)} blur-xl`}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 0.3,
                  }}
                />
                <div
                  className={'relative'}
                  style={{ width: `${cubeSize}px`, height: `${cubeSize}px` }}
                >
                  <Image
                    src={cubeImages[cubeIndex ?? 0] ?? '/placeholder.svg'}
                    alt={`Party Cube ${index + 1}`}
                    width={cubeSize}
                    height={cubeSize}
                    className='object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transform transition-transform group-hover:scale-110'
                    priority={true}
                  />
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* */}
      {/* Boombox that appears when music is turned on - IMPROVED MOBILE POSITIONING */}
      <AnimatePresence>
        {showBoombox && (
          <motion.div
            initial={{
              opacity: 0,
              y: 50,
              scale: 0,
              rotate: -20,
            }}
            animate={{
              opacity: 1,
              y: [50, 0],
              scale: [0, 1.2, 1],
              rotate: [-20, 10, 0],
            }}
            exit={{
              opacity: 0,
              y: 50,
              scale: 0,
              rotate: -20,
            }}
            transition={{
              duration: 0.8,
              ease: 'easeInOut',
            }}
            // Improved positioning for better mobile visibility
            // Moved higher up from bottom and increased z-index
            className={`absolute ${isMobile ? 'bottom-20 right-5' : 'bottom-5 right-10'} z-10`}
          >
            <motion.div
              animate={{
                rotate: [-5, 5, -5],
                y: [0, -5, 0],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'mirror',
              }}
            >
              <div className='relative'>
                <Image
                  src='/images/boombox.png'
                  alt='Boombox'
                  width={isMobile ? 80 : 120}
                  height={isMobile ? 60 : 90}
                  className='object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]'
                  priority={true}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  */}
      {/* Add effects for party mode */}
      {partyMode && (
        <>
          {/*  */}
          {/* Pulsating circles around the cube */}
          <motion.div
            className={`absolute inset-0 rounded-full ${getBackgroundForTheme(currentTrack?.theme || 'party')}`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
          />

          {/*  */}
          {/* Colorful particles around */}
          {Array.from({ length: isMobile ? 10 : 20 }).map((_, i) => {
            //
            // Define particle colors depending on the theme
            let particleColor = '';
            if (currentTrack?.theme === 'retro') {
              particleColor =
                i % 3 === 0
                  ? 'bg-purple-500'
                  : i % 3 === 1
                    ? 'bg-indigo-500'
                    : 'bg-violet-500';
            } else if (currentTrack?.theme === 'chill') {
              particleColor =
                i % 3 === 0
                  ? 'bg-green-500'
                  : i % 3 === 1
                    ? 'bg-emerald-500'
                    : 'bg-teal-500';
            } else if (currentTrack?.theme === 'dance') {
              particleColor =
                i % 3 === 0
                  ? 'bg-pink-500'
                  : i % 3 === 1
                    ? 'bg-rose-500'
                    : 'bg-red-500';
            } else {
              particleColor =
                i % 5 === 0
                  ? 'bg-pink-500'
                  : i % 5 === 1
                    ? 'bg-purple-500'
                    : i % 5 === 2
                      ? 'bg-yellow-500'
                      : i % 5 === 3
                        ? 'bg-green-500'
                        : 'bg-blue-500';
            }

            return (
              <motion.div
                key={`party-particle-${i}`}
                className={`absolute rounded-full ${particleColor}`}
                style={{
                  width: `${3 + Math.random() * 5}px`,
                  height: `${3 + Math.random() * 5}px`,
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, (Math.random() - 0.5) * 200],
                  y: [0, (Math.random() - 0.5) * 200],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1 + Math.random(),
                  repeat: Number.POSITIVE_INFINITY,
                  delay: Math.random() * 2,
                }}
              />
            );
          })}
        </>
      )}

      {/*  */}
      {/* Enhanced floating particles */}
      {isClient &&
        Array.from({ length: isMobile ? 15 : 30 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0.5,
              scale: Math.random() * 0.5 + 0.5,
              x:
                Math.random() *
                (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * 400,
            }}
            animate={{
              x:
                Math.random() *
                (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * 400,
              opacity: [0.5, 0.8, 0.5],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
            className={`absolute w-2 h-2 rounded-full ${
              i % 5 === 0
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-300'
                : i % 5 === 1
                  ? 'bg-gradient-to-r from-blue-500 to-blue-300'
                  : i % 5 === 2
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-300'
                    : i % 5 === 3
                      ? 'bg-gradient-to-r from-sky-500 to-sky-300'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-300'
            } blur-sm`}
          />
        ))}
    </motion.div>
  );
}
