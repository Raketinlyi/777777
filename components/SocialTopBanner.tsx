'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Twitter, MessageCircle, Send } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

export default function SocialTopBanner() {
  const { isMobile } = useMobile();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const dismissedFlag = localStorage.getItem('crazycube:socialBanner:dismissed');
    if (dismissedFlag === '1') return;
    setVisible(true);
  }, [isMobile]);

  const close = () => {
    setDismissed(true);
    setVisible(false);
    localStorage.setItem('crazycube:socialBanner:dismissed', '1');
  };

  if (!isMobile || dismissed || !visible) return null;

  return (
    <div className="fixed top-2 left-2 right-2 z-50 bg-black/80 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-2 flex items-center gap-3 shadow">
                  <span className="text-xs opacity-80 shrink-0">Social:</span>
      <div className="flex items-center gap-3">
        <Link href="https://x.com/crazy__cube" target="_blank" className="hover:opacity-90" aria-label="X (Twitter)">
          <Twitter className="w-4 h-4" />
        </Link>
        <Link href="https://t.me/MonadMonsterNFT" target="_blank" className="hover:opacity-90" aria-label="Telegram">
          <Send className="w-4 h-4" />
        </Link>
        <Link href="https://discord.gg/" target="_blank" className="hover:opacity-90" aria-label="Discord">
          <MessageCircle className="w-4 h-4" />
        </Link>
      </div>
                <button onClick={close} className="ml-auto p-1 rounded hover:bg-white/10" aria-label="Close">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}