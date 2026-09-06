export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export function normalizeAttendanceStatus(status: unknown): AttendanceStatus {
  return status === 'PRESENT' ? 'PRESENT' : 'ABSENT';
}

export type ParticipationStatus = 'NONE' | 'SELECTED' | 'CONFIRMED';

export interface Student {
  id: string; // المعرف الوحيد (مثال: "871", "81")
  firstName: string; // الاسم
  lastName: string; // اللقب
  email?: string;
  group?: string; // الفوج / حلقة التحفيظ (مثال: "فوج حفظ الستين")
  phone?: string;
  avatarColor?: string;
  hizbProgress?: string; // مستوى الحفظ الحالي
}

export interface Session {
  id: string;
  title: string; // مثال: "حلقة تثبيت الأحزاب (1-10) ومراجعة الورد"
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room?: string; // مثال: "القاعة الكبرى - جامع الفرقان"
  teacher?: string; // المشرف / الشيخ
  isClosed?: boolean; // هل تم اختتام الحصة وتثبيتها
}

export interface AttendanceRecord {
  id: string; // Unique record ID: sessionId_studentId
  studentId: string;
  studentName: string; // "اللقب والاسم"
  sessionId: string;
  sessionTitle: string; // "عنوان الحصة مع التاريخ"
  sessionDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  entryTimestamp: string | null; // وقت تسجيل الحضور أو null
  attendanceRate: number; // نسبة الحضور التراكمية (%)
  recitation: ParticipationStatus | boolean; // التسميع : مرحلتين (ترشيح ثم تأكيد)
  oralParticipation: ParticipationStatus | boolean; // المشاركة الشفوية : مرحلتين (ترشيح ثم تأكيد)
  notes?: string; // ملاحظة خاصة بالطالب في الحصة
}

export interface ExamDetailBreakdown {
  hifzScore: number; // درجة الحفظ والإتقان
  hifzMax: number; // النهاية العظمى للحفظ
  tilawaScore: number; // درجة حسن التلاوة والأداء
  tilawaMax: number; // النهاية العظمى لحسن التلاوة
  tajweedScore: number; // درجة أحكام التجويد ومخارج الحروف
  tajweedMax: number; // النهاية العظمى للتجويد
}

export interface ExamEntity {
  id: string;
  title: string; // اسم الاختبار (مثال: اختبار الأجزاء الخمسة الأولى)
  category: string; // التصنيف (مثال: حفظ الأجزاء والأحزاب، أحكام وقواعد التجويد، الاختبارات الشهرية والدورية، إتقان الختمة والإجازات)
  examDate: string; // YYYY-MM-DD
  juzOrPortion: string; // المقدار أو السور الممتحنة
  examinerName: string; // الشيخ المقرئ المختبر
  targetGroup?: string; // الفوج المستهدف (ALL أو اسم الفوج)
  candidateIds?: string[]; // قائمة معرفات الطلاب المترشحين
  hifzMax: number; // النهاية العظمى للحفظ (افتراضي 40)
  tilawaMax: number; // النهاية العظمى لحسن التلاوة (افتراضي 30)
  tajweedMax: number; // النهاية العظمى للتجويد (افتراضي 30)
  totalMax: number; // 100
  description?: string;
}

export interface ExamRecord {
  id: string;
  examId?: string; // ربط بالمعرف الفرعي للاختبار ExamEntity.id
  studentId: string;
  studentName: string;
  group?: string;
  examDate: string; // YYYY-MM-DD
  juzOrPortion: string; // الجزء / السورة / المقدار الممتحن
  category?: string; // التصنيف
  examinerName?: string; // الشيخ المختبر
  breakdown: ExamDetailBreakdown;
  totalScore: number; // مجموع الدرجات الثلاث
  totalMax: number; // المجموع الأقصى
  grade?: string; // التقدير (ممتاز، جيد جداً، جيد، مقبول، يحتاج مراجعة)
  notes?: string;
}

export interface ColumnFilters {
  studentName: string;
  sessionId: string;
  status: string; // 'ALL' | AttendanceStatus
  dateSaisie: string;
  minAttendanceRate: number | '';
  recitation: string; // 'ALL' | 'CONFIRMED' | 'SELECTED' | 'NONE'
  oralParticipation: string; // 'ALL' | 'CONFIRMED' | 'SELECTED' | 'NONE'
}

export interface MonthlyReportData {
  month: number; // 0-11
  year: number;
  monthName: string;
  totalSessions: number;
  totalStudents: number;
  overallAttendanceRate: number;
  totalRecitations: number;
  totalOralParticipations: number;
  studentStats: {
    studentId: string;
    studentName: string;
    group?: string;
    presentCount: number;
    absentCount: number;
    retardCount?: number;
    excuseCount?: number;
    notMarkedCount?: number;
    totalMonthSessions: number;
    monthlyRate: number;
    recitationCount: number;
    oralCount: number;
  }[];
}

export type UserRole = 'ADMIN' | 'TEACHER';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  avatarColor?: string;
}

/**
 * Helper to normalize legacy boolean or string participation to 3-step ParticipationStatus
 */
export function normalizeParticipation(val: ParticipationStatus | boolean | undefined | null): ParticipationStatus {
  if (val === 'CONFIRMED' || val === true) return 'CONFIRMED';
  if (val === 'SELECTED') return 'SELECTED';
  return 'NONE';
}

/**
 * Cycles to next participation stage: NONE -> SELECTED -> CONFIRMED -> NONE
 */
export function cycleParticipation(current: ParticipationStatus | boolean | undefined | null): ParticipationStatus {
  const norm = normalizeParticipation(current);
  if (norm === 'NONE') return 'SELECTED';
  if (norm === 'SELECTED') return 'CONFIRMED';
  return 'NONE';
}
