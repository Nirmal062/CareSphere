import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  AlertTriangle, 
  CalendarCheck, 
  CalendarClock, 
  History,
  ClipboardList
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useVisits, CompletedVisitRecord } from '../../context/VisitContext';
import { MemberDetailModal } from './MemberDetailModal';
import { VisitItem } from '../../types';

interface HistoryViewProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { completedRecords, reopenVisit, completedCount } = useVisits();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<number | 'all'>('all');
  const [activeModalVisit, setActiveModalVisit] = useState<VisitItem | null>(null);

  // Filter records based on search and priority
  const filteredRecords = useMemo(() => {
    return completedRecords.filter((record) => {
      if (selectedPriority !== 'all' && record.priority !== selectedPriority) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        record.name.toLowerCase().includes(q) ||
        record.member_id.toLowerCase().includes(q) ||
        record.village.toLowerCase().includes(q) ||
        record.due_item.toLowerCase().includes(q) ||
        record.service_category.toLowerCase().includes(q)
      );
    });
  }, [completedRecords, searchQuery, selectedPriority]);

  const getPriorityLabel = (p: number) => {
    if (language === 'te') {
      return p === 1 ? 'P1: తీవ్ర ప్రమాదం' : p === 2 ? 'P2: సాధారణ గడువు' : 'P3: రాబోయేవి';
    }
    return p === 1 ? 'P1: High-Risk' : p === 2 ? 'P2: Routine' : 'P3: Upcoming';
  };

  const handleInspect = (record: CompletedVisitRecord) => {
    if (record.raw_visit) {
      setActiveModalVisit(record.raw_visit);
      return;
    }
    const visitItem: VisitItem = {
      member_id: record.member_id,
      household_id: record.household_id || '',
      house_no: record.house_no || '',
      name: record.name,
      sex: record.sex,
      dob: record.dob || '1990-01-01',
      relation: record.relation,
      village: record.village,
      asha_id: record.asha_id || 'ASHA-1',
      head_name: record.head_name || record.name,
      service_category: record.service_category,
      due_item: record.due_item,
      priority: record.priority,
      priority_label: record.priority_label || (record.priority === 1 ? 'High-Risk' : record.priority === 2 ? 'Routine' : 'Upcoming')
    };
    setActiveModalVisit(visitItem);
  };

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      <MemberDetailModal
        visit={activeModalVisit}
        onClose={() => setActiveModalVisit(null)}
      />

      {/* Header and Back Navigation Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {/* Prominent Back Button */}
        <div>
          <button
            onClick={() => onNavigate('visits')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer group shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-teal-700 transition-colors" />
            <span>{t('backToVisits')}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
                <History className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('historyTitle')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('historySubtitle')}
            </p>
          </div>

          <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{completedCount} {language === 'te' ? 'పూర్తయిన సందర్శనలు' : 'Visits Completed'}</span>
          </div>
        </div>

        {/* Priority Filter Tabs in History */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <button
            onClick={() => setSelectedPriority('all')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedPriority === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">
              {t('allVisitsFilter')}
            </span>
            <span className="text-xl font-bold mt-1">{completedRecords.length}</span>
          </button>

          <button
            onClick={() => setSelectedPriority(1)}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedPriority === 1
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-white border-red-200 text-red-900 hover:bg-red-50'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-90 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t('p1Title')}
            </span>
            <span className="text-xl font-bold mt-1">
              {completedRecords.filter((r) => r.priority === 1).length}
            </span>
          </button>

          <button
            onClick={() => setSelectedPriority(2)}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedPriority === 2
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-white border-teal-200 text-teal-900 hover:bg-teal-50'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-90 uppercase tracking-wider flex items-center gap-1">
              <CalendarCheck className="w-3 h-3" />
              {t('p2Title')}
            </span>
            <span className="text-xl font-bold mt-1">
              {completedRecords.filter((r) => r.priority === 2).length}
            </span>
          </button>

          <button
            onClick={() => setSelectedPriority(3)}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedPriority === 3
                ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-80 uppercase tracking-wider flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              {t('p3Title')}
            </span>
            <span className="text-xl font-bold mt-1">
              {completedRecords.filter((r) => r.priority === 3).length}
            </span>
          </button>
        </div>
      </div>

      {/* Search / Filter within History */}
      {completedRecords.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      {/* History Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {completedRecords.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-800 text-base">
              {t('noCompletedVisits')}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('noCompletedVisitsDesc')}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('visits')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <span>{t('goToVisits')}</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500">
            <div className="font-semibold text-slate-700">No matching completed visits</div>
            <div className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3.5 px-4">{t('colPriority')}</th>
                  <th className="py-3.5 px-4">{t('colPatient')}</th>
                  <th className="py-3.5 px-4">{t('colDueService')}</th>
                  <th className="py-3.5 px-4">{t('colCategory')}</th>
                  <th className="py-3.5 px-4">{t('colVillageHouse')}</th>
                  <th className="py-3.5 px-4">{t('completedAt')}</th>
                  <th className="py-3.5 px-4 text-center">{t('colStatus')}</th>
                  <th className="py-3.5 px-4 text-right">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record, idx) => {
                  const isP1 = record.priority === 1;
                  const isP2 = record.priority === 2;
                  return (
                    <tr 
                      key={`${record.id}-${idx}`}
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
                          {getPriorityLabel(record.priority)}
                        </span>
                      </td>

                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{record.name}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                          {record.member_id} • {record.sex}, {record.relation}
                        </div>
                      </td>

                      {/* Due Service & Dispensation Log / Field Notes */}
                      <td className="py-3 px-4">
                        <div className={`font-bold ${isP1 ? 'text-red-700' : 'text-slate-800'}`}>
                          {record.due_item}
                        </div>
                        {record.dispensed_items && record.dispensed_items.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.dispensed_items.map((med, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                💊 {med.item}: x{med.quantity}
                              </span>
                            ))}
                          </div>
                        )}
                        {record.notes && (
                          <div className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200 max-w-xs">
                            📝 "{record.notes}"
                          </div>
                        )}
                        {record.follow_up_date && (
                          <div className="text-[10px] font-bold text-teal-800 mt-1">
                            📅 Follow-up: {record.follow_up_date}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {record.service_category}
                      </td>

                      {/* Village and House No */}
                      <td className="py-3 px-4 text-xs">
                        <div className="font-medium text-slate-800">{record.village}</div>
                        <div className="text-slate-400 text-[11px]">House #{record.house_no || record.household_id}</div>
                      </td>

                      {/* Completed At Timestamp */}
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{record.completed_display_time}</div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t('completedCount')}</span>
                        </span>
                      </td>

                      {/* Actions: Reopen / Inspect */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => reopenVisit(record.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                            title={t('undoVisit')}
                          >
                            <RotateCcw className="w-3 h-3 text-amber-600" />
                            <span>{t('undoVisit')}</span>
                          </button>

                          <button
                            onClick={() => handleInspect(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                            title={t('inspectBtn')}
                          >
                            <Eye className="w-3 h-3" />
                            <span>{t('inspectBtn')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
