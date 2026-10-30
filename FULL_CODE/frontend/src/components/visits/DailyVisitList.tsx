import React, { useState, useEffect } from 'react';
import { 
  Search, 
  AlertTriangle, 
  CalendarCheck, 
  CalendarClock, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  History,
  UserPlus
} from 'lucide-react';
import { VisitItem, VisitsResponse } from '../../types';
import { fetchVisits, getLocalVisits } from '../../services/api';
import { MemberDetailModal } from './MemberDetailModal';
import { VisitCompletionModal } from './VisitCompletionModal';
import { RegisterPatientModal } from './RegisterPatientModal';
import { useLanguage } from '../../context/LanguageContext';
import { useVisits } from '../../context/VisitContext';

interface DailyVisitListProps {
  initialPriority?: number;
  onNavigate?: (tab: string, param?: any) => void;
}

export const DailyVisitList: React.FC<DailyVisitListProps> = ({ initialPriority, onNavigate }) => {
  const { t, language } = useLanguage();
  const { 
    completeVisit, 
    registerNewPatient,
    customRegisteredVisits,
    isCompleted, 
    activePendingTotal, 
    activeP1Pending, 
    activeP2Pending, 
    activeP3Pending, 
    completedCount,
    clearAllCompleted
  } = useVisits();

  const [visitsData, setVisitsData] = useState<VisitsResponse>(() => 
    getLocalVisits({ priority: initialPriority, limit: 25 })
  );
  const [loading, setLoading] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<number | undefined>(initialPriority);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeModalVisit, setActiveModalVisit] = useState<VisitItem | null>(null);

  // New Modals State
  const [selectedVisitForCompletion, setSelectedVisitForCompletion] = useState<VisitItem | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Sync priority when navigated from dashboard mission card
  useEffect(() => {
    setSelectedPriority(initialPriority);
    setPage(1);
  }, [initialPriority]);

  const loadVisits = async () => {
    try {
      const data = await fetchVisits({
        priority: selectedPriority,
        category: selectedCategory,
        village: selectedVillage,
        search: searchQuery.trim() || undefined,
        page,
        limit: 25
      });
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setVisitsData(data);
      } else {
        setVisitsData(getLocalVisits({
          priority: selectedPriority,
          category: selectedCategory,
          village: selectedVillage,
          search: searchQuery.trim() || undefined,
          page,
          limit: 25
        }));
      }
    } catch (err) {
      console.error('Error loading visits, falling back to bundled dataset:', err);
      setVisitsData(getLocalVisits({
        priority: selectedPriority,
        category: selectedCategory,
        village: selectedVillage,
        search: searchQuery.trim() || undefined,
        page,
        limit: 25
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [selectedPriority, selectedCategory, selectedVillage, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadVisits();
  };

  const categories = [
    { id: 'All', label: language === 'te' ? 'అన్ని విభాగాలు (All Categories)' : language === 'hi' ? 'सभी श्रेणियां (All Categories)' : 'All Categories' },
    { id: 'Antenatal Care', label: language === 'te' ? 'గర్భధారణ సంరక్షణ (ANC)' : language === 'hi' ? 'प्रसवपूर्व देखभाल (ANC)' : 'Antenatal Care' },
    { id: 'Child Immunization', label: language === 'te' ? 'పిల్లల టీకాలు (Immunization)' : language === 'hi' ? 'शिशु टीकाकरण (Immunization)' : 'Child Immunization' },
    { id: 'Newborn & Postnatal (HBNC)', label: language === 'te' ? 'నవజాత శిశు సంరక్షణ (HBNC)' : language === 'hi' ? 'नवजात शिशु देखभाल (HBNC)' : 'Newborn & Postnatal (HBNC)' },
    { id: 'Malnutrition (MUAC)', label: language === 'te' ? 'పోషకాహార లోపం (MUAC)' : language === 'hi' ? 'कुपोषण जांच (MUAC)' : 'Malnutrition (MUAC)' },
    { id: 'Non-Communicable Diseases (NCD)', label: language === 'te' ? 'దీర్ఘకాలిక వ్యాధులు (NCD)' : language === 'hi' ? 'गैर-संचारी रोग (NCD)' : 'Non-Communicable Diseases (NCD)' }
  ];

  const villages = [
    { id: 'All', label: language === 'te' ? 'అన్ని గ్రామాలు (All Villages)' : language === 'hi' ? 'सभी गांव (All Villages)' : 'All Villages' },
    { id: 'Amrapur', label: language === 'te' ? 'Amrapur (ఆమ్రాపూర్)' : language === 'hi' ? 'Amrapur (अमरापुर)' : 'Amrapur' },
    { id: 'Belwadi Tola', label: language === 'te' ? 'Belwadi Tola (బెల్వాడి తోలా)' : language === 'hi' ? 'Belwadi Tola (बेलवाड़ी टोला)' : 'Belwadi Tola' },
    { id: 'Kesarganj', label: language === 'te' ? 'Kesarganj (కేసర్‌గంజ్)' : language === 'hi' ? 'Kesarganj (केसरगंज)' : 'Kesarganj' },
    { id: 'Dhanpura', label: language === 'te' ? 'Dhanpura (ధన్‌పురా)' : language === 'hi' ? 'Dhanpura (धनपुरा)' : 'Dhanpura' },
    { id: 'Navagaon Khurd', label: language === 'te' ? 'Navagaon Khurd (నవగావ్ ఖుర్ద్)' : language === 'hi' ? 'Navagaon Khurd (नवगांव खुर्द)' : 'Navagaon Khurd' },
    { id: 'Sitapahari', label: language === 'te' ? 'Sitapahari (సీతాపహారి)' : language === 'hi' ? 'Sitapahari (सीतापहाड़ी)' : 'Sitapahari' }
  ];

  const getPriorityLabel = (p: number) => {
    if (language === 'te') {
      return p === 1 ? 'P1: తీవ్ర ప్రమాదం' : p === 2 ? 'P2: సాధారణ గడువు' : 'P3: రాబోయేవి';
    } else if (language === 'hi') {
      return p === 1 ? 'P1: उच्च जोखिम (High-Risk)' : p === 2 ? 'P2: नियमित नियत (Routine)' : 'P3: आगामी (Upcoming)';
    }
    return p === 1 ? 'P1: High-Risk' : p === 2 ? 'P2: Routine' : 'P3: Upcoming';
  };

  // Merge baseline visits and custom registered visits
  const allFilteredCustom = customRegisteredVisits.filter((item) => {
    if (isCompleted(item.member_id, item.due_item)) return false;
    if (selectedPriority !== undefined && item.priority !== selectedPriority) return false;
    if (selectedCategory !== 'All' && item.service_category !== selectedCategory) return false;
    if (selectedVillage !== 'All' && item.village !== selectedVillage) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.member_id.toLowerCase().includes(q) ||
        item.village.toLowerCase().includes(q) ||
        item.due_item.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeVisits = [
    ...allFilteredCustom,
    ...(visitsData?.items?.filter(
      (item) => !isCompleted(item.member_id, item.due_item)
    ) || [])
  ];

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      <MemberDetailModal
        visit={activeModalVisit}
        onClose={() => setActiveModalVisit(null)}
      />

      {/* Visit Completion Modal (Notes & Drug Dispensation) */}
      {selectedVisitForCompletion && (
        <VisitCompletionModal
          visit={selectedVisitForCompletion}
          isOpen={true}
          onClose={() => setSelectedVisitForCompletion(null)}
          onConfirmComplete={(details) => completeVisit(selectedVisitForCompletion, details)}
          onSkipComplete={() => completeVisit(selectedVisitForCompletion)}
        />
      )}

      {/* Register New Patient Modal */}
      {showRegisterModal && (
        <RegisterPatientModal
          isOpen={true}
          onClose={() => setShowRegisterModal(false)}
          onRegister={async (formData) => {
            await registerNewPatient(formData);
          }}
        />
      )}

      {/* Header and Summary Cards */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('visitsTitle')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('visitsSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* + Register New Patient On-the-Fly */}
            <button
              onClick={() => setShowRegisterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#065f46] hover:bg-[#044a37] text-white text-xs font-bold shadow-md shadow-emerald-950/20 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'te' ? '+ కొత్త రోగి నమోదు' : language === 'hi' ? '+ नया रोगी पंजीकृत करें' : '+ Register New Patient'}</span>
            </button>

            {/* Dynamic Due Count */}
            <div className="text-xs text-slate-700 bg-slate-100 px-3.5 py-2 rounded-2xl border-[1.5px] border-slate-200 font-bold">
              {t('totalDueLabel')} <strong className="text-slate-900">{activePendingTotal}</strong>
            </div>

            {/* Quick link to History */}
            {onNavigate && (
              <button
                onClick={() => onNavigate('history')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-2xl border-[1.5px] border-emerald-300 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('viewHistoryBtn')} ({completedCount})</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Priority Tabs with Synchronized Dynamic Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {/* All */}
          <button
            onClick={() => { setSelectedPriority(undefined); setPage(1); }}
            className={`p-3 rounded-2xl border-[1.5px] text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedPriority === undefined
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">{t('allVisitsFilter')}</span>
            <span className="text-xl font-bold mt-1">{activePendingTotal}</span>
          </button>

          {/* Priority 1 */}
          <button
            onClick={() => { setSelectedPriority(1); setPage(1); }}
            className={`p-3 rounded-2xl border-[1.5px] text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedPriority === 1
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-white border-red-300 text-red-900 hover:bg-red-50'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-90 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t('p1Title')}
            </span>
            <span className="text-xl font-bold mt-1">{activeP1Pending}</span>
          </button>

          {/* Priority 2 */}
          <button
            onClick={() => { setSelectedPriority(2); setPage(1); }}
            className={`p-3.5 rounded-2xl border-[1.5px] text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedPriority === 2
                ? 'bg-[#065f46] text-white border-[#065f46] shadow-sm'
                : 'bg-white border-emerald-300 text-emerald-950 hover:bg-emerald-50'
            }`}
          >
            <span className="text-[11px] font-bold opacity-90 uppercase tracking-wider flex items-center gap-1">
              <CalendarCheck className="w-3 h-3 text-emerald-400" />
              {t('p2Title')}
            </span>
            <span className="text-xl font-extrabold mt-1">{activeP2Pending}</span>
          </button>

          {/* Priority 3 */}
          <button
            onClick={() => { setSelectedPriority(3); setPage(1); }}
            className={`p-3 rounded-2xl border-[1.5px] text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedPriority === 3
                ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-80 uppercase tracking-wider flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              {t('p3Title')}
            </span>
            <span className="text-xl font-bold mt-1">{activeP3Pending}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border-[1.5px] border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <select
              value={selectedVillage}
              onChange={(e) => { setSelectedVillage(e.target.value); setPage(1); }}
              className="text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {villages.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              {t('filterBtn')}
            </button>
          </div>
        </form>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border-[1.5px] border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3.5 px-4">{t('colPriority')}</th>
                <th className="py-3.5 px-4">{t('colPatient')}</th>
                <th className="py-3.5 px-4">{t('colDueService')}</th>
                <th className="py-3.5 px-4">{t('colCategory')}</th>
                <th className="py-3.5 px-4">{t('colVillageHouse')}</th>
                <th className="py-3.5 px-4 text-center">{t('colStatus')}</th>
                <th className="py-3.5 px-4 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading visits from register...</div>
                  </td>
                </tr>
              ) : activeVisits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-slate-700">No pending visits in this view</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {completedCount > 0 
                        ? `${completedCount} visits have been marked as completed.` 
                        : 'Try clearing filters or adjusting your search term.'}
                    </div>
                    {completedCount > 0 && (
                      <button
                        onClick={() => clearAllCompleted()}
                        className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-300 transition-colors"
                      >
                        Reset Completed Status (Restore All 346 Visits)
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                activeVisits.map((item, idx) => {
                  const isP1 = item.priority === 1;
                  const isP2 = item.priority === 2;
                  return (
                    <tr 
                      key={`${item.member_id}-${item.due_item}-${idx}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Priority Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isP1 ? 'bg-red-100 text-red-800 border border-red-200' :
                          isP2 ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isP1 && <AlertTriangle className="w-3 h-3 text-red-600" />}
                          {getPriorityLabel(item.priority)}
                        </span>
                      </td>

                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                          {item.member_id} • {item.sex}, {item.relation}
                        </div>
                      </td>

                      {/* Due Service */}
                      <td className="py-3 px-4">
                        <div className={`font-bold ${isP1 ? 'text-red-700' : 'text-slate-800'}`}>{item.due_item}</div>
                      </td>

                      {/* Service Category */}
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {item.service_category}
                      </td>

                      {/* Village and House No */}
                      <td className="py-3 px-4 text-xs">
                        <div className="font-medium text-slate-800">{item.village}</div>
                        <div className="text-slate-400 text-[11px]">House #{item.house_no || item.household_id}</div>
                      </td>

                      {/* Complete Action Button (Opens Clinical Completion Modal) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedVisitForCompletion(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
                          title={language === 'te' ? 'పూర్తయినట్లు గుర్తించండి' : language === 'hi' ? 'पूर्ण चिह्नित करें' : 'Mark visit as completed'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('markDoneBtn')}</span>
                        </button>
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveModalVisit(item)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{t('inspectBtn')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <strong>{activeVisits.length}</strong> of <strong>{activePendingTotal}</strong> pending visits
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!visitsData || visitsData.items.length < (visitsData.limit || 25)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
