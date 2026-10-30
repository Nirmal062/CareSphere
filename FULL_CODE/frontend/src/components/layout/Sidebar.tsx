import React from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  ClipboardList, 
  History,
  BookOpen, 
  ShieldCheck, 
  PhoneCall, 
  WifiOff, 
  MapPin,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useVisits } from '../../context/VisitContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen, onClose }) => {
  const { t } = useLanguage();
  const { completedCount, activePendingTotal } = useVisits();

  const navItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'assistant', label: t('navAssistant'), icon: Stethoscope },
    { id: 'visits', label: t('navVisits'), icon: ClipboardList, badge: String(activePendingTotal) },
    { id: 'history', label: t('navHistory'), icon: History, badge: completedCount > 0 ? String(completedCount) : undefined },
    { id: 'protocols', label: t('navProtocols'), icon: BookOpen, badge: t('docsBadge') },
    { id: 'safety', label: t('navSafety'), icon: ShieldCheck, badge: '0.9956' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 
        flex flex-col transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top Branding */}
        <div className="p-4 border-b-[1.5px] border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#065f46] flex items-center justify-center text-white shadow-md shadow-emerald-950/20 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">
                {t('appTitle')}
              </h1>
              <p className="text-[11px] text-[#065f46] font-semibold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#065f46] shrink-0" />
                {t('appSubtitle')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Chip */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b-[1.5px] border-slate-100 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border-[1.5px] border-emerald-300 text-[11px] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('offlineModeBadge')}
          </span>
          <span className="text-slate-500 font-mono text-[11px] font-bold">Sub-Centre Active</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer
                  ${active 
                    ? 'bg-[#065f46] text-white shadow-sm shadow-emerald-950/20' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${
                    active ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Emergency Quick Access Card */}
        <div className="p-3 m-3 bg-red-50 border-[1.5px] border-red-300 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center gap-1.5 text-red-950 font-bold text-xs">
            <PhoneCall className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>{t('emergencyContactsTitle')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a href="tel:108" className="bg-white p-2.5 rounded-xl border border-red-200 shadow-2xs hover:border-red-400 transition-colors block">
              <div className="text-[10px] text-slate-500 uppercase font-bold">108</div>
              <div className="text-red-700 font-extrabold text-xs truncate">{t('ambulance108')}</div>
            </a>
            <a href="tel:102" className="bg-white p-2.5 rounded-xl border border-red-200 shadow-2xs hover:border-red-400 transition-colors block">
              <div className="text-[10px] text-slate-500 uppercase font-bold">102</div>
              <div className="text-red-700 font-extrabold text-xs truncate">{t('jssk102')}</div>
            </a>
          </div>
          <div className="text-[11px] text-red-800/90 leading-tight">
            {t('districtHospitalSNCU')}
          </div>
        </div>

        {/* Device & Engine Specs */}
        <div className="p-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Engine:</span>
            </span>
            <span className="font-semibold text-teal-800">Local Device</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Latency on CPU:</span>
            <span className="font-mono font-medium text-slate-700">&lt; 1.0 ms</span>
          </div>
        </div>
      </aside>
    </>
  );
};
