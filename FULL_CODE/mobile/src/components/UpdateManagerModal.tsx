import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import {
  RefreshCw,
  Server,
  ShieldCheck,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react-native';
import { checkUpdateStatus, downloadAndInstallPackage, SyncStatus, DownloadProgress } from '../offline/downloader';
import { getInstalledVersion, getProtocolsCount } from '../offline/database';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const UpdateManagerModal: React.FC<Props> = ({ visible, onClose, onUpdated }) => {
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string>('1.0.4');
  const [totalSections, setTotalSections] = useState<number>(107);
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadStatsAndCheck();
    }
  }, [visible]);

  const loadStatsAndCheck = async () => {
    setErrorMsg(null);
    setChecking(true);
    try {
      const v = await getInstalledVersion();
      const count = await getProtocolsCount();
      setInstalledVersion(v);
      setTotalSections(count);

      const status = await checkUpdateStatus();
      setSyncStatus(status);
      if (status.online) {
        if (status.updateAvailable) {
          setUpdateMessage(`New version v${status.latestVersion} available for sync.`);
        } else {
          setUpdateMessage('All protocols are up-to-date with cloud release.');
        }
      } else {
        setUpdateMessage('Operating in air-gapped offline mode. Database active.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to check cloud update status.');
    } finally {
      setChecking(false);
    }
  };

  const handleApplyUpdate = async () => {
    setErrorMsg(null);
    setUpdating(true);
    setProgress(5);

    try {
      const result = await downloadAndInstallPackage(undefined, (p: DownloadProgress) => {
        setProgress(p.progressPercent);
        setUpdateMessage(p.statusMessage);
      });

      if (result.success) {
        setInstalledVersion(result.version);
        setTotalSections(result.sectionsCount);
        setUpdateMessage(`Protocols updated atomically to v${result.version} (${result.sectionsCount} sections)`);
        await loadStatsAndCheck();
        onUpdated?.();
      }
    } catch (err: any) {
      setErrorMsg(`Update aborted: ${err.message}. Seamlessly retained active protocols.`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.titleWithIcon}>
                <Database size={22} color="#047857" />
                <Text style={styles.title}>Update Manager</Text>
              </View>
              <View
                style={[
                  styles.networkBadge,
                  syncStatus?.online ? styles.netOnline : styles.netOffline
                ]}
              >
                {syncStatus?.online ? (
                  <>
                    <Wifi size={12} color="#059669" />
                    <Text style={styles.netOnlineText}>Online</Text>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} color="#64748B" />
                    <Text style={styles.netOfflineText}>Offline</Text>
                  </>
                )}
              </View>
            </View>
            <Text style={styles.subtitle}>
              Atomic Differential Sync & Version Verification
            </Text>
          </View>

          {/* Version Comparison Matrix */}
          <View style={styles.versionCard}>
            <View style={styles.versionCol}>
              <Text style={styles.colLabel}>INSTALLED CLIENT</Text>
              <Text style={styles.colVersion}>v{installedVersion}</Text>
              <Text style={styles.colCount}>{totalSections} leaf sections</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.versionCol}>
              <Text style={styles.colLabel}>LATEST CLOUD</Text>
              <Text style={styles.colVersion}>
                v{syncStatus?.latestVersion || installedVersion}
              </Text>
              <Text style={styles.colCount}>
                {syncStatus?.manifest?.total_protocol_sections || totalSections} leaf sections
              </Text>
            </View>
          </View>

          {/* Sync Status Banner */}
          <View
            style={[
              styles.statusBanner,
              syncStatus?.updateAvailable ? styles.statusUpdate : styles.statusSynced
            ]}
          >
            {syncStatus?.updateAvailable ? (
              <AlertCircle size={18} color="#D97706" />
            ) : (
              <CheckCircle2 size={18} color="#059669" />
            )}
            <Text style={styles.bannerText}>
              {updateMessage || 'Protocols verified and cached in SQLite.'}
            </Text>
          </View>

          {/* Atomic Safety Notice */}
          <View style={styles.safetyNotice}>
            <ShieldCheck size={16} color="#047857" />
            <Text style={styles.safetyText}>
              Atomic Staging Guarantee: If connection fails or checksum mismatches, your current active database is preserved without disruption.
            </Text>
          </View>

          {/* Error Message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Progress bar if updating */}
          {updating ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}% completed</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={loadStatsAndCheck}
              disabled={checking || updating}
            >
              {checking ? (
                <ActivityIndicator size="small" color="#047857" />
              ) : (
                <>
                  <RefreshCw size={15} color="#047857" />
                  <Text style={styles.refreshBtnText}>Check Cloud</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.syncBtn,
                (!syncStatus?.online || updating) && styles.syncBtnDisabled
              ]}
              onPress={handleApplyUpdate}
              disabled={!syncStatus?.online || updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.syncBtnText}>
                  {syncStatus?.updateAvailable ? 'Sync New Version' : 'Re-verify Staging'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={updating}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
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
    maxWidth: 440,
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
    marginBottom: 16
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B'
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  netOnline: {
    backgroundColor: '#ECFDF5'
  },
  netOnlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  netOffline: {
    backgroundColor: '#F1F5F9'
  },
  netOfflineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  versionCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14
  },
  versionCol: {
    flex: 1,
    alignItems: 'center'
  },
  divider: {
    width: 1,
    backgroundColor: '#CBD5E1'
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2
  },
  colVersion: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  colCount: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12
  },
  statusSynced: {
    backgroundColor: '#ECFDF5'
  },
  statusUpdate: {
    backgroundColor: '#FEF3C7'
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1
  },
  safetyNotice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16
  },
  safetyText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 16
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C'
  },
  progressContainer: {
    marginBottom: 14
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#047857',
    borderRadius: 3
  },
  progressText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center'
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8
  },
  refreshBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#ffffff'
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  syncBtn: {
    flex: 1.5,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10
  },
  syncBtnDisabled: {
    opacity: 0.5
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  closeBtn: {
    paddingVertical: 8,
    alignItems: 'center'
  },
  closeBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600'
  }
});
