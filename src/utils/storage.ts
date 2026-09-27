import { 
  Student, 
  Session, 
  AttendanceRecord, 
  AttendanceStatus, 
  ExamRecord,
  ExamEntity,
  ParticipationStatus,
  normalizeParticipation,
  Branch,
  TeacherEntity
} from '../types';
import { 
  syncStudentsToSupabase, 
  syncSessionsToSupabase, 
  syncRecordsToSupabase, 
  syncExamsToSupabase 
} from './supabase';

const STORAGE_KEYS = {
  STUDENTS: 'quran_sixtieth_students_v5',
  SESSIONS: 'quran_sixtieth_sessions_v5',
  RECORDS: 'quran_sixtieth_records_v5',
  EXAMS: 'quran_sixtieth_exams_v5',
  EXAM_DEFINITIONS: 'quran_sixtieth_exam_definitions_v5',
  ACTIVE_SESSION_ID: 'quran_sixtieth_active_session_id_v5',
  INSTITUTION_NAME: 'quran_sixtieth_institution_v5',
  BRANCHES: 'quran_sixtieth_branches_v1',
  TEACHERS: 'quran_sixtieth_teachers_v1'
};

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'الفرع الرئيسي - العاصمة',
    location: 'المقر المركزي - جامع الإمام نافع',
    phone: '71 000 001',
    createdAt: '2025-01-01'
  },
  {
    id: 'branch-2',
    name: 'فرع الهدى والفرقان',
    location: 'قاعة الفرقان - حي الأندلس',
    phone: '71 000 002',
    createdAt: '2025-01-01'
  },
  {
    id: 'branch-3',
    name: 'فرع النور المبين',
    location: 'قاعة الإمام مالك',
    phone: '71 000 003',
    createdAt: '2025-01-01'
  }
];

export const DEFAULT_TEACHERS: TeacherEntity[] = [
  {
    id: 'teacher-1',
    name: 'الشيخ مراد الجدلي',
    phone: '98 123 456',
    branchId: 'branch-1',
    branchName: 'الفرع الرئيسي - العاصمة'
  },
  {
    id: 'teacher-2',
    name: 'الشيخ أحمد بركات',
    phone: '97 654 321',
    branchId: 'branch-2',
    branchName: 'فرع الهدى والفرقان'
  },
  {
    id: 'teacher-3',
    name: 'الشيخ البشير الإبراهيمي',
    phone: '99 888 777',
    branchId: 'branch-3',
    branchName: 'فرع النور المبين'
  }
];

export function loadStoredBranches(): Branch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error loading branches', err);
  }
  return DEFAULT_BRANCHES;
}

export function saveStoredBranches(branches: Branch[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  } catch (err) {
    console.error('Error saving branches', err);
  }
}

export function loadStoredTeachers(): TeacherEntity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error loading teachers', err);
  }
  return DEFAULT_TEACHERS;
}

export function saveStoredTeachers(teachers: TeacherEntity[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  } catch (err) {
    console.error('Error saving teachers', err);
  }
}

