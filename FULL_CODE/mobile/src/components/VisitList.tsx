import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
  Plus,
  Minus,
  Check,
  Baby,
  Activity,
  Heart,
  Droplet,
  Calendar,
  Clock,
  Filter
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  getVisitsOffline,
  completeVisitOffline,
  getCompletedCount
} from '../storage/db';
import { VisitItem } from '../types';

const VILLAGES = [
  'All',
  'Amrapur',
  'Belwadi Tola',
  'Kesarganj',
  'Dhanpura',
  'Navagaon Khurd',
  'Sitapahari'
];

interface VisitListProps {
  initialPriority?: number;
  onNavigateDetail?: (visit: VisitItem) => void;
}

export const VisitList: React.FC<VisitListProps> = ({ initialPriority, onNavigateDetail }) => {
  const { language, t } = useLanguage();
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<number | undefined>(initialPriority);
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedCount, setCompletedCount] = useState(0);

  // Mark as Done Modal State
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [activeVisit, setActiveVisit] = useState<VisitItem | null>(null);
  const [notes, setNotes] = useState('');
  const [dispensedMeds, setDispensedMeds] = useState<{ [id: string]: number }>({
    'IFA Tablets': 30,
    'Calcium (500mg)': 30,
    'Zinc & ORS': 0
  });

  const loadVisits = async () => {
    try {
      const data = await getVisitsOffline({
        priority: selectedPriority,
        village: selectedVillage,
        search: searchQuery
      });
      setVisits(data);
      const count = await getCompletedCount();
      setCompletedCount(count);
    } catch (e) {
      console.warn('Error loading visits:', e);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [selectedPriority, selectedVillage, searchQuery]);

  const handleOpenCompletion = (item: VisitItem) => {
    setActiveVisit(item);
    setNotes('');
    setCompletionModalVisible(true);
  };

  const handleConfirmCompletion = async () => {
    if (!activeVisit) return;
    try {
      const dispensedList = Object.entries(dispensedMeds).map(([item, qty]) => ({
        item,
        quantity: Number(qty)
      }));

      await completeVisitOffline(activeVisit.member_id, activeVisit.due_item, notes, dispensedList);
      setCompletionModalVisible(false);
      setActiveVisit(null);
      await loadVisits();
      Alert.alert(
        language === 'te' ? 'పూర్తయింది' : 'Visit Verified',
        language === 'te' ? 'గృహ సందర్శన రికార్డు ఆఫ్‌లైన్‌లో నిల్వ చేయబడింది.' : 'Household visit successfully archived in offline audit trail.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not complete visit.');
    }
  };

  const updateMedQty = (med: string, delta: number) => {
    setDispensedMeds(prev => ({
      ...prev,
      [med]: Math.max(0, (prev[med] || 0) + delta)
    }));
  };

  const p1Count = visits.filter(v => v.priority === 1).length;
  const p2Count = visits.filter(v => v.priority === 2).length;
  const p3Count = visits.filter(v => v.priority === 3).length;

  const renderVisitCard = ({ item }: { item: VisitItem }) => {
    const isP1 = item.priority === 1;
    const isP2 = item.priority === 2;

    const badgeBg = isP1 ? '#FEF2F2' : isP2 ? '#FFFBEB' : '#F0F9FF';
    const badgeBorder = isP1 ? '#FECACA' : isP2 ? '#FDE68A' : '#BAE6FD';
    const badgeTextColor = isP1 ? '#DC2626' : isP2 ? '#D97706' : '#0284C7';

    return (
      <View style={[styles.card, isP1 && styles.cardP1]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            {isP1 && <AlertTriangle size={12} color="#DC2626" />}
            <Text style={[styles.priorityBadgeText, { color: badgeTextColor }]}>
              {isP1 ? 'PRIORITY 1 • HIGH RISK' : isP2 ? 'PRIORITY 2 • ROUTINE' : 'PRIORITY 3 • UPCOMING'}
            </Text>
          </View>
          <Text style={styles.villageTag}>{item.village}</Text>
        </View>

        {/* Member Name and ID */}
        <View style={styles.nameRow}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.memberIdText}>{item.member_id}</Text>
        </View>

        {/* Household Info */}
        <Text style={styles.householdSub}>
          {item.relation ? `${item.relation} of ${item.head_name || 'Head'}` : 'Household Member'} • House #{item.house_no || '101'}
        </Text>

        {/* Due Service Tag */}
        <View style={styles.serviceBox}>
          <Clock size={13} color="#047857" />
          <Text style={styles.serviceText}>
            Due: <Text style={styles.serviceBold}>{item.due_item}</Text> ({item.service_category})
          </Text>
        </View>

        {/* Clinical Indicators Pills */}
        <View style={styles.indicatorsRow}>
          {item.pregnant === 'Y' && (
            <View style={[styles.indicatorPill, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
              <Text style={[styles.indicatorText, { color: '#BE185D' }]}>Pregnant (EDD: {item.edd || 'TBD'})</Text>
            </View>
          )}
          {Boolean(item.last_anc_bp) && (
            <View style={[styles.indicatorPill, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Heart size={11} color="#DC2626" />
              <Text style={[styles.indicatorText, { color: '#B91C1C' }]}>BP {item.last_anc_bp}</Text>
            </View>
          )}
          {Boolean(item.last_hb_gdl) && (
            <View style={[styles.indicatorPill, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
              <Droplet size={11} color="#C2410C" />
              <Text style={[styles.indicatorText, { color: '#C2410C' }]}>Hb {item.last_hb_gdl} g/dL</Text>
            </View>
          )}
          {Boolean(item.birth_weight_kg) && (
            <View style={[styles.indicatorPill, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Baby size={11} color="#15803D" />
              <Text style={[styles.indicatorText, { color: '#15803D' }]}>{item.birth_weight_kg} kg</Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => handleOpenCompletion(item)}
            activeOpacity={0.75}
          >
            <CheckCircle2 size={16} color="#FFFFFF" />
            <Text style={styles.completeBtnText}>Mark Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Search size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID, village, or due item..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Priority Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, selectedPriority === undefined && styles.tabActive]}
          onPress={() => setSelectedPriority(undefined)}
        >
          <Text style={[styles.tabText, selectedPriority === undefined && styles.tabTextActive]}>
            All ({visits.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedPriority === 1 && styles.tabActiveP1]}
          onPress={() => setSelectedPriority(1)}
        >
          <Text style={[styles.tabText, selectedPriority === 1 && styles.tabTextActiveP1]}>
            P1 High Risk ({p1Count})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedPriority === 2 && styles.tabActiveP2]}
          onPress={() => setSelectedPriority(2)}
        >
          <Text style={[styles.tabText, selectedPriority === 2 && styles.tabTextActiveP2]}>
            P2 Routine ({p2Count})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedPriority === 3 && styles.tabActiveP3]}
          onPress={() => setSelectedPriority(3)}
        >
          <Text style={[styles.tabText, selectedPriority === 3 && styles.tabTextActiveP3]}>
            P3 ({p3Count})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Village Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.villageScroll} contentContainerStyle={styles.villageScrollContent}>
        {VILLAGES.map(village => (
          <TouchableOpacity
            key={village}
            style={[styles.villageChip, selectedVillage === village && styles.villageChipActive]}
            onPress={() => setSelectedVillage(village)}
          >
            <Text style={[styles.villageChipText, selectedVillage === village && styles.villageChipTextActive]}>
              {village}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Patient Visits List */}
      <FlatList
        data={visits}
        keyExtractor={item => `${item.member_id}-${item.due_item}`}
        renderItem={renderVisitCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Pending Visits</Text>
            <Text style={styles.emptySubtitle}>All scheduled tasks for this filter have been satisfied.</Text>
          </View>
        }
      />

      {/* Completion Modal */}
      <Modal visible={completionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Complete Household Visit</Text>
                <Text style={styles.modalSub}>{activeVisit?.name} • {activeVisit?.member_id}</Text>
              </View>
              <TouchableOpacity onPress={() => setCompletionModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionLabel}>DISPENSED MEDICATIONS</Text>
              {Object.keys(dispensedMeds).map(med => (
                <View key={med} style={styles.medRow}>
                  <Text style={styles.medName}>{med}</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity onPress={() => updateMedQty(med, -5)} style={styles.counterBtn}>
                      <Minus size={14} color="#047857" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{dispensedMeds[med]}</Text>
                    <TouchableOpacity onPress={() => updateMedQty(med, 5)} style={styles.counterBtn}>
                      <Plus size={14} color="#047857" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>CLINICAL OBSERVATIONS & NOTES</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Record maternal BP, infant feeding, or referral status..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmCompletion}>
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Save Offline Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tabActive: {
    backgroundColor: '#047857',
    borderColor: '#047857'
  },
  tabActiveP1: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626'
  },
  tabActiveP2: {
    backgroundColor: '#D97706',
    borderColor: '#D97706'
  },
  tabActiveP3: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  tabTextActiveP1: {
    color: '#FFFFFF'
  },
  tabTextActiveP2: {
    color: '#FFFFFF'
  },
  tabTextActiveP3: {
    color: '#FFFFFF'
  },
  villageScroll: {
    maxHeight: 38,
    marginBottom: 8
  },
  villageScrollContent: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center'
  },
  villageChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  villageChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  villageChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  villageChipTextActive: {
    color: '#047857',
    fontWeight: '700'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 }
    })
  },
  cardP1: {
    borderColor: '#FECACA'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  villageTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  memberIdText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  householdSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8
  },
  serviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8
  },
  serviceText: {
    fontSize: 12,
    color: '#065F46'
  },
  serviceBold: {
    fontWeight: '800',
    color: '#047857'
  },
  indicatorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  indicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: '700'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8
  },
  completeBtn: {
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155'
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  modalBody: {
    marginBottom: 16
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  medName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B'
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  counterValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 24,
    textAlign: 'center'
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 70
  },
  modalFooter: {
    paddingTop: 8
  },
  confirmBtn: {
    backgroundColor: '#047857',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
