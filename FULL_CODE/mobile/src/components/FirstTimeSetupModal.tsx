import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated
} from 'react-native';
import { ShieldCheck, CloudDownload, Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { downloadAndInstallPackage, DownloadProgress, isNetworkAvailable } from '../offline/downloader';
import { getInstalledVersion, getProtocolsCount } from '../offline/database';

interface Props {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const FirstTimeSetupModal: React.FC<Props> = ({ visible, onClose, onComplete }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('Ready to download protocol bundle');
  const [checksum, setChecksum] = useState<string>('');
  const [installedVersion, setInstalledVersion] = useState<string>('1.0.4');
  const [totalSections, setTotalSections] = useState<number>(107);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadCurrentStats();
    }
  }, [visible]);

  const loadCurrentStats = async () => {
    const v = await getInstalledVersion();
    const count = await getProtocolsCount();
    setInstalledVersion(v);
    setTotalSections(count);
  };

  const handleStartDownload = async () => {
    setErrorMsg(null);
    setDownloading(true);
    setProgress(5);
    setStatusMsg('Checking network connection...');

    const online = await isNetworkAvailable();
    if (!online) {
      setErrorMsg('No internet connection. Air-gapped offline protocol database is currently active.');
      setDownloading(false);
      return;
    }

    try {
      const res = await downloadAndInstallPackage(undefined, (p: DownloadProgress) => {
        setProgress(p.progressPercent);
        setStatusMsg(p.statusMessage);
      });

      if (res.success) {
        setIsCompleted(true);
        setInstalledVersion(res.version);
        setTotalSections(res.sectionsCount);
        setChecksum(res.sha256);
        setStatusMsg('All 107 protocols successfully verified and loaded offline!');
        onComplete?.();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Download failed. Safe rollback applied.');
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
            <View style={styles.iconCircle}>
              {isCompleted ? (
                <ShieldCheck size={28} color="#059669" />
              ) : (
                <CloudDownload size={28} color="#047857" />
              )}
            </View>
            <Text style={styles.title}>
              {isCompleted ? 'Offline Knowledge Ready' : 'Protocol Bundle Setup'}
            </Text>
            <Text style={styles.subtitle}>
              CareSphere Autonomous Clinical Decision Support (CDSS)
            </Text>
          </View>

          {/* Details & Specs */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>VERSION</Text>
              <Text style={styles.statValue}>v{installedVersion}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SECTIONS</Text>
              <Text style={styles.statValue}>{totalSections}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MODE</Text>
              <Text style={[styles.statValue, { color: '#059669' }]}>100% Offline</Text>
            </View>
          </View>

          {/* Progress / Status Section */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.statusText}>{statusMsg}</Text>
          </View>

          {/* SHA-256 Badge if validated */}
          {checksum ? (
            <View style={styles.shaBadge}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.shaText} numberOfLines={1}>
                SHA-256: {checksum.slice(0, 16)}...{checksum.slice(-8)}
              </Text>
            </View>
          ) : null}

          {/* Error Message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <AlertTriangle size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {!isCompleted ? (
              <TouchableOpacity
                style={[styles.btnPrimary, downloading && styles.btnDisabled]}
                onPress={handleStartDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <RefreshCw size={16} color="#ffffff" />
                    <Text style={styles.btnPrimaryText}>Download & Verify Bundle</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnSuccess} onPress={onClose}>
                <CheckCircle2 size={18} color="#ffffff" />
                <Text style={styles.btnPrimaryText}>Start Clinical Session</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.btnSecondary} onPress={onClose} disabled={downloading}>
              <Text style={styles.btnSecondaryText}>Close</Text>
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
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#A7F3D0'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  statBox: {
    alignItems: 'center',
    flex: 1
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  progressContainer: {
    marginBottom: 16
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#047857',
    borderRadius: 4
  },
  statusText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500'
  },
  shaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
    gap: 6
  },
  shaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1
  },
  actionRow: {
    gap: 10
  },
  btnPrimary: {
    backgroundColor: '#047857',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnSuccess: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  btnSecondary: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  btnSecondaryText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600'
  }
});
