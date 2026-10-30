import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Stethoscope, ClipboardList, BookOpen, Sun, SunMedium, CloudDownload } from 'lucide-react-native';
import { ProtocolAssistantScreen } from '../screens/ProtocolAssistantScreen';
import { VisitPlannerScreen } from '../screens/VisitPlannerScreen';
import { ProtocolExplorerScreen } from '../screens/ProtocolExplorerScreen';
import { useLanguage } from '../context/LanguageContext';
import { UpdateManagerModal } from '../components/UpdateManagerModal';

const Tab = createBottomTabNavigator();

export const RootNavigator: React.FC = () => {
  const { language, setLanguage, isSunlightMode, toggleSunlightMode, t } = useLanguage();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const CustomHeader = ({ title }: { title: string }) => (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <View style={styles.logoSquare}>
          <Stethoscope size={18} color="#fff" />
        </View>
        <View>
          <Text style={styles.brandTitle}>CareSphere</Text>
          <Text style={styles.subBrand}>Frontline Health CDSS</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        {/* Cloud Sync & Differential Update Manager */}
        <TouchableOpacity
          onPress={() => setShowUpdateModal(true)}
          style={styles.sunlightBtn}
          accessibilityLabel="Cloud Sync & Update Manager"
        >
          <CloudDownload size={18} color="#047857" />
        </TouchableOpacity>

        {/* Sunlight mode button */}
        <TouchableOpacity
          onPress={toggleSunlightMode}
          style={[styles.sunlightBtn, isSunlightMode && styles.sunlightBtnActive]}
        >
          {isSunlightMode ? <Sun size={18} color="#d97706" /> : <SunMedium size={18} color="#64748B" />}
        </TouchableOpacity>

        {/* Trilingual Switcher [ EN | తె | హి ] */}
        <View style={styles.langPill}>

          <TouchableOpacity
            onPress={() => setLanguage('en')}
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage('te')}
            style={[styles.langBtn, language === 'te' && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === 'te' && styles.langTextActive]}>తె</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage('hi')}
            style={[styles.langBtn, language === 'hi' && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>हि</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#047857',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 6
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700'
          }
        }}
      >
        <Tab.Screen
          name="Assistant"
          component={ProtocolAssistantScreen}
          options={{
            tabBarLabel: t('tabAssistant'),
            tabBarIcon: ({ color, size }) => <Stethoscope size={size} color={color} />,
            header: () => <CustomHeader title={t('tabAssistant')} />
          }}
        />
        <Tab.Screen
          name="Visits"
          component={VisitPlannerScreen}
          options={{
            tabBarLabel: t('tabVisits'),
            tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
            header: () => <CustomHeader title={t('tabVisits')} />
          }}
        />
        <Tab.Screen
          name="Protocols"
          component={ProtocolExplorerScreen}
          options={{
            tabBarLabel: t('tabProtocols'),
            tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
            header: () => <CustomHeader title={t('tabProtocols')} />
          }}
        />
      </Tab.Navigator>

      <UpdateManagerModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoSquare: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#047857',
    justifyContent: 'center',
    alignItems: 'center'
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3
  },
  subBrand: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sunlightBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sunlightBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D'
  },
  langPill: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  langBtnActive: {
    backgroundColor: '#047857'
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  langTextActive: {
    color: '#fff'
  }
});
