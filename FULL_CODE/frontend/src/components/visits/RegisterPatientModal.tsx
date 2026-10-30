import React, { useState, useMemo } from 'react';
import { 
  X, 
  UserPlus, 
  CheckCircle2,
  AlertTriangle,
  Baby,
  Activity,
  Heart,
  Droplet
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { NewPatientFormData } from '../../context/VisitContext';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: NewPatientFormData) => Promise<void>;
}

export const RegisterPatientModal: React.FC<RegisterPatientModalProps> = ({
  isOpen,
  onClose,
  onRegister
}) => {
  const { t } = useLanguage();

  // Basic Demographics
  const [name, setName] = useState('');
  const [gender, setGender] = useState('F');
  const [age, setAge] = useState<number | ''>(24);
  const [dob, setDob] = useState('');
  const [village, setVillage] = useState('Amrapur');
  const [houseNo, setHouseNo] = useState('101');
  
  // Clinical Track Category
  const [category, setCategory] = useState<'Antenatal Care' | 'Newborn & Postnatal (HBNC)' | 'Malnutrition (MUAC)' | 'Non-Communicable Diseases (NCD)'>('Antenatal Care');
  
  // Track 1: Pregnant Mother
  const [lmpDate, setLmpDate] = useState('');
  const [ancSystolicBp, setAncSystolicBp] = useState('');
  const [ancDiastolicBp, setAncDiastolicBp] = useState('');
  const [hbLevel, setHbLevel] = useState('');

  // Track 2: Newborn / Infant
  const [birthWeightKg, setBirthWeightKg] = useState('');
  const [infantAgeUnit, setInfantAgeUnit] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [infantAgeValue, setInfantAgeValue] = useState<number | ''>(6);
  const [immunizationStatus, setImmunizationStatus] = useState('BCG, OPV-0, Hep-B0 (Birth)');

  // Track 3: Child Malnutrition
  const [muacCm, setMuacCm] = useState('');

  // Track 4: Adult Chronic NCD
  const [ncdSystolicBp, setNcdSystolicBp] = useState('');
  const [ncdDiastolicBp, setNcdDiastolicBp] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');

  // Chief Symptoms & Danger Signs
  const [symptoms, setSymptoms] = useState('');
  const [hasDangerSign, setHasDangerSign] = useState(false);
  const [selectedDangerSign, setSelectedDangerSign] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exact 6 village hamlets required
  const villageOptions = [
    'Amrapur',
    'Kesarganj',
    'Navagaon Khurd',
    'Dhanpura',
    'Sitapahari',
    'Belwadi Tola'
  ];

  // Auto-calculated EDD (LMP + 280 days)
  const calculatedEdd = useMemo(() => {
    if (!lmpDate) return '';
    try {
      const d = new Date(lmpDate);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + 280);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, [lmpDate]);

  // Real-time Shakir Tape Indicator for MUAC
  const shakirStatus = useMemo(() => {
    const muac = parseFloat(muacCm);
    if (isNaN(muac) || muac <= 0) return null;
    if (muac < 11.5) {
      return {
        zone: 'RED',
        label: t('shakirSamAlert') || 'RED TAPE (<11.5 cm) — Severe Acute Malnutrition (SAM) • Urgent Referral',
        bgColor: 'bg-red-500',
        textColor: 'text-red-900',
        borderColor: 'border-red-500',
        badgeBg: 'bg-red-100 text-red-800'
      };
    }
    if (muac <= 12.4) {
      return {
        zone: 'YELLOW',
        label: t('shakirMamAlert') || 'YELLOW TAPE (11.5-12.4 cm) — Moderate Acute Malnutrition (MAM) • Supplemental Care',
        bgColor: 'bg-amber-400',
        textColor: 'text-amber-900',
        borderColor: 'border-amber-400',
        badgeBg: 'bg-amber-100 text-amber-800'
      };
    }
    return {
      zone: 'GREEN',
      label: t('shakirNormalAlert') || 'GREEN TAPE (≥12.5 cm) — Normal Nutrition Status',
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-900',
      borderColor: 'border-emerald-500',
      badgeBg: 'bg-emerald-100 text-emerald-800'
    };
  }, [muacCm, t]);

  // Real-time Haemoglobin Classification
  const hbStatus = useMemo(() => {
    const hb = parseFloat(hbLevel);
    if (isNaN(hb) || hb <= 0) return null;
    if (hb < 7.0) {
      return {
        isSevere: true,
        label: 'Severe Anaemia (< 7.0 g/dL) — Priority 1 Medical Officer Escalation',
        badgeBg: 'bg-red-100 text-red-800 border-red-300'
      };
    }
    if (hb <= 9.9) {
      return {
        isSevere: false,
        label: 'Moderate Anaemia (7.0 - 9.9 g/dL) — IFA Therapeutic Dose',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    }
    if (hb <= 10.9) {
      return {
        isSevere: false,
        label: 'Mild Anaemia (10.0 - 10.9 g/dL) — Prophylactic Red IFA',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-300'
      };
    }
    return {
      isSevere: false,
      label: 'Normal Hb (≥ 11.0 g/dL)',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  }, [hbLevel]);

  // Triage & Priority Auto-Assignment
  const { calculatedPriority, priorityReason } = useMemo(() => {
    const sBp = parseFloat(category === 'Antenatal Care' ? ancSystolicBp : ncdSystolicBp);
    const dBp = parseFloat(category === 'Antenatal Care' ? ancDiastolicBp : ncdDiastolicBp);
    const muac = parseFloat(muacCm);
    const bw = parseFloat(birthWeightKg);
    const hb = parseFloat(hbLevel);

    // Rule 1: Danger signs checked
    if (hasDangerSign) {
      return {
        calculatedPriority: 1,
        priorityReason: `Emergency Danger Sign: ${selectedDangerSign || 'Clinical Takeover Required'} (ESC-1.1)`
      };
    }

    // Rule 2: High Blood Pressure >= 140/90
    if ((sBp && sBp >= 140) || (dBp && dBp >= 90)) {
      return {
        calculatedPriority: 1,
        priorityReason: `Hypertension (BP ${sBp}/${dBp} mmHg >= 140/90) — Priority 1 Referral (ANC-4.1 / NCD-1.2)`
      };
    }

    // Rule 3: Severe Anaemia < 7.0 g/dL
    if (hb && hb < 7.0) {
      return {
        calculatedPriority: 1,
        priorityReason: `Severe Anaemia (Hb ${hb} g/dL < 7.0 g/dL) — Priority 1 MO Escalation (ANC-3.1)`
      };
    }

    // Rule 4: SAM (MUAC < 11.5 cm)
    if (muac && muac < 11.5) {
      return {
        calculatedPriority: 1,
        priorityReason: `Severe Acute Malnutrition (MUAC ${muac} cm < 11.5 cm Red Tape) — Priority 1 NRC (NUT-1.2)`
      };
    }

    // Rule 5: Low Birth Weight < 2.0 kg
    if (bw && bw < 2.0) {
      return {
        calculatedPriority: 1,
        priorityReason: `Low Birth Weight (${bw} kg < 2.0 kg) — Priority 1 Special Care (HBNC-2.1)`
      };
    }

    // Rule 6: Routine Due Checkup vs Upcoming
    if (category === 'Antenatal Care' || category === 'Newborn & Postnatal (HBNC)') {
      return {
        calculatedPriority: 2,
        priorityReason: 'Routine Due Maternal & Newborn Care Visit (Priority 2)'
      };
    }

    return {
      calculatedPriority: 2,
      priorityReason: 'Routine Field Health Screening (Priority 2)'
    };
  }, [
    category, 
    ancSystolicBp, 
    ancDiastolicBp, 
    ncdSystolicBp, 
    ncdDiastolicBp, 
    muacCm, 
    birthWeightKg, 
    hbLevel, 
    hasDangerSign, 
    selectedDangerSign
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      // Determine due item string based on category
      let dueItem = "Initial Clinical Assessment & Registration";
      if (category === 'Antenatal Care') {
        dueItem = lmpDate ? "ANC Check-up & Maternal Health Card Registration" : "ANC Registration & Initial Health Check-up";
      } else if (category === 'Newborn & Postnatal (HBNC)') {
        dueItem = `HBNC Day 1/3 Assessment & Immunization (${immunizationStatus.split(' ')[0]})`;
      } else if (category === 'Malnutrition (MUAC)') {
        dueItem = muacCm ? `MUAC Growth Monitoring (${muacCm} cm) & Nutrition Support` : "MUAC Growth Monitoring & Nutrition Counselling";
      } else if (category === 'Non-Communicable Diseases (NCD)') {
        dueItem = "NCD Screening: Blood Pressure & Sugar Check";
      }

      const systolic = category === 'Antenatal Care' ? ancSystolicBp : ncdSystolicBp;
      const diastolic = category === 'Antenatal Care' ? ancDiastolicBp : ncdDiastolicBp;

      await onRegister({
        name: name.trim(),
        gender,
        age: typeof age === 'number' ? age : undefined,
        dob: dob || undefined,
        village,
        house_no: houseNo.trim() || '1',
        category,
        lmp_date: lmpDate || undefined,
        edd: calculatedEdd || undefined,
        birth_weight_kg: birthWeightKg || undefined,
        last_muac_cm: muacCm || undefined,
        systolic_bp: systolic || undefined,
        diastolic_bp: diastolic || undefined,
        blood_sugar_mg_dl: bloodSugar || undefined,
        symptoms: symptoms.trim() || undefined,
        priority: calculatedPriority,
        due_item: dueItem
      });
      onClose();
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border-[1.5px] border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b-[1.5px] border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#065f46] text-white flex items-center justify-center shadow-md shadow-emerald-950/20 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {t('registerPatientTitle') || 'Register New Field Patient'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                  Instant Synced
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t('registerPatientSubtitle') || 'Add a newly identified beneficiary directly into Chandrapuri Visit Register'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Section 1: Basic Demographics */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              1. Basic Beneficiary Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  {t('fullNameLabel') || 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Radhika Kumari"
                  className="w-full p-2.5 rounded-xl border-[1.5px] border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#065f46] text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    {t('genderLabel') || 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-[1.5px] border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#065f46] text-slate-900 bg-white"
                  >
                    <option value="F">Female (స్త్రీ / महिला)</option>
                    <option value="M">Male (పురుషుడు / पुरुष)</option>
                    <option value="O">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    {t('ageLabel') || 'Age (Years)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="110"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full p-2.5 rounded-xl border-[1.5px] border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#065f46] text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Village Hamlet (గ్రామం / गाँव) *
                </label>
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-[1.5px] border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#065f46] text-slate-900 bg-white font-medium"
                >
                  {villageOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    House No. *
                  </label>
                  <input
                    type="text"
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="e.g. 104"
                    className="w-full p-2.5 rounded-xl border-[1.5px] border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#065f46] text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Date of Birth (Optional)
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-2 rounded-xl border-[1.5px] border-slate-300 text-xs bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Health Track Tabs */}
          <div className="space-y-2 pt-2 border-t-[1.5px] border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              2. Select Clinical Health Track
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Antenatal Care', label: 'Pregnant Mother (ANC)', icon: '🤰' },
                { id: 'Newborn & Postnatal (HBNC)', label: 'Newborn / Infant (HBNC)', icon: '👶' },
                { id: 'Malnutrition (MUAC)', label: 'Child Malnutrition (MUAC)', icon: '📏' },
                { id: 'Non-Communicable Diseases (NCD)', label: 'Adult Chronic NCD (BP/Sugar)', icon: '🩺' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as any)}
                  className={`p-2.5 rounded-2xl border-[1.5px] text-left transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-emerald-50 border-[#065f46] text-emerald-950 font-bold ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg block mb-0.5">{cat.icon}</span>
                  <span className="text-[11px] leading-tight block">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Category Clinical Inputs */}
          <div className="p-4 bg-slate-50 rounded-2xl border-[1.5px] border-slate-200 space-y-3">
            {/* Track A: Pregnant Mother */}
            {category === 'Antenatal Care' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Heart className="w-4 h-4 text-emerald-700" />
                  <span>Maternal ANC Tracking Protocol (ANC-1.1 to ANC-4.2)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      LMP Date (Last Menstrual Period)
                    </label>
                    <input
                      type="date"
                      value={lmpDate}
                      onChange={(e) => setLmpDate(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Expected Delivery Date (EDD = LMP + 280 Days)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={calculatedEdd || 'Auto-calculated when LMP entered'}
                      className="w-full p-2.5 text-xs rounded-xl border-[1.5px] border-slate-200 bg-slate-100 font-mono text-[#065f46] font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Systolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={ancSystolicBp}
                      onChange={(e) => setAncSystolicBp(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Diastolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={ancDiastolicBp}
                      onChange={(e) => setAncDiastolicBp(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Haemoglobin Hb (g/dL) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 8.5"
                      value={hbLevel}
                      onChange={(e) => setHbLevel(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white"
                    />
                  </div>
                </div>

                {hbStatus && (
                  <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${hbStatus.badgeBg}`}>
                    <Droplet className="w-3.5 h-3.5 shrink-0" />
                    <span>{hbStatus.label}</span>
                  </div>
                )}
              </div>
            )}

            {/* Track B: Newborn / Infant */}
            {category === 'Newborn & Postnatal (HBNC)' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Baby className="w-4 h-4 text-emerald-700" />
                  <span>Home-Based Newborn Care & UIP Schedule (HBNC-1.1 & IMM-1.1)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Birth Weight (kg) (&lt; 2.0 kg = P1)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="e.g. 2.4"
                      value={birthWeightKg}
                      onChange={(e) => setBirthWeightKg(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={infantAgeValue}
                      onChange={(e) => setInfantAgeValue(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Age Unit
                    </label>
                    <select
                      value={infantAgeUnit}
                      onChange={(e) => setInfantAgeUnit(e.target.value as any)}
                      className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white"
                    >
                      <option value="days">Days (రోజూ / दिन)</option>
                      <option value="weeks">Weeks (వారాలు / सप्ताह)</option>
                      <option value="months">Months (నెలలు / महीने)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Active Immunization Due / Status
                  </label>
                  <select
                    value={immunizationStatus}
                    onChange={(e) => setImmunizationStatus(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white"
                  >
                    <option value="BCG, OPV-0, Hep-B0 (Birth)">Birth: BCG, OPV-0, Hep-B0</option>
                    <option value="Penta-1, OPV-1, RVV-1, fIPV-1, PCV-1 (6 weeks)">6 Weeks: Penta-1, OPV-1, RVV-1, fIPV-1, PCV-1</option>
                    <option value="Penta-2, OPV-2, RVV-2 (10 weeks)">10 Weeks: Penta-2, OPV-2, RVV-2</option>
                    <option value="Penta-3, OPV-3, RVV-3, fIPV-2, PCV-2 (14 weeks)">14 Weeks: Penta-3, OPV-3, RVV-3, fIPV-2, PCV-2</option>
                    <option value="MR-1, JE-1, PCV-Booster, Vit-A (9 months)">9 Months: MR-1, JE-1, PCV-B, Vitamin A</option>
                    <option value="DPT Booster-1, MR-2 (16-24 months)">16-24 Months: DPT Booster-1, MR-2, OPV-Booster</option>
                    <option value="Immunization Up to date">Immunization Up to Date</option>
                  </select>
                </div>
              </div>
            )}

            {/* Track C: Child Malnutrition & Real-Time Shakir Tape */}
            {category === 'Malnutrition (MUAC)' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <span>Nutrition Assessment (MUAC Shakir Strip - NUT-1.2)</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Child MUAC Tape Measurement (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 11.2 (SAM) or 12.0 (MAM) or 13.0 (Normal)"
                    value={muacCm}
                    onChange={(e) => setMuacCm(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm rounded-xl border-[1.5px] border-slate-300 bg-white font-mono font-bold"
                  />
                </div>

                {/* Real-time Shakir Color Strip Indicator */}
                {shakirStatus ? (
                  <div className={`p-3 rounded-2xl border-[1.5px] text-xs space-y-1.5 ${shakirStatus.badgeBg} ${shakirStatus.borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${shakirStatus.bgColor} animate-pulse shrink-0`} />
                        <span className="font-extrabold">{shakirStatus.label}</span>
                      </div>
                      <span className="font-mono font-bold text-xs">{muacCm} cm</span>
                    </div>
                    {/* Visual Shakir Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                      <div className="w-[30%] bg-red-500" title="< 11.5 cm Red" />
                      <div className="w-[20%] bg-amber-400" title="11.5 - 12.4 cm Yellow" />
                      <div className="w-[50%] bg-emerald-500" title=">= 12.5 cm Green" />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    Enter MUAC value in cm to see real-time Shakir tape triage (Red &lt;11.5 cm SAM, Yellow 11.5-12.4 cm MAM, Green &ge;12.5 cm Normal).
                  </div>
                )}
              </div>
            )}

            {/* Track D: Adult Chronic NCD */}
            {category === 'Non-Communicable Diseases (NCD)' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Heart className="w-4 h-4 text-emerald-700" />
                  <span>NCD Screening: Hypertension & Diabetes (NCD-1.2 & NCD-2.1)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Systolic BP (mmHg) (&ge; 140 = P1)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 145"
                      value={ncdSystolicBp}
                      onChange={(e) => setNcdSystolicBp(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Diastolic BP (mmHg) (&ge; 90 = P1)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 95"
                      value={ncdDiastolicBp}
                      onChange={(e) => setNcdDiastolicBp(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Random Blood Sugar (mg/dL)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 185"
                      value={bloodSugar}
                      onChange={(e) => setBloodSugar(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Chief Symptoms / Field Complaint */}
            <div className="pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Chief Clinical Observations / Field Complaint
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Record immediate field findings (e.g. slight pedal swelling, complaints of fatigue, mild cough)..."
                rows={2}
                className="w-full p-2.5 text-xs rounded-xl border-[1.5px] border-slate-300 bg-white resize-none"
              />
            </div>

            {/* Danger Signs Triage Check */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDangerSign}
                  onChange={(e) => setHasDangerSign(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Presence of Danger Signs (Convulsions, heavy bleeding, chest indrawing, high fever &gt; 7d)
                </span>
              </label>
              {hasDangerSign && (
                <div className="mt-2">
                  <select
                    value={selectedDangerSign}
                    onChange={(e) => setSelectedDangerSign(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border-[1.5px] border-red-300 bg-red-50 text-red-950 font-bold"
                  >
                    <option value="Severe Vaginal Bleeding">Severe Vaginal Bleeding (ESC-2.1)</option>
                    <option value="Convulsions / Fits">Convulsions or Fits (ESC-5.1 / ESC-2.2)</option>
                    <option value="Infant Not Sucking / Lethargic">Infant Not Sucking / Extremely Lethargic (ESC-5.1)</option>
                    <option value="Severe Chest Indrawing">Fast Breathing / Severe Chest Indrawing (ESC-5.2)</option>
                    <option value="High Fever > 7 Days">High Fever lasting &gt; 7 Days (ESC-5.4)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Calculated Triage & Priority Box */}
          <div className={`p-3.5 rounded-2xl border-[1.5px] text-xs flex items-center justify-between gap-3 shadow-2xs ${
            calculatedPriority === 1 
              ? 'bg-red-50 border-red-300 text-red-950 font-medium' 
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-xl font-extrabold font-mono text-xs ${
                calculatedPriority === 1 ? 'bg-[#dc2626] text-white shadow-xs' : 'bg-[#065f46] text-white shadow-xs'
              }`}>
                P{calculatedPriority}
              </span>
              <div>
                <span className="font-extrabold block text-sm">
                  Auto-Assigned Priority {calculatedPriority} {calculatedPriority === 1 ? '(High-Risk Action)' : '(Routine Due)'}
                </span>
                <span className="text-[11px] opacity-90">{priorityReason}</span>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-[1.5px] border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border-[1.5px] border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 rounded-2xl bg-[#065f46] hover:bg-[#044a37] disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/20 active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : '+ Register & Add to Visit Planner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
