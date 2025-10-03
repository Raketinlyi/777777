'use client';

// Global singleton audio element to persist between page navigations
let cachedAudio: HTMLAudioElement | null = null;

export function getGlobalAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  if (cachedAudio && document.body.contains(cachedAudio)) {
    return cachedAudio;
  }
  const existing = document.getElementById('crazycube-global-audio') as HTMLAudioElement | null;
  if (existing) {
    cachedAudio = existing;
    return existing;
  }
  const audio = document.createElement('audio');
  audio.id = 'crazycube-global-audio';
  audio.preload = 'metadata';
  audio.style.display = 'none';
  audio.setAttribute('aria-hidden', 'true');
  audio.setAttribute('tabindex', '-1');
  // Allow looping by default for background music
  audio.loop = true;
  document.body.appendChild(audio);
  cachedAudio = audio;
  return audio;
}

export function destroyGlobalAudioElement() {
  if (cachedAudio && cachedAudio.parentNode) {
    try {
      cachedAudio.pause();
    } catch (_) {}
    cachedAudio.parentNode.removeChild(cachedAudio);
  }
  cachedAudio = null;
}


