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
  Alert
} from 'react-native';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Search,
  X,
  Plus,
  Minus,
  Check,
  Baby,
  Activity,
  Heart,
  Droplet
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  getVisitsOffline,
  completeVisitOffline,
  registerNewPatientOffline,
  getCompletedCount
} from '../storage/db';
import { VisitItem, NewPatientFormData } from '../types';

const VILLAGES = [
  'All',
  'Amrapur',
  'Belwadi Tola',
  'Kesarganj',
  'Dhanpura',
  'Navagaon Khurd',
  'Sitapahari'
];

export const VisitPlannerScreen: React.FC = () => {
  const { language, t, isSunlightMode } = useLanguage();
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<number | undefined>(undefined);
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedCount, setCompletedCount] = useState(0);

  // Mark as Done Modal State
  const [selectedVisitForCompletion, setSelectedVisitForCompletion] = useState<VisitItem | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [dispensedMeds, setDispensedMeds] = useState<{ [id: string]: number }>({});

  // Register New Patient Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regGender, setRegGender] = useState('F');
  const [regAge, setRegAge] = useState('24');
  const [regVillage, setRegVillage] = useState('Amrapur');
  const [regHouseNo, setRegHouseNo] = useState('101');
  const [clinicalTrack, setClinicalTrack] = useState<'anc' | 'infant' | 'malnutrition' | 'ncd'>('anc');
  const [regLmp, setRegLmp] = useState('2026-03-01');
  const [regSystolic, setRegSystolic] = useState('120');
  const [regDiastolic, setRegDiastolic] = useState('80');
  const [regHb, setRegHb] = useState('11.0');
  const [regBirthWeight, setRegBirthWeight] = useState('2.5');
  const [regMuac, setRegMuac] = useState('13.0');
  const [regDangerSigns, setRegDangerSigns] = useState(false);

  // Load visits
  const loadData = async () => {
    const list = await getVisitsOffline({
      priority: selectedPriority,
      village: selectedVillage,
      search: searchQuery
    });
    setVisits(list);
    const count = await getCompletedCount();
    setCompletedCount(count);
  };

  useEffect(() => {
    loadData();
  }, [selectedPriority, selectedVillage, searchQuery]);

  // Handle Complete Visit
  const handleConfirmComplete = async () => {
    if (!selectedVisitForCompletion) return;
    const dispensedList = Object.entries(dispensedMeds).map(([item, qty]) => ({
      item,
      quantity: Number(qty)
    }));

    await completeVisitOffline(
      selectedVisitForCompletion.member_id,
      selectedVisitForCompletion.due_item,
      {
        notes: completionNotes.trim() || undefined,
        dispensed_items: dispensedList.length > 0 ? dispensedList : undefined
      }
    );

    setSelectedVisitForCompletion(null);
    setCompletionNotes('');
    setDispensedMeds({});
    loadData();
    Alert.alert('Visit Logged', 'Completed visit and clinical observations recorded offline.');
  };

  // Handle Register Patient
  const handleSavePatient = async () => {
    if (!regName.trim()) {
      Alert.alert('Required', 'Please enter patient full name.');
      return;
    }

    const formData: NewPatientFormData = {
      name: regName.trim(),
      gender: regGender,
      age: parseInt(regAge) || 24,
      village: regVillage,
      houseNo: regHouseNo.trim() || '101',
      clinicalTrack,
      lmpDate: clinicalTrack === 'anc' ? regLmp : undefined,
      bpSystolic: parseInt(regSystolic) || undefined,
      bpDiastolic: parseInt(regDiastolic) || undefined,
      hbLevel: parseFloat(regHb) || undefined,
      birthWeightKg: parseFloat(regBirthWeight) || undefined,
      muacCm: parseFloat(regMuac) || undefined,
      hasDangerSigns: regDangerSigns
    };

    await registerNewPatientOffline(formData);
    setShowRegisterModal(false);
    setRegName('');
    setRegDangerSigns(false);
    loadData();
    Alert.alert('Patient Registered', 'New member prepended to active visit list and prioritized.');
  };

  // Medicine counter updater
  const updateMedQty = (id: string, delta: number) => {
    setDispensedMeds((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  return (
    <View style={[styles.container, isSunlightMode && styles.sunlightContainer]}>
      {/* Top Header Card with + Register Action */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>{t('tabVisits')}</Text>
            <Text style={styles.headerSub}>346 Household Register Due Visits • Chandrapuri</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowRegisterModal(true)}
            style={styles.registerBtn}
          >
            <UserPlus size={16} color="#fff" />
            <Text style={styles.registerBtnText}>{t('registerPatientBtn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Priority Filter Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setSelectedPriority(undefined)}
            style={[styles.filterChip, selectedPriority === undefined && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, selectedPriority === undefined && styles.filterChipTextActive]}>
              All ({visits.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedPriority(1)}
            style={[styles.filterChip, selectedPriority === 1 && styles.chipP1Active]}
          >
            <AlertTriangle size={14} color={selectedPriority === 1 ? '#fff' : '#dc2626'} />
            <Text style={[styles.filterChipText, selectedPriority === 1 && styles.filterChipTextActive]}>
              P1 High-Risk
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedPriority(2)}
            style={[styles.filterChip, selectedPriority === 2 && styles.chipP2Active]}
          >
            <Calendar size={14} color={selectedPriority === 2 ? '#fff' : '#047857'} />
            <Text style={[styles.filterChipText, selectedPriority === 2 && styles.filterChipTextActive]}>
              P2 Routine
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedPriority(3)}
            style={[styles.filterChip, selectedPriority === 3 && styles.chipP3Active]}
          >
            <Text style={[styles.filterChipText, selectedPriority === 3 && styles.filterChipTextActive]}>
              P3 Upcoming
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Member ID, Name, or Due Item..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Visits List */}
      <FlatList
        data={visits}
        keyExtractor={(item) => `${item.member_id}-${item.due_item}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isP1 = item.priority === 1;
          const isP2 = item.priority === 2;
          return (
            <View style={styles.visitCard}>
              <View style={styles.visitLeft}>
                <View style={[
                  styles.priorityBadge,
                  isP1 ? styles.badgeP1 : isP2 ? styles.badgeP2 : styles.badgeP3
                ]}>
                  <Text style={[
                    styles.priorityBadgeText,
                    isP1 ? styles.textP1 : isP2 ? styles.textP2 : styles.textP3
                  ]}>
                    {isP1 ? 'P1 HIGH-RISK' : isP2 ? 'P2 ROUTINE' : 'P3 UPCOMING'}
                  </Text>
                </View>

                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberMeta}>
                  {item.member_id} • {item.age}y / {item.gender} • House #{item.household_id}
                </Text>

                <View style={styles.dueItemRow}>
                  <Text style={styles.dueLabel}>Due Service:</Text>
                  <Text style={styles.dueValue}>{item.due_item}</Text>
                </View>

                <Text style={styles.villageTag}>📍 {item.village} • {item.service_category}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedVisitForCompletion(item)}
                style={styles.markDoneBtn}
              >
                <CheckCircle2 size={16} color="#047857" />
                <Text style={styles.markDoneText}>{t('markDoneBtn')}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. MARK AS DONE MODAL (WITH DRUG INVENTORY DISPENSING)        */}
      {/* ------------------------------------------------------------- */}
      {selectedVisitForCompletion && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedVisitForCompletion(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Complete Field Visit & Record</Text>
                <TouchableOpacity onPress={() => setSelectedVisitForCompletion(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.patientBanner}>
                  {selectedVisitForCompletion.name} ({selectedVisitForCompletion.member_id}) — {selectedVisitForCompletion.due_item}
                </Text>

                {/* Medicines & Supplies Dispensed */}
                <Text style={styles.modalSectionLabel}>MEDICINES & SUPPLIES DISPENSED (OPTIONAL)</Text>

                {[
                  { id: 'IFA Red Tablets (100mg)', defaultIncrement: 30 },
                  { id: 'Calcium Tablets (500mg)', defaultIncrement: 30 },
                  { id: 'ORS Sachets', defaultIncrement: 2 },
                  { id: 'Zinc Tablets (20mg)', defaultIncrement: 14 },
                  { id: 'Paracetamol Tablets (500mg)', defaultIncrement: 10 }
                ].map((drug) => (
                  <View key={drug.id} style={styles.drugRow}>
                    <Text style={styles.drugName}>{drug.id}</Text>
                    <View style={styles.counterRow}>
                      <TouchableOpacity
                        onPress={() => updateMedQty(drug.id, -1)}
                        style={styles.counterBtn}
                      >
                        <Minus size={14} color="#0F172A" />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{dispensedMeds[drug.id] || 0}</Text>
                      <TouchableOpacity
                        onPress={() => updateMedQty(drug.id, 1)}
                        style={styles.counterBtn}
                      >
                        <Plus size={14} color="#0F172A" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateMedQty(drug.id, drug.defaultIncrement)}
                        style={styles.presetTag}
                      >
                        <Text style={styles.presetText}>+{drug.defaultIncrement}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Clinical Notes */}
                <Text style={[styles.modalSectionLabel, { marginTop: 14 }]}>CLINICAL OBSERVATION NOTES</Text>
                <TextInput
                  value={completionNotes}
                  onChangeText={setCompletionNotes}
                  placeholder="Record observations, maternal vitals, or child feeding behavior..."
                  placeholderTextColor="#94A3B8"
                  style={styles.notesInput}
                  multiline
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={handleConfirmComplete}
                  style={styles.saveCompleteBtn}
                >
                  <Check size={18} color="#fff" />
                  <Text style={styles.btnWhiteText}>Save Summary & Complete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    completeVisitOffline(
                      selectedVisitForCompletion.member_id,
                      selectedVisitForCompletion.due_item
                    );
                    setSelectedVisitForCompletion(null);
                    loadData();
                  }}
                  style={styles.skipBtn}
                >
                  <Text style={styles.skipBtnText}>Skip & Mark Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. REGISTER NEW PATIENT MODAL (FIELD INTAKE)                 */}
      {/* ------------------------------------------------------------- */}
      {showRegisterModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRegisterModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Register New Patient On-the-Fly</Text>
                <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  value={regName}
                  onChangeText={setRegName}
                  placeholder="e.g. Parvati Devi"
                  style={styles.formInput}
                />

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Age</Text>
                    <TextInput
                      value={regAge}
                      onChangeText={setRegAge}
                      keyboardType="numeric"
                      style={styles.formInput}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>House No.</Text>
                    <TextInput
                      value={regHouseNo}
                      onChangeText={setRegHouseNo}
                      style={styles.formInput}
                    />
                  </View>
                </View>

                {/* Village Selection */}
                <Text style={styles.inputLabel}>Village Hamlet</Text>
                <View style={styles.villageChipsRow}>
                  {VILLAGES.filter((v) => v !== 'All').map((vil) => (
                    <TouchableOpacity
                      key={vil}
                      onPress={() => setRegVillage(vil)}
                      style={[styles.vilChip, regVillage === vil && styles.vilChipActive]}
                    >
                      <Text style={[styles.vilChipText, regVillage === vil && styles.vilChipTextActive]}>{vil}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Clinical Track */}
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Clinical Health Track</Text>
                <View style={styles.trackRow}>
                  {[
                    { id: 'anc', label: 'Pregnant (ANC)' },
                    { id: 'infant', label: 'Infant / HBNC' },
                    { id: 'malnutrition', label: 'Malnutrition' },
                    { id: 'ncd', label: 'Adult NCD' }
                  ].map((track) => (
                    <TouchableOpacity
                      key={track.id}
                      onPress={() => setClinicalTrack(track.id as any)}
                      style={[styles.trackChip, clinicalTrack === track.id && styles.trackChipActive]}
                    >
                      <Text style={[styles.trackText, clinicalTrack === track.id && styles.trackTextActive]}>{track.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Clinical Parameters */}
                {clinicalTrack === 'anc' && (
                  <View style={styles.trackDetails}>
                    <Text style={styles.inputLabel}>LMP Date (YYYY-MM-DD)</Text>
                    <TextInput
                      value={regLmp}
                      onChangeText={setRegLmp}
                      style={styles.formInput}
                    />
                    <Text style={styles.helperText}>Auto-calculates EDD = LMP + 280 days</Text>
                  </View>
                )}

                {clinicalTrack === 'malnutrition' && (
                  <View style={styles.trackDetails}>
                    <Text style={styles.inputLabel}>MUAC Tape (cm)</Text>
                    <TextInput
                      value={regMuac}
                      onChangeText={setRegMuac}
                      keyboardType="numeric"
                      style={styles.formInput}
                    />
                    <Text style={styles.helperText}>&lt; 11.5 cm = SAM (Auto P1 High-Risk)</Text>
                  </View>
                )}

                {/* Danger Signs Checkbox */}
                <TouchableOpacity
                  onPress={() => setRegDangerSigns(!regDangerSigns)}
                  style={[styles.dangerBox, regDangerSigns && styles.dangerBoxActive]}
                >
                  <AlertTriangle size={18} color={regDangerSigns ? '#dc2626' : '#64748B'} />
                  <Text style={[styles.dangerText, regDangerSigns && { color: '#991B1B' }]}>
                    Patient exhibits danger signs (Heavy bleeding, fits, high fever, or shock) — Auto P1
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={handleSavePatient}
                  style={styles.saveCompleteBtn}
                >
                  <Check size={18} color="#fff" />
                  <Text style={styles.btnWhiteText}>Save & Prepend to Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  sunlightContainer: {
    backgroundColor: '#ffffff'
  },
  headerCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#047857',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minHeight: 40
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12
  },
  filterChipActive: {
    backgroundColor: '#0F172A'
  },
  chipP1Active: {
    backgroundColor: '#DC2626'
  },
  chipP2Active: {
    backgroundColor: '#047857'
  },
  chipP3Active: {
    backgroundColor: '#475569'
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  filterChipTextActive: {
    color: '#fff'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    padding: 0
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12
  },
  visitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  visitLeft: {
    flex: 1,
    marginRight: 10
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6
  },
  badgeP1: {
    backgroundColor: '#FEE2E2'
  },
  badgeP2: {
    backgroundColor: '#ECFDF5'
  },
  badgeP3: {
    backgroundColor: '#F1F5F9'
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  textP1: {
    color: '#B91C1C'
  },
  textP2: {
    color: '#047857'
  },
  textP3: {
    color: '#475569'
  },
  memberName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  memberMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  dueItemRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6
  },
  dueLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  dueValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857'
  },
  villageTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4
  },
  markDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minHeight: 40
  },
  markDoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalBody: {
    paddingVertical: 12
  },
  patientBanner: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8
  },
  drugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  drugName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  counterValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 20,
    textAlign: 'center'
  },
  presetTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6
  },
  presetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857'
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 60,
    textAlignVertical: 'top'
  },
  modalFooter: {
    flexDirection: 'column',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  saveCompleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#047857',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44
  },
  btnWhiteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8
  },
  skipBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600'
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10
  },
  twoColRow: {
    flexDirection: 'row'
  },
  villageChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  vilChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  vilChipActive: {
    backgroundColor: '#047857'
  },
  vilChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600'
  },
  vilChipTextActive: {
    color: '#fff',
    fontWeight: '700'
  },
  trackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  trackChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  trackChipActive: {
    backgroundColor: '#047857'
  },
  trackText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600'
  },
  trackTextActive: {
    color: '#fff',
    fontWeight: '700'
  },
  trackDetails: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10
  },
  helperText: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '600'
  },
  dangerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6
  },
  dangerBoxActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5'
  },
  dangerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    flex: 1
  }
});
