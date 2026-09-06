import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Shuffle, 
  Search, 
  Mic, 
  Filter, 
  Check, 
  Hash, 
  Dices, 
  Layers, 
  Award, 
  Users, 
  Info,
  UserX,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { 
  Student, 
  Session, 
  AttendanceRecord, 
  normalizeParticipation 
} from '../types';

interface RecitationQueueTabProps {
  students: Student[];
  sessions: Session[];
  records: AttendanceRecord[];
  activeSession: Session | null;
  onCycleRecitation: (recordId: string) => void;
  onCycleOral: (recordId: string) => void;
  onMarkPresentAndRecite: (studentId: string) => void;
  onSelectSession: (sessionId: string) => void;
  onResetRecitationQueue?: () => void;
  onResetRepetitionQueue?: () => void;
  onMarkAllPresent?: () => void;
}

type ViewMode = 'dual' | 'recitation_ordered' | 'repetition_random' | 'completed_today';

// Natural alphanumeric sorting by Unique ID (e.g. 1, 2, 10, 871, 872)
const sortByIdNatural = (aId: string, bId: string) => {
  return aId.localeCompare(bId, undefined, { numeric: true, sensitivity: 'base' });
};

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const RecitationQueueTab: React.FC<RecitationQueueTabProps> = ({
  students = [],
  sessions = [],
  records = [],
  activeSession,
  onCycleRecitation,
  onCycleOral,
  onResetRecitationQueue,
  onResetRepetitionQueue,
  onMarkAllPresent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [onlyPresentFilter, setOnlyPresentFilter] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  
  // State for generated random repetition (oral participation) list
  const [isRepetitionListGenerated, setIsRepetitionListGenerated] = useState(false);
  const [generatedRepetitionIds, setGeneratedRepetitionIds] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [allowExpandRepetitionPool, setAllowExpandRepetitionPool] = useState(false);
  const [bannerNotification, setBannerNotification] = useState<string | null>(null);

  const currentSessionId = activeSession?.id || (sessions[0]?.id || '');

  // Determine chronological previous session
  const previousSession = useMemo(() => {
    if (!sessions || sessions.length <= 1) return null;
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    const currentIndex = sorted.findIndex((s) => s.id === currentSessionId);
    if (currentIndex > 0) {
      return sorted[currentIndex - 1];
    }
    return null;
  }, [sessions, currentSessionId]);

  const currentSessionRecords = useMemo(() => {
    return (records || []).filter((r) => r.sessionId === currentSessionId);
  }, [records, currentSessionId]);

  const previousSessionRecords = useMemo(() => {
    if (!previousSession) return [];
    return (records || []).filter((r) => r.sessionId === previousSession.id);
  }, [records, previousSession]);

  // Extract unique groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.group) set.add(s.group);
    });
    return Array.from(set);
  }, [students]);

  // Comprehensive Student Augmented Status Data
  const studentDataList = useMemo(() => {
    return (students || []).map((student) => {
      const studentAllRecords = (records || []).filter((r) => r.studentId === student.id);
      const currentRecord = currentSessionRecords.find((r) => r.studentId === student.id);
      const prevRecord = previousSessionRecords.find((r) => r.studentId === student.id);
      
      // Past confirmed participations (excluding active session)
      const pastRecitationRecords = studentAllRecords.filter(
        (r) => r.sessionId !== currentSessionId && normalizeParticipation(r.recitation) === 'CONFIRMED'
      );
      const pastOralRecords = studentAllRecords.filter(
        (r) => r.sessionId !== currentSessionId && normalizeParticipation(r.oralParticipation) === 'CONFIRMED'
      );

      const totalPastRecitations = pastRecitationRecords.length;
      const totalPastOrals = pastOralRecords.length;

      // Participation in previous session
      const participatedInPreviousSession = prevRecord 
        ? normalizeParticipation(prevRecord.oralParticipation) === 'CONFIRMED'
        : false;

      const recitedInPreviousSession = prevRecord
        ? normalizeParticipation(prevRecord.recitation) === 'CONFIRMED'
        : false;

      // Current session statuses (2-status model: PRESENT or ABSENT)
      const isPresentToday = currentRecord ? currentRecord.status === 'PRESENT' : false;
      const recitationStatus = normalizeParticipation(currentRecord?.recitation);
      const oralStatus = normalizeParticipation(currentRecord?.oralParticipation);
      const currentStatus = currentRecord ? currentRecord.status : 'ABSENT';

      const recordId = currentRecord?.id || `${currentSessionId}_${student.id}`;

      return {
        student,
        currentRecord,
        recordId,
        isPresentToday,
        recitationStatus,
        oralStatus,
        currentStatus,
        totalPastRecitations,
        totalPastOrals,
        participatedInPreviousSession,
        recitedInPreviousSession
      };
    });
  }, [students, records, currentSessionRecords, previousSessionRecords, currentSessionId]);

  // Summary counts
  const presentCount = studentDataList.filter((s) => s.isPresentToday).length;

  // Filter helper for search & group & presence
  const matchesFilter = (item: typeof studentDataList[0]) => {
    if (onlyPresentFilter && presentCount > 0 && !item.isPresentToday) return false;
    if (selectedGroup !== 'ALL' && item.student.group !== selectedGroup) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = `${item.student.lastName} ${item.student.firstName}`.toLowerCase().includes(q);
      const matchId = item.student.id.toLowerCase().includes(q);
      const matchHizb = (item.student.hizbProgress || '').toLowerCase().includes(q);
      const matchGroup = (item.student.group || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchHizb && !matchGroup) return false;
    }
    return true;
  };

  // 1. LISTE 1: قائمة التلاوة (التسميع القرآني)
  const recitationQueue = useMemo(() => {
    const list = studentDataList
      .filter((item) => item.recitationStatus !== 'CONFIRMED')
      .filter(matchesFilter);

    return list.sort((a, b) => {
      // Prioritize candidates who did NOT recite in previous session
      if (a.recitedInPreviousSession !== b.recitedInPreviousSession) {
        return a.recitedInPreviousSession ? 1 : -1;
      }
      // Then sort strictly by Unique ID
      return sortByIdNatural(a.student.id, b.student.id);
    });
  }, [studentDataList, onlyPresentFilter, presentCount, selectedGroup, searchQuery]);

  // 2. LISTE 2: CANDIDATS ÉLIGIBLES POUR LE TIKRAR / RÉPÉTITION (التكرار - المشاركة الشفوية)
  const eligibleRepetitionCandidates = useMemo(() => {
    const presentAndNotRecitedToday = studentDataList.filter((item) => {
      if (onlyPresentFilter && presentCount > 0 && !item.isPresentToday) return false;
      if (item.recitationStatus === 'CONFIRMED' || item.recitationStatus === 'SELECTED') return false;
      if (item.oralStatus === 'CONFIRMED') return false;
      if (selectedGroup !== 'ALL' && item.student.group !== selectedGroup) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = `${item.student.lastName} ${item.student.firstName}`.toLowerCase().includes(q);
        const matchId = item.student.id.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });

    // Candidates with 0 past oral repetitions
    const zeroPastOrals = presentAndNotRecitedToday.filter((item) => item.totalPastOrals === 0);

    if (zeroPastOrals.length > 0 && !allowExpandRepetitionPool) {
      return zeroPastOrals;
    }

    // Fallback/Expanded: candidates who did not participate in oral repetition in the immediate previous session
    const notInPrev = presentAndNotRecitedToday.filter((item) => !item.participatedInPreviousSession);
    if (notInPrev.length > 0) {
      return notInPrev;
    }

    // Comprehensive Fallback 1: any present who hasn't recited today
    if (presentAndNotRecitedToday.length > 0) {
      return presentAndNotRecitedToday;
    }

    // Comprehensive Fallback 2: any student matching presence and group who hasn't repeated today
    const fallbackAny = studentDataList.filter((item) => {
      if (onlyPresentFilter && presentCount > 0 && !item.isPresentToday) return false;
      if (item.oralStatus === 'CONFIRMED') return false;
      if (selectedGroup !== 'ALL' && item.student.group !== selectedGroup) return false;
      return true;
    });

    return fallbackAny;
  }, [studentDataList, onlyPresentFilter, presentCount, selectedGroup, searchQuery, allowExpandRepetitionPool]);

  // Handler to generate the random repetition list
  const handleGenerateRepetitionList = () => {
    setIsRolling(true);
    let candidatesToDraw = eligibleRepetitionCandidates;
    
    // If candidates list is empty, take all remaining students matching group
    if (candidatesToDraw.length === 0) {
      candidatesToDraw = studentDataList.filter((item) => {
        if (selectedGroup !== 'ALL' && item.student.group !== selectedGroup) return false;
        if (onlyPresentFilter && presentCount > 0 && !item.isPresentToday) return false;
        return true;
      });
    }

    const ids = candidatesToDraw.map((c) => c.student.id);
    const shuffledIds = shuffleArray(ids.length > 0 ? ids : students.map((s) => s.id));
    
    setTimeout(() => {
      setGeneratedRepetitionIds(shuffledIds);
      setIsRepetitionListGenerated(true);
      setIsRolling(false);
      setBannerNotification('تم إجراء القرعة العشوائية وتوليد قائمة التكرار بنجاح!');
      setTimeout(() => setBannerNotification(null), 3500);
    }, 350);
  };

  // Re-shuffle repetition list
  const handleReshuffleRepetitionList = () => {
    setIsRolling(true);
    const shuffledIds = shuffleArray([...generatedRepetitionIds]);
    setTimeout(() => {
      setGeneratedRepetitionIds(shuffledIds);
      setIsRolling(false);
      setBannerNotification('تمت إعادة خلط القرعة العشوائية!');
      setTimeout(() => setBannerNotification(null), 2500);
    }, 300);
  };

  // Restart Recitation Queue from beginning
  const handleRestartRecitation = () => {
    onResetRecitationQueue?.();
    setBannerNotification('تمت إعادة ضبط دورة التلاوة من الأول لجميع الطلاب الحاضرين!');
    setTimeout(() => setBannerNotification(null), 3500);
  };

  // Restart Repetition Queue and immediately run a brand new draw from the beginning
  const handleRestartRepetition = () => {
    // 1. Reset oral participations in state
    onResetRepetitionQueue?.();

    // 2. Compute the fresh candidate pool to draw from (assuming oral status reset to NONE)
    let pool = students.map((student) => {
      const currentRecord = currentSessionRecords.find((r) => r.studentId === student.id);
      const isPresentToday = currentRecord ? currentRecord.status === 'PRESENT' : false;
      const recitationStatus = normalizeParticipation(currentRecord?.recitation);
      const studentAllRecords = (records || []).filter((r) => r.studentId === student.id);
      const pastOralRecords = studentAllRecords.filter(
        (r) => r.sessionId !== currentSessionId && normalizeParticipation(r.oralParticipation) === 'CONFIRMED'
      );
      const totalPastOrals = pastOralRecords.length;
      const prevRecord = previousSessionRecords.find((r) => r.studentId === student.id);
      const participatedInPreviousSession = prevRecord 
        ? normalizeParticipation(prevRecord.oralParticipation) === 'CONFIRMED'
        : false;

      return {
        student,
        isPresentToday,
        recitationStatus,
        oralStatus: 'NONE' as const,
        totalPastOrals,
        participatedInPreviousSession
      };
    });

    if (onlyPresentFilter && presentCount > 0) {
      pool = pool.filter((item) => item.isPresentToday);
    }
    if (selectedGroup !== 'ALL') {
      pool = pool.filter((item) => item.student.group === selectedGroup);
    }

    // Exclude students who completed recitation today if there are other candidates
    const notRecited = pool.filter((item) => item.recitationStatus !== 'CONFIRMED' && item.recitationStatus !== 'SELECTED');
    if (notRecited.length > 0) {
      pool = notRecited;
    }

    // Prioritize candidates with zero past oral repetitions
    const zeroOrals = pool.filter((item) => item.totalPastOrals === 0);
    let finalCandidateList = pool;
    if (zeroOrals.length > 0 && !allowExpandRepetitionPool) {
      finalCandidateList = zeroOrals;
    } else {
      const notInPrev = pool.filter((item) => !item.participatedInPreviousSession);
      if (notInPrev.length > 0) {
        finalCandidateList = notInPrev;
      }
    }

    const ids = finalCandidateList.map((item) => item.student.id);
    const shuffled = shuffleArray(ids.length > 0 ? ids : students.map((s) => s.id));

    // 3. Immediately set the generated draw and activate list
    setIsRolling(true);
    setGeneratedRepetitionIds(shuffled);
    setIsRepetitionListGenerated(true);

    setBannerNotification('تم تصفير قائمة التكرار وبدء سحب قرعة جديدة بالكامل بنجاح!');
    setTimeout(() => {
      setIsRolling(false);
    }, 350);
    setTimeout(() => {
      setBannerNotification(null);
    }, 4000);
  };

  // The actual ordered list for repetition (preserves random draw order)
  const repetitionQueue = useMemo(() => {
    if (!isRepetitionListGenerated) return [];

    // Map ordered IDs back to student objects that haven't confirmed repetition yet
    const remainingStudents = studentDataList
      .filter((s) => s.oralStatus !== 'CONFIRMED')
      .filter((s) => matchesFilter(s));

    const resultMap: typeof studentDataList = [];
    
    // First, in the exact shuffled order
    generatedRepetitionIds.forEach((id) => {
      const found = remainingStudents.find((s) => s.student.id === id);
      if (found && !resultMap.some((r) => r.student.id === id)) {
        resultMap.push(found);
      }
    });

    // Any newly eligible student not yet in generated IDs gets appended
    remainingStudents.forEach((s) => {
      if (!generatedRepetitionIds.includes(s.student.id) && !resultMap.some((r) => r.student.id === s.student.id)) {
        resultMap.push(s);
      }
    });

    return resultMap;
  }, [isRepetitionListGenerated, generatedRepetitionIds, studentDataList, onlyPresentFilter, presentCount, selectedGroup, searchQuery]);

  // 3. COMPLETED LIST TODAY
  const completedTodayList = useMemo(() => {
    return studentDataList
      .filter((item) => item.recitationStatus === 'CONFIRMED' || item.oralStatus === 'CONFIRMED')
      .filter(matchesFilter)
      .sort((a, b) => sortByIdNatural(a.student.id, b.student.id));
  }, [studentDataList, onlyPresentFilter, selectedGroup, searchQuery]);

  // Summary counts
  const completedRecitationCount = studentDataList.filter((s) => s.recitationStatus === 'CONFIRMED').length;
  const completedRepetitionCount = studentDataList.filter((s) => s.oralStatus === 'CONFIRMED').length;

  return (
    <div className="space-y-4 font-['Cairo',sans-serif]">
      
      {/* 1. TOP HEADER & INSTRUCTION BANNER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
                الحلقة النشطة: {activeSession?.title || 'جلسة اليوم'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({activeSession?.date || '—'})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 mt-1">
              قوائم وتناوب التلاوة والتكرار
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
              <strong>1. قائمة التلاوة:</strong> قائمة مرتبة تصاعدياً بالمعرف الوحيد لتنظيم التناوب وتكافؤ الأدوار للطلاب الحاضرين الذين لم يسمّعوا في الحصة السابقة.
              <br />
              <strong>2. قائمة التكرار:</strong> قرعة عشوائية يتم توليدها بزر للمرشحين الذين لم يشاركوا في تلاوة اليوم ولم يسبق لهم التكرار.
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
            <div className="px-3 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-[10px] text-slate-400 font-bold">الحاضرون اليوم</div>
              <div className="text-base font-black text-emerald-400">{presentCount}</div>
            </div>

            <div className="px-3 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-[10px] text-emerald-400 font-bold">أتموا التلاوة</div>
              <div className="text-base font-black text-emerald-400">{completedRecitationCount}</div>
            </div>

            <div className="px-3 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-[10px] text-teal-400 font-bold">أتموا التكرار</div>
              <div className="text-base font-black text-teal-400">{completedRepetitionCount}</div>
            </div>
          </div>

        </div>
      </div>

      {/* Dynamic Feedback Notification Banner */}
      {bannerNotification && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{bannerNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotification(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-mono px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Notice if no students are marked present yet */}
      {presentCount === 0 && onlyPresentFilter && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              جميع الطلاب مسجلون كغائبين افتراضياً لهذه الحصة. يمكنك تسجيل حضور الجميع بنقرة واحدة، أو إلغاء فلتر الحضور لإجراء القرعة والتلاوة لكافة المسجلين.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onMarkAllPresent && (
              <button
                type="button"
                onClick={() => {
                  onMarkAllPresent();
                  setBannerNotification('تم تسجيل حضور جميع الطلاب بنجاح!');
                  setTimeout(() => setBannerNotification(null), 3000);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                تسجيل حضور الجميع الآن
              </button>
            )}
            <button
              type="button"
              onClick={() => setOnlyPresentFilter(false)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer"
            >
              عرض كافة الطلاب
            </button>
          </div>
        </div>
      )}

      {/* 2. NAVIGATION MODES & CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-xl">
        
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Main View Mode Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('dual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'dual'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>عرض مزدوج (تلاوة + تكرار)</span>
            </button>

            <button
              onClick={() => setViewMode('recitation_ordered')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'recitation_ordered'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. قائمة التلاوة ({recitationQueue.length})</span>
            </button>

            <button
              onClick={() => setViewMode('repetition_random')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'repetition_random'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Dices className="w-3.5 h-3.5 text-teal-400" />
              <span>2. قائمة التكرار العشوائية ({isRepetitionListGenerated ? repetitionQueue.length : eligibleRepetitionCandidates.length})</span>
            </button>

            <button
              onClick={() => setViewMode('completed_today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'completed_today'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>المنجزون اليوم ({completedTodayList.length})</span>
            </button>
          </div>

          {/* Presence Filter Toggle */}
          <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => setOnlyPresentFilter(!onlyPresentFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                onlyPresentFilter
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{onlyPresentFilter ? 'الحاضرون فقط (مفعّل تلقائياً)' : 'عرض كافة الطلاب'}</span>
            </button>
          </div>

        </div>

        {/* Search & Group Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="تصفية بالاسم، المعرف الوحيد (ID)، أو الحزب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="ALL">كافة الأفواج</option>
              {groups.map((grp) => (
                <option key={grp} value={grp}>{grp}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* 3. DUAL VIEW: BOTH LISTS SIDE BY SIDE */}
      {viewMode === 'dual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* COLUMN 1: LISTE 1 - قائمة التلاوة (التسميع القرآني) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>1. قائمة التلاوة (التسميع القرآني)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      ترتيب دور المعرف الوحيد
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    الحاضرون الذين لم يسمّعوا في الحصة السابقة أولاً ({recitationQueue.length} طالب)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRestartRecitation}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-emerald-950/80 hover:border-emerald-500/50 border border-slate-700/80 text-slate-300 hover:text-emerald-300 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                title="إعادة البدء من الأول وبدء دورة تلاوة جديدة"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>إعادة البدء من الأول</span>
              </button>
            </div>

            {/* List for Recitation */}
            <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1 scrollbar-thin">
              {recitationQueue.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800/80 p-5 space-y-3">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto" />
                  <div>
                    <span className="font-bold text-slate-200 block text-sm">اكتمل تسجيل قائمة التلاوة لجميع الحاضرين اليوم!</span>
                    <p className="text-slate-400 text-[11px] mt-1">
                      يمكنك الآن الانتقال إلى قائمة التكرار بالقرعة العشوائية، أو إعادة بدء دورة تلاوة جديدة من الأول.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestartRecitation}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بدء دورة تلاوة جديدة من الأول</span>
                  </button>
                </div>
              ) : (
                recitationQueue.map((item, idx) => {
                  const isSelected = item.recitationStatus === 'SELECTED';
                  return (
                    <div
                      key={item.student.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-amber-950/40 border-amber-500/60 shadow-md ring-1 ring-amber-400/40' 
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Turn Number & Student Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 text-xs truncate">
                              {item.student.lastName} {item.student.firstName}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30 shrink-0">
                              {item.student.id}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                            <span>{item.student.group || 'فوج الستين'}</span>
                            <span>•</span>
                            {item.recitedInPreviousSession ? (
                              <span className="text-slate-400">سمّع بالحصة السابقة</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">لم يسمّع بالحصة السابقة</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Recitation Action Button (2-Step) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onCycleRecitation(item.recordId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse shadow-md'
                              : 'bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-emerald-300'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'تأكيد التلاوة ✓' : 'تلاوة'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* COLUMN 2: LISTE 2 - قائمة التكرار (المشاركة الشفوية) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                  <Dices className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>2. قائمة التكرار (المشاركة الشفوية)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                      قرعة عشوائية بالزر
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    لم يشاركوا في تلاوة اليوم ولم يسبق لهم التكرار ({isRepetitionListGenerated ? repetitionQueue.length : eligibleRepetitionCandidates.length} مؤهل)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isRepetitionListGenerated && (
                  <button
                    type="button"
                    onClick={handleReshuffleRepetitionList}
                    disabled={isRolling}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    title="إعادة إجراء القرعة العشوائية"
                  >
                    <Shuffle className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                    <span className="text-[10px]">إعادة الخلط</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRestartRepetition}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-teal-950/80 hover:border-teal-500/50 border border-slate-700/80 text-slate-300 hover:text-teal-300 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="إعادة تعيين القائمة وإجراء سحب قرعة جديدة من البداية"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                  <span>إعادة القرعة من الأول</span>
                </button>
              </div>
            </div>

            {/* If Not Generated Yet: Big Call-To-Action Button */}
            {!isRepetitionListGenerated ? (
              <div className="py-10 px-4 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 text-center space-y-4 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <Dices className="w-6 h-6" />
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    توليد قائمة التكرار بالقرعة العشوائية
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    يتم استبعاد من شارك في تلاوة اليوم ومن سبق له التكرار، وتوليد قرعة عادلة بين المرشحين المؤهلين الحاضرين.
                  </p>
                </div>

                {/* Status Notice about Recitation Queue */}
                {recitationQueue.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>تنبيه: متبقي {recitationQueue.length} طلاب في قائمة التلاوة</span>
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={handleGenerateRepetitionList}
                    disabled={isRolling}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-950/50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
                    <span>توليد قائمة التكرار العشوائية الآن ({eligibleRepetitionCandidates.length || studentDataList.length} مرشح)</span>
                  </button>
                </div>

                {eligibleRepetitionCandidates.length === 0 && (
                  <p className="text-[11px] text-rose-400">
                    لا يوجد مرشحون مؤهلون حالياً (إما شاركوا بالتلاوة اليوم أو أتموا التكرار سابقاً).
                  </p>
                )}
              </div>
            ) : (
              /* Generated Repetition List */
              <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1 scrollbar-thin">
                {repetitionQueue.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800/80 p-5 space-y-3">
                    <Award className="w-9 h-9 text-teal-400 mx-auto" />
                    <div>
                      <span className="font-bold text-slate-200 block text-sm">تم استيفاء جميع مشاركات قائمة التكرار لهذا اليوم بنجاح!</span>
                      <p className="text-slate-400 text-[11px] mt-1">
                        يمكنك إعادة تعيين القائمة وإجراء سحب قرعة جديدة من البداية في أي وقت.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRestartRepetition}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>بدء سحب قرعة جديدة من البداية</span>
                    </button>
                  </div>
                ) : (
                  repetitionQueue.map((item, idx) => {
                    const isSelected = item.oralStatus === 'SELECTED';
                    return (
                      <div
                        key={item.student.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected 
                            ? 'bg-teal-950/40 border-teal-500/60 shadow-md ring-1 ring-teal-400/40' 
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Left: Random Draw Number & Info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-teal-950/80 text-teal-300 border border-teal-500/30 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-100 text-xs truncate">
                                {item.student.lastName} {item.student.firstName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({item.student.id})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                              <span className="text-teal-400 font-medium">{item.student.group || 'فوج الستين'}</span>
                              <span>•</span>
                              <span>تكرار سابق: {item.totalPastOrals}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Oral Action Button (2-Step) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onCycleOral(item.recordId)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-teal-500 text-slate-950 ring-2 ring-teal-300 animate-pulse shadow-md'
                                : 'bg-slate-800 hover:bg-teal-600 hover:text-white border border-slate-700 text-teal-300'
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>{isSelected ? 'تأكيد التكرار ✓' : 'تكرار'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* 4. FULL VIEW: RECITATION ONLY (ORDERED BY UNIQUE ID) */}
      {viewMode === 'recitation_ordered' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <span>قائمة التلاوة الكاملة (التسميع القرآني)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    مرتبة تصاعدياً بالمعرف الوحيد (ID)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  أولوية التناوب للطلاب الحاضرين الذين لم يسمّعوا في الحصة السابقة ثم حسب تسلسل المعرف الوحيد
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                المتبقي: {recitationQueue.length} طالب
              </div>
              <button
                type="button"
                onClick={handleRestartRecitation}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950/80 hover:border-emerald-500/50 border border-slate-700 text-slate-300 hover:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="إعادة البدء من الأول وبدء دورة تلاوة جديدة"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>إعادة البدء من الأول</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recitationQueue.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-slate-950/50 rounded-2xl border border-slate-800 p-6 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-slate-200 text-sm">لا يوجد طلاب متبقين في قائمة التلاوة لهذا اليوم</h4>
                <p className="text-slate-400 text-xs">تم تسجيل دور جميع الحاضرين بنجاح. يمكنك إعادة تشغيل الدورة من الأول في أي وقت.</p>
                <button
                  type="button"
                  onClick={handleRestartRecitation}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>بدء دورة تلاوة جديدة من الأول</span>
                </button>
              </div>
            ) : (
              recitationQueue.map((item, idx) => {
                const isSelected = item.recitationStatus === 'SELECTED';
                return (
                  <div
                    key={item.student.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isSelected 
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-lg ring-2 ring-amber-400/40' 
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs font-mono">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 text-xs">
                            {item.student.lastName} {item.student.firstName}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">
                            المعرف الوحيد: {item.student.id}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                        {item.student.group || 'فوج الستين'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className={`text-[10px] ${item.recitedInPreviousSession ? 'text-slate-400' : 'text-emerald-400 font-bold'}`}>
                        {item.recitedInPreviousSession ? 'سمّع بالحصة السابقة' : 'لم يسمّع بالحصة السابقة'}
                      </span>

                      <button
                        type="button"
                        onClick={() => onCycleRecitation(item.recordId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                            : 'bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-emerald-300'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'تأكيد التلاوة ✓' : 'تسجيل تلاوة'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* 5. FULL VIEW: REPETITION ONLY (RANDOM DRAW) */}
      {viewMode === 'repetition_random' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-sm">
                <Dices className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <span>قائمة التكرار العشوائية بالقرعة (Tirage Aléatoire)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    توليد عشوائي بالزر
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  للطلاب الحاضرين الذين لم يشاركوا في تلاوة اليوم ولم يسبق لهم التكرار
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isRepetitionListGenerated ? (
                <button
                  type="button"
                  onClick={handleGenerateRepetitionList}
                  disabled={isRolling}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
                  <span>توليد القائمة الآن ({eligibleRepetitionCandidates.length || studentDataList.length} مرشح)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReshuffleRepetitionList}
                    disabled={isRolling}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shuffle className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                    <span>إعادة خلط القرعة العشوائية</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestartRepetition}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-teal-950/80 hover:border-teal-500/50 border border-slate-700 text-slate-300 hover:text-teal-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="إعادة تعيين القائمة والبدء من جديد"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                    <span>إعادة القرعة من الأول</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {!isRepetitionListGenerated ? (
            <div className="py-16 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
              <Dices className="w-10 h-10 text-teal-400/50 mx-auto" />
              <div className="font-bold text-slate-200 text-sm">
                القائمة جاهزة للتوليد
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                يوجد حالياً {eligibleRepetitionCandidates.length} مرشحاً مؤهلاً مستوفين للشروط (حاضرون، لم يشاركوا في تلاوة اليوم، ولم يسبق لهم التكرار).
              </p>
              <button
                type="button"
                onClick={handleGenerateRepetitionList}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg"
              >
                توليد قائمة التكرار العشوائية
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {repetitionQueue.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-slate-950/50 rounded-2xl border border-slate-800 p-6 space-y-3">
                  <Award className="w-10 h-10 text-teal-400 mx-auto" />
                  <h4 className="font-bold text-slate-200 text-sm">لا يوجد طلاب متبقين في قائمة التكرار</h4>
                  <p className="text-slate-400 text-xs">تم استيفاء جميع مشاركات التكرار لهذا اليوم بنجاح.</p>
                  <button
                    type="button"
                    onClick={handleRestartRepetition}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>بدء سحب قرعة جديدة من البداية</span>
                  </button>
                </div>
              ) : (
                repetitionQueue.map((item, idx) => {
                  const isSelected = item.oralStatus === 'SELECTED';
                  return (
                    <div
                      key={item.student.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isSelected 
                          ? 'bg-teal-950/30 border-teal-500/50 shadow-lg ring-2 ring-teal-400/40' 
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-950 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold text-xs font-mono">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 text-xs">
                              {item.student.lastName} {item.student.firstName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              المعرف الوحيد: {item.student.id}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-500/30">
                          {item.student.group || 'فوج الستين'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-400">
                          تكرار سابق: {item.totalPastOrals}
                        </span>

                        <button
                          type="button"
                          onClick={() => onCycleOral(item.recordId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-teal-500 text-slate-950 ring-2 ring-teal-300 animate-pulse'
                              : 'bg-slate-800 hover:bg-teal-600 hover:text-white border border-slate-700 text-teal-300'
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'تأكيد التكرار ✓' : 'تسجيل التكرار'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      )}

      {/* 6. FULL VIEW: COMPLETED TODAY */}
      {viewMode === 'completed_today' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100">
                  الطلاب الذين أنجزوا التلاوة أو التكرار في هذه الحصة
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  سجل الإنجاز المباشر للحلقة النشطة ({completedTodayList.length} طالب)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {completedTodayList.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                لم يتم إتمام أي تلاوة أو تكرار في هذه الحلقة بعد
              </div>
            ) : (
              completedTodayList.map((item) => (
                <div
                  key={item.student.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-xs">
                        {item.student.lastName} {item.student.firstName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        المعرف الوحيد: {item.student.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {item.recitationStatus === 'CONFIRMED' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        تمت التلاوة ✓
                      </span>
                    )}
                    {item.oralStatus === 'CONFIRMED' && (
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                        تم التكرار ✓
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
};
