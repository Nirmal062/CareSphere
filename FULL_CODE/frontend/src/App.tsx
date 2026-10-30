import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ProtocolAssistant } from './components/assistant/ProtocolAssistant';
import { DailyVisitList } from './components/visits/DailyVisitList';
import { HistoryView } from './components/visits/HistoryView';
import { ProtocolExplorer } from './components/protocols/ProtocolExplorer';
import { SafetyAuditView } from './components/safety/SafetyAuditView';
import { SetupModal } from './components/SetupModal';
import { CareSphereDB } from './services/CareSphereDB';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { VisitProvider } from './context/VisitContext';

const AppContent: React.FC = () => {
  const { language, t } = useLanguage();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [visitPriorityFilter, setVisitPriorityFilter] = useState<number | undefined>(undefined);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function checkFirstTimeSync() {
      try {
        const meta = await CareSphereDB.getSyncMetadata();
        const count = await CareSphereDB.getProtocolsCount();
        if (!meta || count === 0) {
          setIsSetupModalOpen(true);
        }
      } catch (err) {
        console.warn('Error checking sync metadata:', err);
      }
    }
    checkFirstTimeSync();
  }, []);

  const handleNavigate = (tab: string, param?: any) => {
    if (tab === 'visits' && param?.priority !== undefined) {
      setVisitPriorityFilter(param.priority);
    } else {
      setVisitPriorityFilter(undefined);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: language === 'te' ? "నేటి ఫీల్డ్ మిషన్ — చంద్రపురి సబ్-సెంటర్" : "Today's Field Mission — Chandrapuri Sub-Centre",
          subtitle: language === 'te' ? "ప్రాధాన్యతా గృహ సందర్శనలు, అత్యవసర కేసులు మరియు క్లినికల్ విధులు" : "Prioritized household visits, emergency escalations, and maternal-child health actions"
        };
      case 'assistant':
        return {
          title: language === 'te' ? "కేర్‌స్పియర్ ప్రోటోకాల్ అసిస్టెంట్" : "CareSphere Protocol Decision Assistant",
          subtitle: language === 'te' ? "వాయిస్ & టైపింగ్ మద్దతుతో తక్షణ అత్యవసర ప్రమాద సంకేతాల గుర్తింపు మరియు ప్రోటోకాల్ సమాధానాలు" : "Voice & text-enabled emergency screening, scope refusal, and grounded protocol answers"
        };
      case 'visits':
        return {
          title: language === 'te' ? "రోజువారీ ప్రాధాన్యతా గృహ సందర్శన రిజిస్టర్" : "Daily Prioritized Visit Schedule",
          subtitle: language === 'te' ? "2026-10-26 నాటి చంద్రపురి బ్లాక్ గృహాల రిజిస్టర్ షెడ్యూల్" : "Household register due visits evaluated for schedule date 2026-10-26"
        };
      case 'history':
        return {
          title: language === 'te' ? "పూర్తయిన గృహ సందర్శనల చరిత్ర" : "Completed Household Visits History",
          subtitle: language === 'te' ? "చంద్రపురి బ్లాక్‌లో పూర్తయిన ఫీల్డ్ సందర్శనల ధృవీకరించబడిన రికార్డు" : "Verified audit trail of completed field visits in Chandrapuri Block"
        };
      case 'protocols':
        return {
          title: language === 'te' ? "అధికారిక క్లినికల్ మార్గదర్శకాలు" : "Official Clinical Protocol Guidelines",
          subtitle: language === 'te' ? "9 ప్రామాణిక మార్గదర్శకాలు (107 సూచిక విభాగాలతో)" : "9 standard maternal and child health guidelines with 107 indexed sections"
        };
      case 'safety':
        return {
          title: language === 'te' ? "క్లినికల్ భద్రతా విధానం & ఆడిట్" : "Clinical Safety Architecture & Verification",
          subtitle: language === 'te' ? "అత్యవసర రక్షణ గేట్లు మరియు నిరూపిత ఖచ్చితత్వ ఫలితాలు" : "Deterministic emergency gating and verified clinical accuracy results"
        };
      default:
        return {
          title: t('appTitle'),
          subtitle: t('appSubtitle')
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setVisitPriorityFilter(undefined);
          setCurrentTab(tab);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          currentTab={currentTab}
          onSelectTab={handleNavigate}
          onOpenSyncModal={() => setIsSetupModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Tab Views */}
          {currentTab === 'dashboard' && (
            <DashboardOverview onNavigate={handleNavigate} />
          )}

          {currentTab === 'assistant' && (
            <ProtocolAssistant />
          )}

          {currentTab === 'visits' && (
            <DailyVisitList initialPriority={visitPriorityFilter} onNavigate={handleNavigate} />
          )}

          {currentTab === 'history' && (
            <HistoryView onNavigate={handleNavigate} />
          )}

          {currentTab === 'protocols' && (
            <ProtocolExplorer />
          )}

          {currentTab === 'safety' && (
            <SafetyAuditView />
          )}
        </main>
      </div>

      {/* Root-Mounted Offline Protocols Setup Modal */}
      <SetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <VisitProvider>
        <AppContent />
      </VisitProvider>
    </LanguageProvider>
  );
};

export default App;
