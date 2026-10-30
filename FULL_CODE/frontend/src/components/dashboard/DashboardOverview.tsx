import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CalendarClock, 
  CalendarCheck, 
  ArrowRight, 
  Stethoscope, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  CheckCircle2,
  Clock,
  Search,
  ChevronRight
} from 'lucide-react';
import { AshaWorker, VisitItem } from '../../types';
import { fetchAshas, fetchVisits } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useVisits } from '../../context/VisitContext';

interface DashboardOverviewProps {
  onNavigate: (tab: string, filterParam?: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { t, language, currentDateFormatted, currentTimeFormatted } = useLanguage();
  const { 
    completeVisit, 
    isCompleted, 
    completedCount, 
    activePendingTotal, 
    activeP1Pending, 
    activeP2Pending, 
    activeP3Pending, 
    progressPercent 
  } = useVisits();

  const [ashas, setAshas] = useState<AshaWorker[]>([]);
  const [urgentVisits, setUrgentVisits] = useState<VisitItem[]>([]);
  const [loadingUrgent, setLoadingUrgent] = useState(true);
  const [quickSearch, setQuickSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [ashasData, visitsRes] = await Promise.all([
          fetchAshas(),
          fetchVisits({ priority: 1, limit: 6 })
        ]);
        setAshas(ashasData);
        setUrgentVisits(visitsRes.items || []);
      } catch (err) {
        console.error('Error loading dashboard mission data:', err);
      } finally {
        setLoadingUrgent(false);
      }
    }
    loadData();
  }, []);

  const totalDue = 346;
  const pendingUrgentVisits = urgentVisits.filter((item) => !isCompleted(item.member_id, item.due_item));

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      onNavigate('visits', { search: quickSearch.trim() });
    } else {
      onNavigate('visits');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero: Today's Field Mission */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#065f46] via-[#044a37] to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg border-[1.5px] border-emerald-600/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold border-[1.5px] border-emerald-400/40 backdrop-blur-xs shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Chandrapuri Block • Sub-Centre Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {t('missionHeroTitle')}
            </h1>

            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              {t('missionHeroDesc')}
            </p>

            {/* Date Clarity Badges */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 text-teal-100">
                <Clock className="w-3.5 h-3.5 text-teal-300" />
                <span><strong>{t('headerCurrentDate')}:</strong> {currentDateFormatted} ({currentTimeFormatted})</span>
              </span>
              <span className="bg-teal-500/25 px-2.5 py-1 rounded-lg border border-teal-300/30 flex items-center gap-1.5 text-white font-medium">
                <span><strong>{t('headerScheduleDate')}:</strong> 26 Oct 2026</span>
              </span>
            </div>
          </div>

          {/* Quick Action / Fast Search */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-slate-950" />
              <span>{t('quickAction1Btn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Search Input */}
            <form onSubmit={handleQuickSearchSubmit} className="relative">
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder={language === 'te' ? 'రోగి ID లేదా గ్రామం వెతకండి...' : 'Search Member ID or Village...'}
                className="w-full sm:w-64 px-3.5 py-2 pl-9 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-teal-200/70 text-xs rounded-xl border border-white/20 focus:border-teal-400 focus:outline-none transition-all"
              />
              <Search className="w-3.5 h-3.5 text-teal-300 absolute left-3 top-2.5 pointer-events-none" />
            </form>
          </div>
        </div>

        {/* Shift Completion Progress Bar */}
        <div className="mt-6 pt-5 border-t border-teal-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-teal-200">
              {t('progressTitle')}:
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-white text-sm">{completedCount}</span>
              <span className="text-teal-300">/ {totalDue} {t('dueBadge')}</span>
              <span className="bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-full text-[11px] font-mono">
                {progressPercent}%
              </span>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate('history')}
                  className="text-xs font-semibold text-teal-200 hover:text-white underline cursor-pointer ml-1"
                >
                  {t('viewHistoryBtn')} ({completedCount}) &rarr;
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 max-w-md w-full bg-slate-950/40 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
            <div 
              className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="text-[11px] text-teal-200 flex items-center gap-2">
            <span>{t('pendingCount')}: <strong>{activePendingTotal}</strong></span>
          </div>
        </div>
      </div>

      {/* Priority KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Priority 1 High Risk */}
        <div 
          onClick={() => onNavigate('visits', { priority: 1 })}
          className="bg-white p-4 sm:p-5 rounded-2xl border-[1.5px] border-red-300 shadow-xs hover:border-red-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-extrabold text-red-700 uppercase tracking-wider text-[11px]">{t('p1Title')}</span>
            <div className="p-2 rounded-xl bg-red-100 text-red-700 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeP1Pending}</span>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">{t('p1Subtitle')}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
            {t('p1Desc')}
          </p>
        </div>

        {/* Priority 2 Routine Due */}
        <div 
          onClick={() => onNavigate('visits', { priority: 2 })}
          className="bg-white p-4 sm:p-5 rounded-2xl border-[1.5px] border-emerald-300 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-extrabold text-[#065f46] uppercase tracking-wider text-[11px]">{t('p2Title')}</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#065f46] group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeP2Pending}</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{t('p2Subtitle')}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
            {t('p2Desc')}
          </p>
        </div>

        {/* Priority 3 Upcoming */}
        <div 
          onClick={() => onNavigate('visits', { priority: 3 })}
          className="bg-white p-4 sm:p-5 rounded-2xl border-[1.5px] border-slate-200 shadow-xs hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">{t('p3Title')}</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:scale-110 transition-transform">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{activeP3Pending}</span>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">{t('p3Subtitle')}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
            {t('p3Desc')}
          </p>
        </div>

        {/* Protocol Engine Precision */}
        <div 
          onClick={() => onNavigate('safety')}
          className="bg-white p-4 sm:p-5 rounded-2xl border-[1.5px] border-emerald-300 shadow-xs hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">{t('benchmarkTitle')}</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">99.56%</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">PASS</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
            {t('benchmarkDesc')}
          </p>
        </div>
      </div>

      {/* Immediate Priority 1 Actions Table */}
      <div className="bg-white rounded-2xl border-[1.5px] border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>{t('missionP1Focus')}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('p1ActionRequired')}
            </p>
          </div>

          <button
            onClick={() => onNavigate('visits', { priority: 1 })}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group self-start sm:self-auto cursor-pointer"
          >
            <span>View All {activeP1Pending} P1 Cases</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {loadingUrgent ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <div className="inline-block w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
            <div>Loading Priority 1 action register...</div>
          </div>
        ) : pendingUrgentVisits.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            All prioritized high-risk cases currently addressed. Check Visit History.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingUrgentVisits.map((item) => {
              return (
                <div 
                  key={`${item.member_id}-${item.due_item}`}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => completeVisit(item)}
                      className="mt-0.5 p-1 rounded-lg border border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                      title={t('markDoneBtn')}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.name || item.member_id}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          ({item.member_id})
                        </span>
                        <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                          P1 HIGH-RISK
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 font-medium">
                        Due: <span className="text-red-700 font-semibold">{item.due_item}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span>{item.service_category}</span>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        {item.village} • Household #{item.household_id} • ASHA: {item.asha_id || 'Chandrapuri Sub-Centre'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      onClick={() => onNavigate('visits', { search: item.member_id })}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t('inspectBtn')}
                    </button>
                    <button
                      onClick={() => completeVisit(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('markDoneBtn')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assistant Shortcut */}
        <div 
          onClick={() => onNavigate('assistant')}
          className="bg-white p-5 rounded-2xl border-[1.5px] border-slate-200 shadow-xs hover:border-[#065f46] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f46] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {t('quickAction1Title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('quickAction1Desc')}
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-[#065f46] group-hover:text-emerald-900">
            <span>{t('quickAction1Btn')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Visit List Shortcut */}
        <div 
          onClick={() => onNavigate('visits')}
          className="bg-white p-5 rounded-2xl border-[1.5px] border-slate-200 shadow-xs hover:border-[#065f46] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f46] flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {t('quickAction2Title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('quickAction2Desc')}
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-[#065f46] group-hover:text-emerald-900">
            <span>{t('quickAction2Btn')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Protocol Guidelines Shortcut */}
        <div 
          onClick={() => onNavigate('protocols')}
          className="bg-white p-5 rounded-2xl border-[1.5px] border-slate-200 shadow-xs hover:border-[#065f46] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#065f46] flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {t('quickAction3Title')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('quickAction3Desc')}
            </p>
          </div>
          <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-[#065f46] group-hover:text-emerald-900">
            <span>{t('quickAction3Btn')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ASHA Roster */}
      <div className="bg-white rounded-2xl border-[1.5px] border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              {t('ashaRosterTitle')}
            </h3>
          </div>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            {t('fiveAshas')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {ashas.map((asha) => (
            <div 
              key={asha.asha_id}
              onClick={() => onNavigate('visits', { village: asha.villages })}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-teal-50/60 hover:border-teal-300 transition-all cursor-pointer space-y-1"
            >
              <div className="font-bold text-slate-900 text-xs">
                {asha.asha_name}
              </div>
              <div className="text-[11px] text-teal-800 font-medium">
                {asha.villages}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span>{asha.asha_id}</span>
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