export const DEFAULT_STUDENTS: Student[] = [
  { id: '81', firstName: 'حلمي', lastName: 'بوعيانة', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-emerald-600' },
  { id: '185', firstName: 'رضوان', lastName: 'الرباعي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-blue-600' },
  { id: '303', firstName: 'عبد القادر', lastName: 'الشريف', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-teal-600' },
  { id: '314', firstName: 'شكيب', lastName: 'الرزاقي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-amber-600' },
  { id: '364', firstName: 'محمد عزالدين', lastName: 'السعدي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-indigo-600' },
  { id: '376', firstName: 'محسن', lastName: 'السلطاني', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-rose-600' },
  { id: '405', firstName: 'جلال', lastName: 'بن سليمان', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-cyan-600' },
  { id: '407', firstName: 'رؤوف', lastName: 'المرزوقي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-orange-600' },
  { id: '409', firstName: 'كمال', lastName: 'أبو عزيز', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-violet-600' },
  { id: '430', firstName: 'سامي', lastName: 'بوسعيدي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-emerald-700' },
  { id: '483', firstName: 'محمد رضوان', lastName: 'العويني', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-sky-600' },
  { id: '536', firstName: 'خير الدين', lastName: 'الشريف', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-amber-700' },
  { id: '586', firstName: 'رؤوف', lastName: 'ثابت ا و مكر', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-teal-700' },
  { id: '615', firstName: 'حمزة', lastName: 'العويني', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-indigo-700' },
  { id: '633', firstName: 'بلقاسم', lastName: 'الجويني', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-blue-700' },
  { id: '641', firstName: 'رياض', lastName: 'العابِد', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-emerald-600' },
  { id: '656', firstName: 'علي', lastName: 'بن منصور', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-rose-700' },
  { id: '677', firstName: 'عمر', lastName: 'الجوادي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-cyan-700' },
  { id: '683', firstName: 'الحصين', lastName: 'بن عائشة', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-amber-600' },
  { id: '687', firstName: 'رياض', lastName: 'الطرطوفي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-violet-700' },
  { id: '709', firstName: 'طارق', lastName: 'الدلال', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-teal-600' },
  { id: '730', firstName: 'سامي', lastName: 'الذبي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-emerald-800' },
  { id: '743', firstName: 'شوقي', lastName: 'المحجوب', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-blue-800' },
  { id: '751', firstName: 'محمد أمين', lastName: 'التستوري', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-rose-600' },
  { id: '762', firstName: 'أحمد', lastName: 'بن عمار', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-indigo-600' },
  { id: '784', firstName: 'عبد المنعم', lastName: 'الشمقي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-amber-700' },
  { id: '786', firstName: 'عاطف', lastName: 'البوزازي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-emerald-600' },
  { id: '794', firstName: 'محمد أمين', lastName: 'الكركي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-teal-700' },
  { id: '798', firstName: 'الحبيب', lastName: 'العوفي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-blue-600' },
  { id: '809', firstName: 'أحمد', lastName: 'بوسالمي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-violet-600' },
  { id: '812', firstName: 'حاتم', lastName: 'بليلي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-orange-600' },
  { id: '813', firstName: 'أحمد', lastName: 'بركات', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-emerald-700' },
  { id: '831', firstName: 'محمد عزيز', lastName: 'الحمروني', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-cyan-600' },
  { id: '841', firstName: 'رياض', lastName: 'التونسي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-indigo-700' },
  { id: '853', firstName: 'محمد أمين', lastName: 'العويني', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-rose-700' },
  { id: '867', firstName: 'طه', lastName: 'الشرشاري', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-amber-600' },
  { id: '868', firstName: 'كرم', lastName: 'الجبالي', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-teal-600' },
  { id: '870', firstName: 'الناظري', lastName: 'المسكيني', group: 'فوج حفظ الستين', hizbProgress: 'قيد التثبيت', avatarColor: 'bg-emerald-600' }
];

export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTimeArabic(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`;
}

export function calculateExamGrade(totalScore: number, totalMax: number): string {
  if (!totalMax || totalMax <= 0) return '—';
  const percentage = (totalScore / totalMax) * 100;
  if (percentage >= 90) return 'ممتاز (متقن)';
  if (percentage >= 80) return 'جيد جداً';
  if (percentage >= 70) return 'جيد';
  if (percentage >= 60) return 'مقبول';
  return 'يحتاج مراجعة وإعادة';
}

export const DEFAULT_EXAM_CATEGORIES: string[] = [
  'حفظ الأجزاء والأحزاب',
  'أحكام وقواعد التجويد',
  'الاختبارات الشهرية والدورية',
  'إتقان الختمة والإجازات'
];

export const DEFAULT_EXAM_ENTITIES: ExamEntity[] = [
  {
    id: 'exam-ent-001',
    title: 'اختبار الجزء الخامس عشر (الإسراء والكهف)',
    category: 'حفظ الأجزاء والأحزاب',
    examDate: getTodayDateStr(),
    juzOrPortion: 'الجزء 15 (سورة الإسراء والكهف)',
    examinerName: 'الشيخ مراد الجدلي',
    targetGroup: 'ALL',
    hifzMax: 40,
    tilawaMax: 30,
    tajweedMax: 30,
    totalMax: 100,
    description: 'تقييم الحفظ المتقن والتلاوة للجزء الخامس عشر'
  },
  {
    id: 'exam-ent-002',
    title: 'امتحان ختم القرآن الكريم (الستين حزباً)',
    category: 'إتقان الختمة والإجازات',
    examDate: getTodayDateStr(),
    juzOrPortion: 'الستين حزباً كاملة (ختم القرآن)',
    examinerName: 'الشيخ مراد الجدلي',
    targetGroup: 'ALL',
    hifzMax: 40,
    tilawaMax: 30,
    tajweedMax: 30,
    totalMax: 100,
    description: 'امتحان شامل في كامل المصحف الشريف للحصول على الإجازة القرآنية'
  },
  {
    id: 'exam-ent-003',
    title: 'اختبار الجزء العاشر (الأنفال والتوبة)',
    category: 'حفظ الأجزاء والأحزاب',
    examDate: getTodayDateStr(),
    juzOrPortion: 'الجزء 10 (من سورة الأنفال إلى التوبة)',
    examinerName: 'الشيخ مراد الجدلي',
    targetGroup: 'ALL',
    hifzMax: 40,
    tilawaMax: 30,
    tajweedMax: 30,
    totalMax: 100,
    description: 'اختبار فصلي للجزء العاشر'
  },
  {
    id: 'exam-ent-004',
    title: 'امتحان أحكام النون الساكنة والتنوين والمدود',
    category: 'أحكام وقواعد التجويد',
    examDate: getTodayDateStr(),
    juzOrPortion: 'تطبيق أحكام التجويد في سورة مريم وطه',
    examinerName: 'الشيخ مراد الجدلي',
    targetGroup: 'ALL',
    hifzMax: 30,
    tilawaMax: 35,
    tajweedMax: 35,
    totalMax: 100,
    description: 'اختبار تجويدي نظري وتطبيقي في أحكام النون والميم والمدود'
  },
  {
    id: 'exam-ent-005',
    title: 'الاختبار الشهري الدوري لضبط الحفظ',
    category: 'الاختبارات الشهرية والدورية',
    examDate: getTodayDateStr(),
    juzOrPortion: 'الأحزاب المقررة للشهر الحالي',
    examinerName: 'الشيخ مراد الجدلي',
    targetGroup: 'ALL',
    hifzMax: 40,
    tilawaMax: 30,
    tajweedMax: 30,
    totalMax: 100,
    description: 'المتابعة الشهرية لقياس جودة الحفظ والاسترسال'
  }
];

export const DEFAULT_EXAMS: ExamRecord[] = [
  {
    id: 'exam-001',
    examId: 'exam-ent-001',
    studentId: '81',
    studentName: 'حلمي بوعيانة',
    group: 'فوج حفظ الستين',
    examDate: getTodayDateStr(),
    category: 'حفظ الأجزاء والأحزاب',
    juzOrPortion: 'الجزء 15 (سورة الإسراء والكهف)',
    examinerName: 'الشيخ مراد الجدلي',
    breakdown: {
      hifzScore: 38,
      hifzMax: 40,
      tilawaScore: 28,
      tilawaMax: 30,
      tajweedScore: 29,
      tajweedMax: 30
    },
    totalScore: 95,
    totalMax: 100,
    grade: 'ممتاز (متقن)',
    notes: 'إتقان متين للمخارج مع حسن الاسترسال والوقف والابتداء'
  },
  {
    id: 'exam-002',
    examId: 'exam-ent-002',
    studentId: '185',
    studentName: 'رضوان الرباعي',
    group: 'فوج حفظ الستين',
    examDate: getTodayDateStr(),
    category: 'إتقان الختمة والإجازات',
    juzOrPortion: 'الستين حزباً كاملة (ختم القرآن)',
    examinerName: 'الشيخ مراد الجدلي',
    breakdown: {
      hifzScore: 40,
      hifzMax: 40,
      tilawaScore: 29,
      tilawaMax: 30,
      tajweedScore: 30,
      tajweedMax: 30
    },
    totalScore: 99,
    totalMax: 100,
    grade: 'ممتاز (متقن)',
    notes: 'ختم مبارك بإجازة في الستين حزباً، تبارك الرحمن'
  },
  {
    id: 'exam-003',
    examId: 'exam-ent-003',
    studentId: '303',
    studentName: 'عبد القادر الشريف',
    group: 'فوج حفظ الستين',
    examDate: getTodayDateStr(),
    category: 'حفظ الأجزاء والأحزاب',
    juzOrPortion: 'الجزء 10 (من سورة الأنفال إلى التوبة)',
    examinerName: 'الشيخ مراد الجدلي',
    breakdown: {
      hifzScore: 34,
      hifzMax: 40,
      tilawaScore: 25,
      tilawaMax: 30,
      tajweedScore: 26,
      tajweedMax: 30
    },
    totalScore: 85,
    totalMax: 100,
    grade: 'جيد جداً',
    notes: 'يحتاج فقط لضبط الغنن والمد المنفصل في التلاوة'
  }
];

export function getPreviousSession(currentSessionId: string, sessions: Session[]): Session | null {
  if (!sessions || sessions.length <= 1) return null;
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const currentIndex = sorted.findIndex((s) => s.id === currentSessionId);
  if (currentIndex === -1 || currentIndex === sorted.length - 1) {
    return sorted[1] || null;
  }
  return sorted[currentIndex + 1];
}

export function getStudentHistoryInfo(
  studentId: string,
  currentSessionId: string,
  records: AttendanceRecord[],
  sessions: Session[]
): {
  recitedInPreviousSession: boolean;
  oralInPreviousSession: boolean;
  previousSessionTitle?: string;
  previousSessionDate?: string;
  totalRecitations: number;
  totalOrals: number;
  lastRecitationSessionTitle?: string;
} {
  const studentRecords = records.filter((r) => r.studentId === studentId);
  const totalRecitations = studentRecords.filter((r) => normalizeParticipation(r.recitation) === 'CONFIRMED').length;
  const totalOrals = studentRecords.filter((r) => normalizeParticipation(r.oralParticipation) === 'CONFIRMED').length;

  const prevSession = getPreviousSession(currentSessionId, sessions);
  let recitedInPreviousSession = false;
  let oralInPreviousSession = false;
  let previousSessionTitle = undefined;
  let previousSessionDate = undefined;

  if (prevSession) {
    previousSessionTitle = prevSession.title;
    previousSessionDate = prevSession.date;
    const prevRecord = studentRecords.find((r) => r.sessionId === prevSession.id);
    if (prevRecord) {
      recitedInPreviousSession = normalizeParticipation(prevRecord.recitation) === 'CONFIRMED';
      oralInPreviousSession = normalizeParticipation(prevRecord.oralParticipation) === 'CONFIRMED';
    }
  }

  const lastRecitationRecord = [...studentRecords]
    .filter((r) => normalizeParticipation(r.recitation) === 'CONFIRMED' && r.sessionId !== currentSessionId)
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))[0];

  return {
    recitedInPreviousSession,
    oralInPreviousSession,
    previousSessionTitle,
    previousSessionDate,
    totalRecitations,
    totalOrals,
    lastRecitationSessionTitle: lastRecitationRecord?.sessionTitle
  };
}

function generateInitialData(): {
  students: Student[];
  sessions: Session[];
  records: AttendanceRecord[];
  exams: ExamRecord[];
  examEntities: ExamEntity[];
  activeSessionId: string;
} {
  const today = getTodayDateStr();

  const sessions: Session[] = [
    {
      id: 'sess-w1',
      title: 'الأسبوع 1 - 04/07/2026',
      date: '2026-07-04',
      startTime: '08:30',
      endTime: '11:30',
      room: 'قاعة الستين حزباً',
      teacher: 'الشيخ مراد الجدلي',
      isClosed: true
    },
    {
      id: 'sess-w2',
      title: 'الأسبوع 2 - 11/07/2026',
      date: '2026-07-11',
      startTime: '08:30',
      endTime: '11:30',
      room: 'قاعة الستين حزباً',
      teacher: 'الشيخ مراد الجدلي',
      isClosed: true
    },
    {
      id: 'sess-w3',
      title: 'الأسبوع 3 - 18/07/2026',
      date: '2026-07-18',
      startTime: '08:30',
      endTime: '11:30',
      room: 'قاعة الستين حزباً',
      teacher: 'الشيخ مراد الجدلي',
      isClosed: true
    },
    {
      id: 'sess-today',
      title: 'جلسة التلاوة والتكرار اليومية',
      date: today,
      startTime: '09:00',
      endTime: '12:00',
      room: 'قاعة الستين حزباً',
      teacher: 'الشيخ مراد الجدلي',
      isClosed: false
    }
  ];

  const records: AttendanceRecord[] = [];

  // Populate records for Semaine 1 (all 38 present as per attached table)
  DEFAULT_STUDENTS.forEach((st, idx) => {
    records.push({
      id: `sess-w1_${st.id}`,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      sessionId: 'sess-w1',
      sessionTitle: `${sessions[0].title}`,
      sessionDate: '2026-07-04',
      status: 'PRESENT',
      entryTimestamp: '2026-07-04 08:30:00',
      attendanceRate: 100,
      recitation: idx % 4 === 0 ? 'CONFIRMED' : 'NONE',
      oralParticipation: idx % 3 === 0 ? 'CONFIRMED' : 'NONE',
      notes: ''
    });
  });

  // Populate records for Semaine 2 (all 38 present as per attached table)
  DEFAULT_STUDENTS.forEach((st, idx) => {
    records.push({
      id: `sess-w2_${st.id}`,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      sessionId: 'sess-w2',
      sessionTitle: `${sessions[1].title}`,
      sessionDate: '2026-07-11',
      status: 'PRESENT',
      entryTimestamp: '2026-07-11 08:32:00',
      attendanceRate: 100,
      recitation: idx % 4 === 1 ? 'CONFIRMED' : 'NONE',
      oralParticipation: idx % 3 === 1 ? 'CONFIRMED' : 'NONE',
      notes: ''
    });
  });

  // Populate records for Semaine 3 (all 38 present as per attached table)
  DEFAULT_STUDENTS.forEach((st, idx) => {
    records.push({
      id: `sess-w3_${st.id}`,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      sessionId: 'sess-w3',
      sessionTitle: `${sessions[2].title}`,
      sessionDate: '2026-07-18',
      status: 'PRESENT',
      entryTimestamp: '2026-07-18 08:35:00',
      attendanceRate: 100,
      recitation: idx % 4 === 2 ? 'CONFIRMED' : 'NONE',
      oralParticipation: idx % 3 === 2 ? 'CONFIRMED' : 'NONE',
      notes: ''
    });
  });

  // Populate records for today's active session (all students initialized to ABSENT by default)
  DEFAULT_STUDENTS.forEach((st) => {
    records.push({
      id: `sess-today_${st.id}`,
      studentId: st.id,
      studentName: `${st.firstName} ${st.lastName}`,
      sessionId: 'sess-today',
      sessionTitle: `${sessions[3].title} (${today})`,
      sessionDate: today,
      status: 'ABSENT',
      entryTimestamp: null,
      attendanceRate: 100,
      recitation: 'NONE',
      oralParticipation: 'NONE',
      notes: ''
    });
  });

  return {
    students: DEFAULT_STUDENTS,
    sessions,
    records: recomputeAllAttendanceRates(records, DEFAULT_STUDENTS),
    exams: DEFAULT_EXAMS,
    examEntities: DEFAULT_EXAM_ENTITIES,
    activeSessionId: 'sess-today'
  };
}

export function recomputeAllAttendanceRates(records: AttendanceRecord[], students: Student[]): AttendanceRecord[] {
  const studentRates: Record<string, number> = {};

  students.forEach((s) => {
    const sRecords = records.filter((r) => r.studentId === s.id);
    if (sRecords.length === 0) {
      studentRates[s.id] = 100;
    } else {
      const markedSessions = sRecords.filter((r) => r.status === 'PRESENT' || r.status === 'ABSENT');
      const presentCount = sRecords.filter((r) => r.status === 'PRESENT').length;
      const denominator = markedSessions.length > 0 ? markedSessions.length : sRecords.length;
      studentRates[s.id] = denominator > 0 ? Math.round((presentCount / denominator) * 100) : 100;
    }
  });

  return records.map((r) => ({
    ...r,
    status: (r.status === 'PRESENT' ? 'PRESENT' : 'ABSENT') as AttendanceStatus,
    recitation: normalizeParticipation(r.recitation),
    oralParticipation: normalizeParticipation(r.oralParticipation),
    notes: r.notes || '',
    attendanceRate: studentRates[r.studentId] !== undefined ? studentRates[r.studentId] : r.attendanceRate
  }));
}

export function loadStoredData(): {
  students: Student[];
  sessions: Session[];
  records: AttendanceRecord[];
  exams: ExamRecord[];
  examEntities: ExamEntity[];
  activeSessionId: string;
  institutionName: string;
} {
  try {
    const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const rawSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const rawRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const rawExams = localStorage.getItem(STORAGE_KEYS.EXAMS);
    const rawExamDefs = localStorage.getItem(STORAGE_KEYS.EXAM_DEFINITIONS);
    const rawActiveSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    const institutionName = localStorage.getItem(STORAGE_KEYS.INSTITUTION_NAME) || 'مجموعة حفظ الستين • مدرسة القرآن الكريم';

    if (rawStudents && rawSessions && rawRecords) {
      const students: Student[] = JSON.parse(rawStudents) || [];
      const hasOldIdFormat = students.some((s) => s.id.startsWith('QS-'));
      if (!hasOldIdFormat && students.length >= 30) {
        const sessions: Session[] = (JSON.parse(rawSessions) || []).map((s: any) => ({
          ...s,
          teacher: s.teacher && s.teacher.includes('محمد إسلام بركات') ? 'الشيخ مراد الجدلي' : (s.teacher || 'الشيخ مراد الجدلي')
        }));
        let records: AttendanceRecord[] = JSON.parse(rawRecords) || [];
        // If sess-today has old demo mock records with present status, reset them to ABSENT by default
        const hasOldDemoPresent = records.some(r => r.sessionId === 'sess-today' && r.studentId === '81' && r.status === 'PRESENT' && r.recitation === 'CONFIRMED');
        if (hasOldDemoPresent) {
          records = records.map(r => r.sessionId === 'sess-today' ? {
            ...r,
            status: 'ABSENT' as AttendanceStatus,
            entryTimestamp: null,
            recitation: 'NONE',
            oralParticipation: 'NONE'
          } : r);
        }

        records = recomputeAllAttendanceRates(records, students);

        const parsedExamDefs = rawExamDefs ? JSON.parse(rawExamDefs) : null;
        const examEntities: ExamEntity[] = Array.isArray(parsedExamDefs) && parsedExamDefs.length > 0
          ? parsedExamDefs.map((ent: any) => ({
              ...ent,
              examinerName: ent.examinerName && ent.examinerName.includes('محمد إسلام بركات') ? 'الشيخ مراد الجدلي' : (ent.examinerName || 'الشيخ مراد الجدلي')
            }))
          : DEFAULT_EXAM_ENTITIES;

        const parsedExams = rawExams ? JSON.parse(rawExams) : null;
        const exams: ExamRecord[] = Array.isArray(parsedExams) && parsedExams.length > 0
          ? parsedExams.map((ex: any) => ({
              id: ex.id || `exam-${Date.now()}`,
              examId: ex.examId || (examEntities[0]?.id || 'exam-ent-001'),
              studentId: ex.studentId || '',
              studentName: ex.studentName || '',
              group: ex.group || '',
              examDate: ex.examDate || getTodayDateStr(),
              category: ex.category || (examEntities.find((ent) => ent.id === ex.examId)?.category || 'حفظ الأجزاء والأحزاب'),
              juzOrPortion: ex.juzOrPortion || 'الجزء الأول',
              examinerName: ex.examinerName && ex.examinerName.includes('محمد إسلام بركات') ? 'الشيخ مراد الجدلي' : (ex.examinerName || 'الشيخ مراد الجدلي'),
              breakdown: ex.breakdown || {
                hifzScore: 38,
                hifzMax: 40,
                tilawaScore: 28,
                tilawaMax: 30,
                tajweedScore: 29,
                tajweedMax: 30
              },
              totalScore: ex.totalScore ?? 95,
              totalMax: ex.totalMax ?? 100,
              grade: ex.grade || 'ممتاز (متقن)',
              notes: ex.notes || ''
            }))
          : DEFAULT_EXAMS;

        const activeSessionId = rawActiveSession && sessions.some((s) => s.id === rawActiveSession)
          ? rawActiveSession
          : (sessions[sessions.length - 1]?.id || sessions[0]?.id || '');

        return { students, sessions, records, exams, examEntities, activeSessionId, institutionName };
      }
    }
  } catch (err) {
    console.error('Error loading localStorage data, generating seed data', err);
  }

  const initial = generateInitialData();
  saveStoredData(initial.students, initial.sessions, initial.records, initial.exams, initial.activeSessionId, 'مجموعة حفظ الستين • مدرسة القرآن الكريم', initial.examEntities);
  return {
    ...initial,
    institutionName: 'مجموعة حفظ الستين • مدرسة القرآن الكريم'
  };
}

export function saveStoredData(
  students: Student[],
  sessions: Session[],
  records: AttendanceRecord[],
  exams: ExamRecord[],
  activeSessionId: string,
  institutionName?: string,
  examEntities?: ExamEntity[]
) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    if (examEntities) {
      localStorage.setItem(STORAGE_KEYS.EXAM_DEFINITIONS, JSON.stringify(examEntities));
    }
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, activeSessionId);
    if (institutionName) {
      localStorage.setItem(STORAGE_KEYS.INSTITUTION_NAME, institutionName);
    }

    // Async sync to Supabase if configured
    syncStudentsToSupabase(students);
    syncSessionsToSupabase(sessions);
    syncRecordsToSupabase(records);
    syncExamsToSupabase(exams);
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}
