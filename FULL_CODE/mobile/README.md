# CareSphere Mobile — Production React Native (Expo) Healthcare Application

CareSphere Mobile is a full, offline-first mobile application built with **React Native (Expo)** and **TypeScript**, specifically designed for frontline ASHA, ANM, and Community Health Workers in rural sub-centres (e.g. Chandrapuri Block).

---

## 🌟 Key Architecture & Highlights

1. **100% Offline-First Architecture**:
   - **Zero Internet Required**: Runs completely offline in remote forest and rural sub-centres without 2G/3G/4G connectivity.
   - **Local Storage (`AsyncStorage` & `expo-sqlite`)**: Pre-seeded with **346 active visits** (`src/data/visitList.json`) and **107 official leaf protocol sections** (`src/data/protocols.json`).
   - **On-Device Clinical Engine**: Pure TypeScript deterministic clinical triage and safety guardian evaluating emergency danger signs and scope boundaries in **< 2ms latency**.

2. **Native Hardware & Device Integrations**:
   - 🚨 **1-Tap Emergency Ambulance Dialer**: `Linking.openURL('tel:108')` / `tel:102` for instant dispatch.
   - 💬 **1-Tap 2G SMS Dispatch**: Uses `expo-sms` to generate standardized emergency referral messages (containing Patient ID, Village, Critical Danger Signs, and MoHFW protocol references) without data connectivity.
   - 🔊 **Offline Audio Danger Siren**: Integrates `expo-av` to trigger pulsating acoustic alerts for critical obstetric and neonatal red flags.
   - 🗣️ **Offline Multilingual Text-to-Speech (TTS)**: Uses `expo-speech` with native dialect voices in **Telugu (`te-IN`)**, **Hindi (`hi-IN`)**, and **English (`en-IN`)**.

3. **Frontline Field Navigation (3 Specialized Tabs)**:
   - **Tab 1: Protocol Assistant**:
     - Immediate top Answer Card (zero-scroll visibility for urgent triage).
     - Trilingual speech readout and emergency alert triggers.
     - Categorized 1-tap clinical shortcuts (Maternal ANC, Newborn HBNC, Child Diarrhea/ORS, Immunization).
   - **Tab 2: Visit Planner**:
     - Pre-loaded household register (346 active visits across Chandrapuri block).
     - Prioritized clinical triage (🔴 P1 Overdue High-Risk, 🟡 P2 Due Today, ⚪ P3 Routine).
     - Comprehensive **"Mark as Done"** modal with medicine dispensing inventory (IFA Red/Blue, Calcium, Zinc, ORS packets, Albendazole, Paracetamol).
     - **"+ Register New Patient"** on-the-fly field registration with 4 clinical tracks (ANC Registration, Newborn HBNC, SAM/MAM Nutrition, Chronic NCD).
   - **Tab 3: Protocol Explorer**:
     - Searchable and categorized directory of all **107 leaf protocols**.
     - Full clinical breakdown: Deep guidance, clinical actions, diagnostic tests, permitted medicines, danger signs, and MoHFW citations.

4. **Trilingual Localization & Sunlight High-Contrast Mode**:
   - Seamless 1-tap switching between **English (EN)**, **తెలుగు (TE)**, and **हिन्दी (HI)**.
   - Sunlight Mode toggle providing ultra-high contrast (`#000000` text on `#FFFFFF` cards) for outdoor direct-sunlight field visibility.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm or yarn
- Expo Go app on your physical mobile phone (Android or iOS) OR Android Studio / Xcode Emulator

### 2. Install Dependencies
```bash
cd mobile
npm install
# or
npx expo install
```

### 3. Start Expo Development Server
```bash
npx expo start
```
- Scan the QR code with **Expo Go** (Android) or **Camera** (iOS) to launch the app on your mobile device.
- Press `a` in the terminal to launch in an Android Emulator.
- Press `i` in the terminal to launch in an iOS Simulator.

### 4. Run Offline Engine Unit Tests
You can verify the client-side clinical triage engine anytime:
```bash
npm test
```
*Validates all 6 safety and boundary test cases (directly supported, compound queries, coding out-of-scope, unlisted medical out-of-scope, insufficient info, and emergency danger signs) in < 2ms.*

---

## 📁 Project Structure

```
mobile/
├── App.tsx                        # App entry point with LanguageProvider & SafeAreaProvider
├── app.json                       # Expo application metadata & device permissions (Audio, SMS, Tel)
├── package.json                   # Mobile dependencies (Expo 52, React Native 0.76)
├── tsconfig.json                  # TypeScript configuration
├── test_mobile_engine.ts          # Offline engine validation suite
├── src/
│   ├── context/
│   │   └── LanguageContext.tsx    # Trilingual localization (EN / TE / HI) & Sunlight Mode state
│   ├── data/
│   │   ├── protocols.json         # 107 official leaf protocol guidelines
│   │   └── visitList.json         # 346 pre-computed household field visits
│   ├── engine/
│   │   ├── emergencyDetector.ts   # ESC-1.x to ESC-4.x emergency red-flag rules (< 1ms)
│   │   ├── refusalDetector.ts     # SCP-1.2 boundary rules & unlisted medicine blocker (< 1ms)
│   │   ├── protocolEngine.ts      # Multi-tier safety hierarchy & compound query splitter (< 2ms)
│   │   └── clinicalGuidance.ts    # 4-part clinical answer generator & referral SMS formatter
│   ├── navigation/
│   │   └── RootNavigator.tsx      # Bottom Tab Navigator with custom hospital header
│   ├── screens/
│   │   ├── ProtocolAssistantScreen.tsx # Tab 1: Protocol search, TTS, siren, emergency takeover
│   │   ├── VisitPlannerScreen.tsx      # Tab 2: Daily visits, dispensing modal, patient registration
│   │   └── ProtocolExplorerScreen.tsx  # Tab 3: Searchable 107 leaf protocols
│   ├── storage/
│   │   └── db.ts                  # AsyncStorage / SQLite offline data persistence layer
│   └── types/
│       └── index.ts               # Core TypeScript definitions (AskResponse, VisitItem, etc.)
```
