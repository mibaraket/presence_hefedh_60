import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  UserX, 
  FileCheck, 
  HelpCircle, 
  Search, 
  Filter, 
  BookOpen, 
  Mic, 
  Check, 
  RotateCw, 
  UserCheck,
  Award,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  MessageSquare,
  Sparkles,
  Edit3,
  Scan,
  Barcode,
  Hash,
  Volume2,
  VolumeX,
  RotateCcw,
  History,
  ArrowLeft,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  Student, 
  Session, 
  AttendanceRecord, 
  AttendanceStatus, 
  ParticipationStatus,
  normalizeParticipation, 
  cycleParticipation 
} from '../types';
import { getStudentHistoryInfo } from '../utils/storage';
import { soundManager } from '../utils/sound';

interface CheckInTabProps {
  students: Student[];
  activeSession: Session | null;
  sessions: Session[];
  records: AttendanceRecord[];
  onUpdateStatus: (recordId: string, status: AttendanceStatus) => void;
  onCycleRecitation: (recordId: string) => void;
  onCycleOral: (recordId: string) => void;
  onUpdateNote: (recordId: string, note: string) => void;
  onMarkAllPresent: () => void;
}

interface RecentScanEntry {
  student: Student;
  status: AttendanceStatus;
  timestamp: string;
  recordId: string;
}

