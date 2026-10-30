import React from 'react';
import { Menu, Stethoscope, Sun, SunMedium, CloudDownload } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  onOpenSidebar: () => void;
  title: string;
  subtitle?: string;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSyncModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenSidebar, 
  currentTab,
  onSelectTab,
  onOpenSyncModal
}) => {
  const { language, setLanguage, t, isSunlightMode, toggleSunlightMode } = useLanguage();

  const navTabs = [
    { id: 'dashboard', label: t('navDashboard') },
    { id: 'assistant', label: t('navAssistant') },
    { id: 'visits', label: t('navVisits') },
    { id: 'history', label: t('navHistory') },
    { id: 'protocols', label: t('navProtocols') },
    { id: 'safety', label: t('navSafety') },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
      {/* Left: App Identity & Subtle Clinical Badge */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden shrink-0 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clean Stethoscope Logo */}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#047857] text-white shrink-0 shadow-xs shadow-emerald-950/20">
          <Stethoscope className="w-5 h-5" />
        </div>

        {/* App Title & Clinical Sub-Centre Tag */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight leading-tight">
              CareSphere
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <span>Frontline Healthcare CDSS • Chandrapuri Sub-Centre</span>
            </span>
          </div>
          <span className="text-[10px] sm:hidden text-slate-500 font-medium">
            CDSS • Chandrapuri Sub-Centre
          </span>
        </div>
      </div>

      {/* Center: Clean Hospital Navigation Tabs (Tablet/Desktop) */}
      {onSelectTab && (
        <nav className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 mx-3">
          {navTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  isActive
                    ? 'bg-[#047857] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* Right: Minimal Controls (Sunlight Mode, Offline Active, Trilingual Toggle) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Sunlight Mode Toggle */}
        <button
          onClick={toggleSunlightMode}
          className={`p-2 rounded-xl border transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isSunlightMode
              ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-200'
              : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
          }`}
          title={isSunlightMode ? t('sunlightModeActive') : t('sunlightModeToggle')}
          aria-label="Toggle Sunlight Mode"
        >
          {isSunlightMode ? (
            <Sun className="w-5 h-5 text-amber-600" />
          ) : (
            <SunMedium className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {/* Offline Protocol Sync Button */}
        {onOpenSyncModal && (
          <button
            onClick={onOpenSyncModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
            title={language === 'te' ? 'ప్రోటోకాల్స్ సింక్ చేయండి' : language === 'hi' ? 'प्रोटोकॉल सिंक करें' : 'Sync Offline Protocols'}
            aria-label="Sync Offline Protocols"
          >
            <CloudDownload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="hidden md:inline font-semibold">
              {language === 'te' ? 'సింక్' : language === 'hi' ? 'सिंक' : 'Sync'}
            </span>
          </button>
        )}

        {/* Clean Offline Active Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="hidden sm:inline font-semibold">{t('offlineActiveBadge')}</span>
          <span className="sm:hidden font-semibold">Offline</span>
        </div>

        {/* Essential Trilingual Switcher [ EN | తె | हि ] */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-300 shadow-2xs">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              language === 'en'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Switch to English"
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('te')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              language === 'te'
                ? 'bg-[#047857] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="తెలుగు భాషకు మార్చండి"
          >
            తె
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
              language === 'hi'
                ? 'bg-[#047857] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="हिन्दी भाषा में बदलें"
          >
            हि
          </button>
        </div>
      </div>
    </header>
  );
};
