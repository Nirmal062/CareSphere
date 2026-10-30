import React, { useState, useEffect } from 'react';
import { 
  CloudDownload, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X,
  FileCheck2
} from 'lucide-react';
import { CareSphereDB } from '../services/CareSphereDB';
import { useLanguage } from '../context/LanguageContext';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose, onSyncComplete }) => {
  const { language } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Ready for offline protocol bundle installation');
  const [checksum, setChecksum] = useState('9ea5cdeaa2de4410cb7c78e997e2e5a5b52730591bde1c6e28be83f156515b43');
  const [version, setVersion] = useState('1.0.4');
  const [totalSections, setTotalSections] = useState(107);
  const [isReady, setIsReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkState() {
      const meta = await CareSphereDB.getSyncMetadata();
      const count = await CareSphereDB.getProtocolsCount();
      if (meta && count >= 107) {
        setIsReady(true);
        setVersion(meta.version);
        setChecksum(meta.checksum);
        setTotalSections(count);
        setStatusMsg('100% Offline Ready (All 107 Protocols Installed)');
      }
    }
    checkState();
  }, [isOpen]);

  const handleStartDownload = async () => {
    setErrorMsg(null);
    setDownloading(true);
    setProgress(5);
    setStatusMsg('Connecting to protocol distribution service...');

    try {
      const res = await CareSphereDB.downloadAndVerifyKnowledgePackage((pct, msg) => {
        setProgress(pct);
        setStatusMsg(msg);
      });

      if (res.success) {
        setIsReady(true);
        setVersion(res.version);
        setTotalSections(res.total_sections);
        setChecksum(res.checksum);
        setStatusMsg('100% Offline Ready (All 107 Protocols Verified & Stored)');
        onSyncComplete?.();
      }
    } catch (err: any) {
      console.error('Download package error:', err);
      setErrorMsg(err.message || 'Offline package sync failed. Retrying fallback...');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-2 border-emerald-600/30 shadow-2xl max-w-lg w-full overflow-hidden p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
              isReady 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-emerald-50 text-[#047857] border border-emerald-200'
            }`}>
              {isReady ? <ShieldCheck className="w-7 h-7" /> : <CloudDownload className="w-7 h-7" />}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#047857] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {isReady ? '100% Offline Ready' : 'Protocol Synchronization'}
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                {language === 'te' 
                  ? 'ఫ్రంట్‌లైన్ క్లినికల్ ప్రోటోకాల్ సెటప్'
                  : language === 'hi'
                  ? 'ऑफलाइन स्वास्थ्य प्रोटोकॉल सेटअप'
                  : 'First-Time Offline Knowledge Setup'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {language === 'te'
            ? 'కేర్‌స్పియర్ గ్రామీణ సబ్-సెంటర్లలో ఇంటర్నెట్ లేకుండా పనిచేస్తుంది. 9 అధికారిక మార్గదర్శకాలలోని 107 లీఫ్ సెక్షన్లను బ్రౌజర్ స్టోరేజీలోకి డౌన్‌లోడ్ చేసుకోండి.'
            : language === 'hi'
            ? 'केयरस्फेयर पूरी तरह से ऑफलाइन काम करता है। 9 आधिकारिक स्वास्थ्य दिशानिर्देशों के 107 लीफ सेक्शंस को स्थानीय स्टोरेज में इंस्टॉल करें।'
            : 'CareSphere operates 100% offline in rural sub-centres. Verify and commit the approved 9 Government of India protocol documents (107 leaf sections) directly into local IndexedDB storage.'}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Dataset Version</span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>v{version} (Production)</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Protocol Sections</span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{totalSections} Leaf Sections</span>
            </div>
          </div>

          <div className="col-span-2 space-y-0.5 pt-1 border-t border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">SHA-256 Checksum</span>
            <div className="font-mono text-[10px] text-slate-700 truncate select-all bg-white p-1.5 rounded-lg border border-slate-200">
              {checksum}
            </div>
          </div>
        </div>

        {/* Progress Bar during download */}
        {downloading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing Package...</span>
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div 
                className="bg-[#047857] h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {statusMsg}
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success message */}
        {isReady && !downloading && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Offline Ready: All 107 verified protocol leaf sections are safely stored locally!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
          >
            {isReady ? 'Close & Continue' : 'Dismiss'}
          </button>

          <button
            onClick={handleStartDownload}
            disabled={downloading}
            className="px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#035f45] text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <CloudDownload className="w-4 h-4" />
            <span>{isReady ? 'Re-Verify Package' : 'Download Offline Package'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
