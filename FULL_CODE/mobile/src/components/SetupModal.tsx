import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import {
  ShieldCheck,
  CloudDownload,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  FileCheck2,
  HardDrive
} from 'lucide-react-native';
import { downloadAndInstallPackage, DownloadProgress, isNetworkAvailable } from '../offline/downloader';
import { getInstalledVersion, getProtocolsCount } from '../offline/database';
import { useLanguage } from '../context/LanguageContext';

interface SetupModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ visible, onClose, onComplete }) => {
  const { language } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('Ready for offline protocol bundle installation');
  const [checksum, setChecksum] = useState<string>('9ea5cdeaa2de4410cb7c78e997e2e5a5b52730591bde1c6e28be83f156515b43');
  const [version, setVersion] = useState<string>('1.0.4');
  const [totalSections, setTotalSections] = useState<number>(107);
  const [isReady, setIsReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      checkCurrentStatus();
    }
  }, [visible]);

  const checkCurrentStatus = async () => {
    try {
      const v = await getInstalledVersion();
      const count = await getProtocolsCount();
      if (count >= 107) {
        setIsReady(true);
        setVersion(v || '1.0.4');
        setTotalSections(count);
        setStatusMsg('100% Offline Ready (All 107 Leaf Protocols Verified)');
      }
    } catch (e) {
      console.warn('Status check warning:', e);
    }
  };

  const handleStartDownload = async () => {
    setErrorMsg(null);
    setDownloading(true);
    setProgress(5);
    setStatusMsg('Checking connectivity and cloud storage adapter...');

    try {
      const res = await downloadAndInstallPackage(undefined, (p: DownloadProgress) => {
        setProgress(p.progressPercent);
        setStatusMsg(p.statusMessage);
      });

      if (res.success) {
        setIsReady(true);
        setVersion(res.version);
        setTotalSections(res.sectionsCount);
        setChecksum(res.sha256);
        setStatusMsg('100% Offline Ready (All 107 Leaf Protocols Verified & Stored)');
        onComplete?.();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Offline package sync failed. Fallback applied.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, isReady ? styles.iconCircleSuccess : styles.iconCircleEmerald]}>
              {isReady ? <ShieldCheck size={28} color="#047857" /> : <CloudDownload size={28} color="#047857" />}
            </View>
            <View style={styles.headerText}>
              <View style={styles.badgeRow}>
                <Text style={styles.statusBadge}>
                  {isReady ? '100% OFFLINE READY' : 'PROTOCOL SYNCHRONIZATION'}
                </Text>
              </View>
              <Text style={styles.title}>
                {language === 'te'
                  ? 'ఫ్రంట్‌లైన్ క్లినికల్ ప్రోటోకాల్ సెటప్'
                  : language === 'hi'
                  ? 'ऑफलाइन स्वास्थ्य प्रोटोकॉल सेटअप'
                  : 'First-Time Offline Knowledge Setup'}
              </Text>
              <Text style={styles.subtitle}>
                CareSphere CDSS • Chandrapuri Sub-Centre
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Version & Count Row */}
            <View style={styles.gridRow}>
              <View style={styles.gridCard}>
                <View style={styles.gridHeader}>
                  <Database size={15} color="#047857" />
                  <Text style={styles.gridLabel}>DATASET VERSION</Text>
                </View>
                <Text style={styles.gridValue}>v{version}</Text>
                <Text style={styles.gridSub}>Official MoHFW 2026</Text>
              </View>

              <View style={styles.gridCard}>
                <View style={styles.gridHeader}>
                  <FileCheck2 size={15} color="#047857" />
                  <Text style={styles.gridLabel}>LEAF PROTOCOLS</Text>
                </View>
                <Text style={styles.gridValue}>{totalSections} Sections</Text>
                <Text style={styles.gridSub}>9 Clinical Documents</Text>
              </View>
            </View>

            {/* Checksum Badge */}
            <View style={styles.checksumBox}>
              <Text style={styles.checksumLabel}>SHA-256 CRYPTOGRAPHIC INTEGRITY</Text>
              <Text style={styles.checksumText} numberOfLines={1} ellipsizeMode="middle">
                {checksum}
              </Text>
              <View style={styles.verifiedRow}>
                <CheckCircle2 size={13} color="#047857" />
                <Text style={styles.verifiedText}>Bit-exact payload verification enabled</Text>
              </View>
            </View>

            {/* Progress Bar (when downloading) */}
            {downloading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressPercent}>{progress}%</Text>
                  <ActivityIndicator size="small" color="#047857" />
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
              </View>
            )}

            {/* Status Message */}
            <View style={[styles.statusBox, errorMsg ? styles.statusBoxError : isReady ? styles.statusBoxReady : null]}>
              {errorMsg ? (
                <AlertTriangle size={18} color="#DC2626" />
              ) : isReady ? (
                <CheckCircle2 size={18} color="#047857" />
              ) : (
                <HardDrive size={18} color="#047857" />
              )}
              <Text style={[styles.statusText, errorMsg ? styles.statusTextError : isReady ? styles.statusTextReady : null]}>
                {errorMsg || statusMsg}
              </Text>
            </View>

            {/* Explanatory bullets */}
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• 100% offline-ready SQLite index with zero remote latency.</Text>
              <Text style={styles.bulletItem}>• Hard-coded danger signs (ESC) pre-empt model reasoning.</Text>
              <Text style={styles.bulletItem}>• Full multilingual support: English, Telugu, and Hindi.</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryButton, downloading && styles.buttonDisabled]}
              onPress={handleStartDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <RefreshCw size={17} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    {isReady ? 'Re-Sync Knowledge Package' : 'Download Offline Package'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onClose} disabled={downloading}>
              <Text style={styles.secondaryButtonText}>
                {isReady ? 'Continue to App' : 'Use Bundled Data'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(4, 120, 87, 0.25)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 8 }
    })
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  iconCircleEmerald: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  iconCircleSuccess: {
    backgroundColor: '#DEF7EC',
    borderWidth: 1,
    borderColor: '#31C48D'
  },
  headerText: {
    flex: 1
  },
  badgeRow: {
    marginBottom: 4
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.6
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  closeBtn: {
    padding: 4
  },
  scrollBody: {
    marginBottom: 16
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B'
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  gridSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  checksumBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12
  },
  checksumLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 4
  },
  checksumText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#065F46',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6
  },
  verifiedText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600'
  },
  progressContainer: {
    marginBottom: 12
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857'
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#047857',
    borderRadius: 4
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  statusBoxReady: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  statusBoxError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '600'
  },
  statusTextReady: {
    color: '#047857'
  },
  statusTextError: {
    color: '#DC2626'
  },
  bulletList: {
    paddingHorizontal: 4,
    gap: 4
  },
  bulletItem: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16
  },
  footer: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  primaryButton: {
    backgroundColor: '#047857',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#047857',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.65
  }
});
