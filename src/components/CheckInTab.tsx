import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  BookOpen, 
  Repeat, 
  Check, 
  UserCheck, 
  Barcode, 
  Hash, 
  RotateCcw, 
  XCircle, 
  AlertTriangle
} from 'lucide-react';
import { 
  Student, 
  Session, 
  AttendanceRecord, 
  AttendanceStatus, 
  ParticipationStatus,
  normalizeParticipation 
} from '../types';
import { getStudentHistoryInfo } from '../utils/storage';

interface CheckInTabProps {
  students: Student[];
  activeSession: Session | null;
  sessions: Session[];
  records: AttendanceRecord[];
  onUpdateStatus: (recordId: string, status: AttendanceStatus) => void;
  onCycleRecitation: (recordId: string) => void;
  onCycleOral: (recordId: string) => void;
  onMarkAllPresent: () => void;
  onCloseSession?: (sessionId: string) => void;
}

export const CheckInTab: React.FC<CheckInTabProps> = ({
  students = [],
  activeSession,
  sessions = [],
  records = [],
  onUpdateStatus,
  onCycleRecitation,
  onCycleOral,
  onMarkAllPresent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  // Compact ID Scanning States
  const [scannedIdInput, setScannedIdInput] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState<{
    student: Student;
    status: AttendanceStatus;
    timestamp: string;
    recordId: string;
  } | null>(null);
  const [scanErrorMessage, setScanErrorMessage] = useState<string | null>(null);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);

  const idInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus ID input on mount & session change
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
  }, [students, currentSessionRecords, records, sessions, activeSession]);

  // Filtered rows for fast lookup
  const filteredRows = useMemo(() => {
    return studentRows.filter(({ student }) => {
      const matchGroup = selectedGroup === 'ALL' || student.group === selectedGroup;
      if (!matchGroup) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const reverseName = `${student.lastName} ${student.firstName}`.toLowerCase();
      const idMatch = student.id.toLowerCase().includes(q);
      const hizbMatch = (student.hizbProgress || '').toLowerCase().includes(q);

      return fullName.includes(q) || reverseName.includes(q) || idMatch || hizbMatch;
    });
  }, [studentRows, selectedGroup, searchQuery]);

  // Flexible identifier finder supporting 5-digit formats and zero-padded IDs
  const findStudentByIdentifier = (inputStr: string): Student | undefined => {
    const clean = inputStr.trim();
    if (!clean) return undefined;
    const lowerClean = clean.toLowerCase();

    // 1. Exact match
    const exact = students.find((s) => s.id.toLowerCase() === lowerClean);
    if (exact) return exact;

    // 2. 5-digit / numeric match with leading zeros or direct equality
    const numericPart = clean.replace(/\D/g, '');
    if (numericPart) {
      const matchByNumber = students.find((s) => {
        const studentNum = s.id.replace(/\D/g, '');
        if (!studentNum) return false;
        return (
          studentNum === numericPart ||
          parseInt(studentNum, 10) === parseInt(numericPart, 10) ||
          studentNum.padStart(5, '0') === numericPart.padStart(5, '0')
        );
      });
      if (matchByNumber) return matchByNumber;
    }

    const matchByPhone = students.find((s) => s.phone && s.phone.replace(/\D/g, '') === clean.replace(/\D/g, ''));
    if (matchByPhone) return matchByPhone;

    return students.find((s) => s.id.toLowerCase().includes(lowerClean));
  };

  // Submit ID for Attendance Check-In
  const handleCheckInById = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setScanErrorMessage(null);

    const input = scannedIdInput.trim();
    if (!input) {
      setScanErrorMessage('أدخل معرف الطالب');
      return;
    }

    if (!activeSession) {
      setScanErrorMessage('يرجى تحديد حلقة نشطة أولاً');
      return;
    }

    const foundStudent = findStudentByIdentifier(input);

    if (!foundStudent) {
      setScanErrorMessage(`لم يتم العثور على طالب بالمعرف: "${input}"`);
      return;
    }

    const recordId = `${activeSession.id}_${foundStudent.id}`;

    // Update Attendance status to PRESENT
    onUpdateStatus(recordId, 'PRESENT');

    const nowTime = new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' });

    setLastScannedResult({
      student: foundStudent,
      status: 'PRESENT',
      timestamp: nowTime,
      recordId
    });

    setHighlightedStudentId(foundStudent.id);
    setTimeout(() => {
      setHighlightedStudentId(null);
    }, 3000);

    setScannedIdInput('');
    idInputRef.current?.focus();
  };

  const getParticipationBadge = (val: ParticipationStatus | boolean | undefined, type: 'recitation' | 'oral') => {
    const norm = normalizeParticipation(val);
    if (norm === 'CONFIRMED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>{type === 'recitation' ? 'تمت التلاوة' : 'تم التكرار'}</span>
        </span>
      );
    }
    if (norm === 'SELECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{type === 'recitation' ? 'قيد التلاوة' : 'قيد التكرار'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-slate-400 bg-slate-900 border border-slate-800 hover:border-slate-700">
        <span>—</span>
      </span>
    );
  };

  return (
    <div className="space-y-3 select-none">
      
      {/* 1. MINIMALIST ID SCANNER BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5 shadow-md">
        <form onSubmit={handleCheckInById} className="flex flex-wrap items-center gap-2">
          
          {/* Label */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 shrink-0">
            <Barcode className="w-3.5 h-3.5 text-emerald-400" />
            <span>المعرف:</span>
          </div>

          {/* Compact Input Field aligned directly with button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative w-24 sm:w-28 shrink-0">
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Hash className="w-3 h-3" />
              </div>
              
              <input
                ref={idInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={5}
                value={scannedIdInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setScannedIdInput(val);
                  if (scanErrorMessage) setScanErrorMessage(null);
                }}
                placeholder="00000"
                className="w-full h-8 pl-5 pr-6 bg-slate-950 border border-slate-700/90 focus:border-emerald-500 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all tracking-wider text-center"
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
                  className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Registration Button aligned seamlessly with same height */}
            <button
              type="submit"
              className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>تسجيل الحضور</span>
            </button>
          </div>

          {/* Active Session Badge (aligned on same line or wrapping smoothly) */}
          {activeSession && (
            <span className="hidden sm:inline-block text-[10px] text-emerald-400/90 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-500/20 truncate max-w-[160px] mr-auto">
              {activeSession.title}
            </span>
          )}
        </form>

        {/* Error Notification */}
        {scanErrorMessage && (
          <div className="mt-2 flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] font-medium animate-fade-in">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{scanErrorMessage}</span>
          </div>
        )}

        {/* Compact Single-Line Result Toast */}
        {lastScannedResult && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-xs animate-fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="font-bold text-slate-100 truncate">
                {lastScannedResult.student.lastName} {lastScannedResult.student.firstName}
              </span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/20">
                #{lastScannedResult.student.id.padStart(5, '0')}
              </span>
              <span className="text-[10px] text-slate-400">
                ({lastScannedResult.timestamp})
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onCycleRecitation(lastScannedResult.recordId)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3 text-sky-400" />
                <span>تلاوة</span>
              </button>

              <button
                type="button"
                onClick={() => onCycleOral(lastScannedResult.recordId)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-[10px] font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Repeat className="w-3 h-3 text-teal-400" />
                <span>تكرار</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(lastScannedResult.recordId, 'ABSENT');
                  setLastScannedResult(null);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950/40 text-rose-300 text-[10px] font-medium border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span>تراجع</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. MINIMALIST FILTER & BATCH BAR */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-sm text-xs">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="تصفية بالاسم أو المعرف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-2.5 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Quick Batch Button */}
        <button
          onClick={onMarkAllPresent}
          className="px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>الكل حاضر</span>
        </button>
      </div>

      {/* 3. ROSTER & CHECK-IN TABLE (MOBILE & TABLET OPTIMIZED) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                <th className="py-2 px-2.5 w-10 text-center">#</th>
                <th className="py-2 px-3 min-w-[160px]">الطالب والمعرف</th>
                <th className="py-2 px-2.5 min-w-[130px] text-center">الحضور</th>
                <th className="py-2 px-2.5 min-w-[100px] text-center">التلاوة</th>
                <th className="py-2 px-2.5 min-w-[100px] text-center">تكرار</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    لا يوجد طلاب مطابقين لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ student, record }, idx) => {
                  const recordId = record?.id || `${activeSession?.id}_${student.id}`;
                  const currentStatus = record?.status || 'ABSENT';
                  const isPresent = currentStatus === 'PRESENT';
                  const isAbsent = !isPresent;
                  const isHighlighted = highlightedStudentId === student.id;

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isHighlighted ? 'bg-emerald-500/20 ring-1 ring-emerald-400' :
                        isPresent ? 'bg-emerald-950/15' : 'bg-transparent'
                      }`}
                    >
                      {/* Index */}
                      <td className="py-2 px-2 text-center text-slate-500 font-mono text-[10px]">
                        {idx + 1}
                      </td>

                      {/* Student Info */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${student.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center font-bold text-[11px] shrink-0`}>
                            {student.lastName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-100 text-xs truncate">
                              {student.lastName} {student.firstName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/70 px-1 py-0.2 rounded border border-emerald-500/25">
                                #{student.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Attendance Status Toggle */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="inline-flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 gap-0.5">
                          <button
                            onClick={() => onUpdateStatus(recordId, 'PRESENT')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-emerald-400'
                            }`}
                          >
                            حاضر
                          </button>

                          <button
                            onClick={() => onUpdateStatus(recordId, 'ABSENT')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                              isAbsent
                                ? 'bg-rose-600/90 text-white shadow-xs'
                                : 'text-slate-400 hover:text-rose-400'
                            }`}
                          >
                            غائب
                          </button>
                        </div>
                      </td>

                      {/* Recitation */}
                      <td className="py-2 px-2.5 text-center">
                        <button
                          onClick={() => onCycleRecitation(recordId)}
                          className="cursor-pointer transition-transform active:scale-95"
                          title="نقر لتسجيل/تأكيد التلاوة"
                        >
                          {getParticipationBadge(record?.recitation, 'recitation')}
                        </button>
                      </td>

                      {/* Oral Repetition */}
                      <td className="py-2 px-2.5 text-center">
                        <button
                          onClick={() => onCycleOral(recordId)}
                          className="cursor-pointer transition-transform active:scale-95"
                          title="نقر لتسجيل/تأكيد التكرار"
                        >
                          {getParticipationBadge(record?.oralParticipation, 'oral')}
                        </button>
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
