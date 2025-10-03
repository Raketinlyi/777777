'use client';

import { useEffect, useMemo, useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function I18nLanguageSwitcher() {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Memoize supported languages to prevent recreation on each render
  const languages = useMemo(
    () => [
      { code: 'en', name: 'English', display: 'EN', flag: '🇺🇸' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'ru', name: 'Russian', flag: '🇷🇺' },
      { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' },
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    ],
    []
  );

  // Get current language info
  const currentLanguage = useMemo(() => {
    return languages.find(lang => lang.code === i18n.language) || languages[0];
  }, [languages, i18n.language]);

  // Function to switch language
  const switchLanguage = (langCode: string) => {
    if (i18n && typeof i18n.changeLanguage === 'function') {
      // Save selected language to localStorage FIRST
      localStorage.setItem('i18nextLng', langCode);
      // Then change the language
      i18n.changeLanguage(langCode);
      // Double-check that the language was applied
      setTimeout(() => {
        if (i18n.language !== langCode) {
          i18n.changeLanguage(langCode);
        }
      }, 100);
      setIsOpen(false);
    }
  };

  // Initialize language on load
  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('i18nextLng');
    if (
      savedLang &&
      languages.some(lang => lang.code === savedLang) &&
      typeof i18n.changeLanguage === 'function'
    ) {
      // Force apply saved language and prevent automatic switching
      i18n.changeLanguage(savedLang);
      // Double-check that the language was applied
      setTimeout(() => {
        if (i18n.language !== savedLang) {
          i18n.changeLanguage(savedLang);
        }
      }, 100);
    }
  }, [languages]);

  // Don't render on server side
  if (!mounted) return null;

  // Mobile version with dropdown menu
  if (isMobile) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='flex items-center space-x-2 bg-black/30 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50 px-3 py-2 h-10'
          >
            <Globe className='h-4 w-4' />
            <span className='text-sm font-medium'>
              {currentLanguage?.flag} {currentLanguage?.name}
            </span>
            <ChevronDown className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='w-56 bg-slate-900/95 border border-cyan-500/30 backdrop-blur-sm'
        >
          {languages.map(language => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => switchLanguage(language.code)}
              className={`flex items-center space-x-3 px-4 py-3 cursor-pointer ${
                i18n.language === language.code
                  ? 'bg-cyan-900/50 text-cyan-300'
                  : 'text-cyan-500 hover:text-cyan-300 hover:bg-slate-800/50'
              }`}
            >
              <span className='text-lg'>{language.flag}</span>
              <span className='font-medium'>{language.name}</span>
              {i18n.language === language.code && (
                <span className='ml-auto text-cyan-300'>✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Desktop version with horizontal buttons
  return (
    <div className='flex items-center space-x-1 overflow-x-auto py-1 px-1 bg-black/30 rounded-lg border border-cyan-500/30 max-w-full'>
      <Globe className='h-4 w-4 text-cyan-300 flex-shrink-0 mr-1' />
      <div className='flex space-x-1 overflow-x-auto no-scrollbar'>
        {languages.map(language => (
          <Button
            key={language.code}
            variant='ghost'
            size='sm'
            onClick={() => switchLanguage(language.code)}
            className={`px-2 py-1 h-7 min-w-0 flex-shrink-0 ${
              i18n.language === language.code
                ? 'bg-cyan-900/50 text-cyan-300 hover:bg-cyan-900/70'
                : 'text-cyan-500 hover:text-cyan-300 hover:bg-slate-800/50'
            }`}
            title={language.name}
          >
            <span>{language.flag}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