export const CheckInTab: React.FC<CheckInTabProps> = ({
  students = [],
  activeSession,
  sessions = [],
  records = [],
  onUpdateStatus,
  onCycleRecitation,
  onCycleOral,
  onUpdateNote,
  onMarkAllPresent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  // ID Scanning & Quick Check-In States
  const [scannedIdInput, setScannedIdInput] = useState('');
  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>('PRESENT');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedResult, setLastScannedResult] = useState<{
    student: Student;
    status: AttendanceStatus;
    timestamp: string;
    recordId: string;
    isDuplicate?: boolean;
    previousStatus?: AttendanceStatus;
  } | null>(null);
  const [scanErrorMessage, setScanErrorMessage] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScanEntry[]>([]);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);

  const idInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus the ID input on mount & when session is active
  useEffect(() => {
    idInputRef.current?.focus();
  }, [activeSession?.id]);

  // Extract unique groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    (students || []).forEach((s) => {
      if (s.group) set.add(s.group);
    });
    return Array.from(set);
  }, [students]);

  // Current session records
  const currentSessionRecords = useMemo(() => {
    if (!activeSession) return [];
    return (records || []).filter((r) => r.sessionId === activeSession.id);
  }, [records, activeSession]);

  // Merge student with current record
  const studentRows = useMemo(() => {
    return (students || []).map((student) => {
      const record = currentSessionRecords.find((r) => r.studentId === student.id);
      const history = getStudentHistoryInfo(student.id, activeSession?.id || '', records, sessions);

      return {
        student,
        record,
        history
      };
    });
  }, [students, currentSessionRecords, activeSession, records, sessions]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return studentRows.filter(({ student }) => {
      const matchesSearch = 
        `${student.lastName} ${student.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.hizbProgress || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGroup = selectedGroup === 'ALL' || student.group === selectedGroup;

      return matchesSearch && matchesGroup;
    });
  }, [studentRows, searchQuery, selectedGroup]);

  // Summary counts
  const stats = useMemo(() => {
    const present = currentSessionRecords.filter((r) => r.status === 'PRESENT').length;
    const absent = currentSessionRecords.filter((r) => r.status === 'ABSENT').length;
    const recitationsConfirmed = currentSessionRecords.filter((r) => normalizeParticipation(r.recitation) === 'CONFIRMED').length;
    const oralConfirmed = currentSessionRecords.filter((r) => normalizeParticipation(r.oralParticipation) === 'CONFIRMED').length;
    const total = students.length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      attendanceRate,
      recitationsConfirmed,
      oralConfirmed
    };
  }, [students, currentSessionRecords]);

  // Flexible Student Match by Unique ID, numeric sequence, or code
  const findStudentByIdentifier = (rawInput: string): Student | undefined => {
    const clean = rawInput.trim();
    if (!clean) return undefined;

    const lowerClean = clean.toLowerCase();

    // 1. Exact ID match (case-insensitive)
    const exact = students.find((s) => s.id.toLowerCase() === lowerClean);
    if (exact) return exact;

    // 2. Exact match on cleaned numbers or alphanumeric (e.g. STU-001 vs STU001 vs 1)
    const numericPart = clean.replace(/\D/g, '');
    if (numericPart) {
      const matchByNumber = students.find((s) => {
        const studentNum = s.id.replace(/\D/g, '');
        return studentNum === numericPart || parseInt(studentNum, 10) === parseInt(numericPart, 10);
      });
      if (matchByNumber) return matchByNumber;
    }

    // 3. Match by phone or exact national ID
    const matchByPhone = students.find((s) => s.phone && s.phone.replace(/\D/g, '') === clean.replace(/\D/g, ''));
    if (matchByPhone) return matchByPhone;

    // 4. Match if ID contains input or starts with
    const partialMatch = students.find((s) => s.id.toLowerCase().includes(lowerClean));
    if (partialMatch) return partialMatch;

    return undefined;
  };

  // Submit ID for Attendance Check-In
  const handleCheckInById = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setScanErrorMessage(null);

    const input = scannedIdInput.trim();
    if (!input) {
      setScanErrorMessage('يرجى كتابة أو مسح المعرف الوحيد للطالب (ID)');
      return;
    }

    if (!activeSession) {
      setScanErrorMessage('يرجى اختيار أو فتح حلقة نشطة أولاً لتسجيل الحضور');
      return;
    }

    const foundStudent = findStudentByIdentifier(input);

    if (!foundStudent) {
      setScanErrorMessage(`لم يتم العثور على طالب بالمعرف: "${input}"`);
      return;
    }

    const recordId = `${activeSession.id}_${foundStudent.id}`;
    const existingRecord = currentSessionRecords.find((r) => r.studentId === foundStudent.id);
    const prevStatus = existingRecord?.status || 'NOT_MARKED';
    const isDuplicate = prevStatus === 'PRESENT';

    // Update Attendance status to PRESENT
    onUpdateStatus(recordId, 'PRESENT');

    const nowTime = new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Set last scanned feedback card
    setLastScannedResult({
      student: foundStudent,
      status: 'PRESENT',
      timestamp: nowTime,
      recordId,
      isDuplicate,
      previousStatus: prevStatus
    });

    // Add to recent scans log
    setRecentScans((prev) => [
      {
        student: foundStudent,
        status: 'PRESENT',
        timestamp: nowTime,
        recordId
      },
      ...prev.filter((p) => p.student.id !== foundStudent.id).slice(0, 5)
    ]);

    // Highlight row
    setHighlightedStudentId(foundStudent.id);
    setTimeout(() => {
      setHighlightedStudentId(null);
    }, 3500);

    // Reset input and keep focus for rapid scanning
    setScannedIdInput('');
    idInputRef.current?.focus();
  };

  const handleSaveNote = (recordId: string) => {
    onUpdateNote(recordId, tempNote.trim());
    setEditingNoteId(null);
  };

  const getParticipationBadge = (val: ParticipationStatus | boolean | undefined, type: 'recitation' | 'oral') => {
    const norm = normalizeParticipation(val);
    if (norm === 'CONFIRMED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{type === 'recitation' ? 'تمت التلاوة' : 'تم التكرار'}</span>
        </span>
      );
    }
    if (norm === 'SELECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs animate-pulse">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{type === 'recitation' ? 'قيد التلاوة (تأكيد؟)' : 'قيد التكرار (تأكيد؟)'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700 hover:border-slate-600">
        <span>—</span>
        <span className="text-[10px] text-slate-500">{type === 'recitation' ? 'تلاوة' : 'تكرار'}</span>
      </span>
    );
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    return status === 'PRESENT' ? 'حاضر (Présent)' : 'غائب (Absent)';
  };

  const getStatusColorBadge = (status: AttendanceStatus) => {
    return status === 'PRESENT' 
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
      : 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  return (
    <div className="space-y-4">
      
      {/* 1. UNIQUE IDENTIFIER (ID) INSTANT CHECK-IN SCANNER STATION */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                <Barcode className="w-5 h-5" />
              </div>
               <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-100 tracking-tight">
                    تسجيل الحضور بالمعرف الوحيد (ID Scanner)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    تسجيل فوري
                  </span>
                </div>
              </div>
            </div>

            {/* Controls: Sound toggle & Session Badge */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>الحلقة: <strong className="text-emerald-400 font-bold">{activeSession?.title || 'لا توجد حلقة محددة'}</strong></span>
              </div>
            </div>
          </div>

          {/* Scanner Input Form & Action */}
          <form onSubmit={handleCheckInById} className="space-y-3">
            
            {/* Input & Action Button */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                </div>
                
                <input
                  ref={idInputRef}
                  type="text"
                  value={scannedIdInput}
                  onChange={(e) => setScannedIdInput(e.target.value)}
                  placeholder="اكتب المعرف الوحيد للطالب هنا (مثال: 871) ثم اضغط Enter أو امسح الباركود..."
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border-2 border-emerald-500/40 focus:border-emerald-400 rounded-2xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner"
                  autoComplete="off"
                  spellCheck="false"
                />

                {scannedIdInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setScannedIdInput('');
                      idInputRef.current?.focus();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-950/60 active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>تسجيل الحضور (Enter)</span>
              </button>
            </div>

            {/* Error banner if ID not found */}
            {scanErrorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{scanErrorMessage}</span>
              </div>
            )}

          </form>

          {/* Flash Result Card (Last Scanned Student) */}
          {lastScannedResult && (
            <div className="bg-slate-950/90 border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl ${lastScannedResult.student.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md ring-2 ring-emerald-400/30`}>
                  {lastScannedResult.student.lastName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-100">
                      {lastScannedResult.student.lastName} {lastScannedResult.student.firstName}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700">
                      ID: {lastScannedResult.student.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusColorBadge(lastScannedResult.status)}`}>
                      {getStatusLabel(lastScannedResult.status)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>الفوج: <strong className="text-slate-300">{lastScannedResult.student.group || 'فوج الستين'}</strong></span>
                    <span>•</span>
                    <span>الحفظ: <strong className="text-emerald-400">{lastScannedResult.student.hizbProgress || 'الحزب 1'}</strong></span>
                    <span>•</span>
                    <span className="text-slate-500 font-mono">وقت التسجيل: {lastScannedResult.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions for the Last Scanned Student */}
              <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                <button
                  type="button"
                  onClick={() => onCycleRecitation(lastScannedResult.recordId)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  title="تسجيل ترشيح أو تأكيد التسميع القرآني"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>تسميع قرآن</span>
                </button>

                <button
                  type="button"
                  onClick={() => onCycleOral(lastScannedResult.recordId)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  title="تسجيل ترشيح أو تأكيد المشاركة الشفوية"
                >
                  <Mic className="w-3.5 h-3.5 text-teal-400" />
                  <span>مشاركة شفوية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(lastScannedResult.recordId, 'NOT_MARKED');
                    setLastScannedResult(null);
                    if (soundEnabled) soundManager.playWarning();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-rose-300 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                  title="إلغاء تسجيل الحضور لهذا الطالب"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>تراجع</span>
                </button>
              </div>
            </div>
          )}

          {/* Recent Scans Mini Timeline */}
          {recentScans.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-semibold shrink-0">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                <span>آخر المسجلات:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {recentScans.map((scan) => (
                  <div 
                    key={scan.student.id} 
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px]"
                  >
                    <span className="font-bold text-slate-200">{scan.student.lastName} {scan.student.firstName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({scan.student.id})</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${getStatusColorBadge(scan.status)}`}>
                      {scan.status === 'PRESENT' ? 'حاضر' : 'غائب'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">{scan.timestamp.slice(0, 5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 2. TOP STATS BAR - 2 STATUS MODEL */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-semibold text-slate-400">إجمالي الطلاب</div>
            <div className="text-xl font-black text-slate-100 mt-0.5">{stats.total}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
            {stats.total}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-semibold text-emerald-400">الحاضرون</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{stats.present}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-semibold text-rose-400">الغائبون</div>
            <div className="text-xl font-black text-rose-400 mt-0.5">{stats.absent}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <UserX className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-semibold text-indigo-400">نسبة الحضور</div>
            <div className="text-xl font-black text-indigo-400 mt-0.5">{stats.attendanceRate}%</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xs font-bold font-mono">
            %
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-semibold text-sky-400">التلاوة المؤكدة</div>
            <div className="text-xl font-black text-sky-400 mt-0.5">{stats.recitationsConfirmed}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] font-semibold text-teal-400">جلسات التكرار</div>
            <div className="text-xl font-black text-teal-400 mt-0.5">{stats.oralConfirmed}</div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* 3. FILTER AND BATCH ACTION BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
        
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="تصفية الجدول بالاسم أو المعرف أو الحفظ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="ALL">كافة الأفواج والحلقات</option>
              {groups.map((grp) => (
                <option key={grp} value={grp}>{grp}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMarkAllPresent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تسجيل الكل حاضر</span>
          </button>
        </div>

      </div>

      {/* 4. ROSTER & CHECK-IN TABLE */}
      <div ref={tableContainerRef} className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[200px]">الطالب والمعرف الوحيد (ID)</th>
                <th className="py-3 px-3 min-w-[140px]">الحلقة والحفظ</th>
                <th className="py-3 px-3 min-w-[180px] text-center">حالة الحضور</th>
                <th className="py-3 px-3 min-w-[140px] text-center">
                  <span>التلاوة</span>
                  <span className="block text-[9px] text-slate-500 font-normal">نقر أول: ترشيح • نقر ثانٍ: تأكيد</span>
                </th>
                <th className="py-3 px-3 min-w-[140px] text-center">
                  <span>تكرار</span>
                  <span className="block text-[9px] text-slate-500 font-normal">نقر أول: ترشيح • نقر ثانٍ: تأكيد</span>
                </th>
                <th className="py-3 px-4 min-w-[180px]">ملاحظة</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    لا يوجد طلاب مطابقين لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ student, record, history }, idx) => {
                  const recordId = record?.id || `${activeSession?.id}_${student.id}`;
                  const currentStatus = record?.status || 'ABSENT';
                  const isPresent = currentStatus === 'PRESENT';
                  const isAbsent = !isPresent;
                  const isHighlighted = highlightedStudentId === student.id;

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-slate-800/40 transition-all ${
                        isHighlighted ? 'bg-emerald-500/25 ring-2 ring-emerald-400 z-10' :
                        isPresent ? 'bg-emerald-950/15' : 'bg-rose-950/5'
                      }`}
                    >
                      
                      {/* Index */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Student Info with Highlighted ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl ${student.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                            {student.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 leading-tight">
                              {student.lastName} {student.firstName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                {student.id}
                              </span>
                              {record?.entryTimestamp && (
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {record.entryTimestamp}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group & Hizb */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-300 text-[11px] leading-tight">
                          {student.group || 'فوج الستين'}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                          {student.hizbProgress || 'قيد المتابعة'}
                        </div>
                      </td>

                      {/* Attendance Status Buttons - ONLY 2 STATUSES */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl gap-1">
                          
                          <button
                            onClick={() => onUpdateStatus(recordId, 'PRESENT')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
                            }`}
                          >
                            حاضر
                          </button>

                          <button
                            onClick={() => onUpdateStatus(recordId, 'ABSENT')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
                            }`}
                          >
                            غائب
                          </button>

                        </div>
                      </td>

                      {/* Recitation (Two-step click) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onCycleRecitation(recordId)}
                          className="cursor-pointer transition-transform active:scale-95"
                          title="نقر للترشيح ثم نقر ثانٍ للتأكيد"
                        >
                          {getParticipationBadge(record?.recitation, 'recitation')}
                        </button>
                      </td>

                      {/* Oral Participation (Two-step click) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onCycleOral(recordId)}
                          className="cursor-pointer transition-transform active:scale-95"
                          title="نقر للترشيح ثم نقر ثانٍ للتأكيد"
                        >
                          {getParticipationBadge(record?.oralParticipation, 'oral')}
                        </button>
                      </td>

                      {/* Note Column */}
                      <td className="py-3 px-4">
                        {editingNoteId === recordId ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              placeholder="أدخل الملاحظة..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNote(recordId);
                                if (e.key === 'Escape') setEditingNoteId(null);
                              }}
                              className="w-full px-2.5 py-1 bg-slate-950 border border-emerald-500 rounded-lg text-xs text-slate-100 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveNote(recordId)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              حفظ
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNoteId(recordId);
                              setTempNote(record?.notes || '');
                            }}
                            className="w-full text-right flex items-center justify-between gap-1.5 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors group cursor-pointer"
                          >
                            <span className="truncate text-[11px] text-slate-300">
                              {record?.notes || <span className="text-slate-600 font-normal italic">إضافة ملاحظة...</span>}
                            </span>
                            <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
