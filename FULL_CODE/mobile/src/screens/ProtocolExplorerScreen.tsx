import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal
} from 'react-native';
import {
  BookOpen,
  Search,
  ChevronRight,
  X,
  Sparkles,
  AlertTriangle,
  Clock,
  Pill,
  CheckCircle2
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { allProtocolSectionsList } from '../engine/protocolEngine';
import { ProtocolSection } from '../types';

const CATEGORIES = [
  'All',
  'ANC (Maternal)',
  'HBNC (Newborn)',
  'CHD (Child Health)',
  'IMM (Immunization)',
  'NUT (Malnutrition)',
  'NCD (Chronic)',
  'ESC (Emergency)'
];

export const ProtocolExplorerScreen: React.FC = () => {
  const { isSunlightMode } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [activeSection, setActiveSection] = useState<ProtocolSection | null>(null);

  const filteredSections = allProtocolSectionsList.filter((sec) => {
    if (selectedCat !== 'All') {
      const prefix = selectedCat.split(' ')[0];
      if (!sec.section_id.startsWith(prefix)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        sec.section_id.toLowerCase().includes(q) ||
        sec.title.toLowerCase().includes(q) ||
        sec.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={[styles.container, isSunlightMode && styles.sunlightContainer]}>
      {/* Top Search Bar & Category Filter */}
      <View style={styles.topHeader}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search 107 Leaf Protocols (e.g. ANC-1.2, ORS, KMC)..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCat(cat)}
              style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
            >
              <Text style={[styles.catChipText, selectedCat === cat && styles.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Protocol Leaf List */}
      <FlatList
        data={filteredSections}
        keyExtractor={(item) => item.section_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveSection(item)}
            style={styles.protocolCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>{item.section_id}</Text>
              </View>
              <Text style={styles.docTitle}>{item.doc_title || 'MoHFW Protocol'}</Text>
            </View>

            <Text style={styles.protocolTitle}>{item.title}</Text>
            <Text style={styles.protocolExcerpt} numberOfLines={2}>
              {item.clinical_actions?.[0] || item.content}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={styles.readMoreText}>View Deep Clinical Guidance</Text>
              <ChevronRight size={14} color="#047857" />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail Modal */}
      {activeSection && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setActiveSection(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>{activeSection.section_id}</Text>
                  </View>
                  <Text style={styles.modalHeading}>{activeSection.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveSection(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Timeline */}
                {activeSection.target_timeline && (
                  <View style={styles.detailBlock}>
                    <View style={styles.blockTitleRow}>
                      <Clock size={14} color="#047857" />
                      <Text style={styles.blockTitle}>TARGET CLINICAL TIMELINE</Text>
                    </View>
                    <Text style={styles.blockContent}>{activeSection.target_timeline}</Text>
                  </View>
                )}

                {/* Step by step actions */}
                {activeSection.clinical_actions && activeSection.clinical_actions.length > 0 && (
                  <View style={styles.detailBlock}>
                    <View style={styles.blockTitleRow}>
                      <Sparkles size={14} color="#047857" />
                      <Text style={styles.blockTitle}>STEP-BY-STEP CLINICAL ACTIONS</Text>
                    </View>
                    {activeSection.clinical_actions.map((act, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{act}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Medications */}
                {activeSection.prescribed_meds && activeSection.prescribed_meds.length > 0 && (
                  <View style={styles.detailBlock}>
                    <View style={styles.blockTitleRow}>
                      <Pill size={14} color="#047857" />
                      <Text style={styles.blockTitle}>PERMISSIBLE MEDICINES & DOSES</Text>
                    </View>
                    {activeSection.prescribed_meds.map((med, idx) => (
                      <Text key={idx} style={styles.medTag}>• {med}</Text>
                    ))}
                  </View>
                )}

                {/* Danger Signs Alert */}
                {activeSection.danger_signs_alert && (
                  <View style={[styles.detailBlock, styles.dangerBlock]}>
                    <View style={styles.blockTitleRow}>
                      <AlertTriangle size={14} color="#dc2626" />
                      <Text style={[styles.blockTitle, { color: '#991B1B' }]}>RED-FLAG DANGER SIGNS</Text>
                    </View>
                    <Text style={styles.dangerContent}>{activeSection.danger_signs_alert}</Text>
                  </View>
                )}

                {/* Official Source */}
                {activeSection.official_source && (
                  <View style={styles.sourceBox}>
                    <Text style={styles.sourceText}>🏛️ Source: {activeSection.official_source}</Text>
                  </View>
                )}
              </ScrollView>
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
  topHeader: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    padding: 0
  },
  categoryScroll: {
    flexGrow: 0
  },
  categoryContent: {
    gap: 6
  },
  catChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  catChipActive: {
    backgroundColor: '#047857'
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  catChipTextActive: {
    color: '#fff'
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12
  },
  protocolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  idBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857'
  },
  docTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B'
  },
  protocolTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  protocolExcerpt: {
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
    marginBottom: 8
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  readMoreText: {
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
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4
  },
  modalBody: {
    paddingVertical: 12
  },
  detailBlock: {
    marginBottom: 14
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857'
  },
  blockContent: {
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#047857',
    marginTop: 6
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#334155'
  },
  medTag: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 18
  },
  dangerBlock: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5'
  },
  dangerContent: {
    fontSize: 12,
    lineHeight: 17,
    color: '#7F1D1D',
    fontWeight: '600'
  },
  sourceBox: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginTop: 8
  },
  sourceText: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic'
  }
});
