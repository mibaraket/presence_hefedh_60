import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  BookOpen, 
  Mic, 
  Check, 
  Clock, 
  FileSpreadsheet, 
  CheckCircle2, 
  UserX, 
  SlidersHorizontal,
  Edit3
} from 'lucide-react';
import { 
  Student, 
  Session, 
  AttendanceRecord, 
  AttendanceStatus, 
  ParticipationStatus,
  ColumnFilters, 
  normalizeParticipation 
} from '../types';

interface AttendanceTableTabProps {
  records: AttendanceRecord[];
  students: Student[];
  sessions: Session[];
  onUpdateStatus: (recordId: string, status: AttendanceStatus) => void;
  onCycleRecitation: (recordId: string) => void;
  onCycleOral: (recordId: string) => void;
  onUpdateNote: (recordId: string, note: string) => void;
  onExportExcel: () => void;
}

export const AttendanceTableTab: React.FC<AttendanceTableTabProps> = ({
  records = [],
  students = [],
  sessions = [],
  onUpdateStatus,
  onCycleRecitation,
  onCycleOral,
  onUpdateNote,
  onExportExcel
}) => {
  const [filters, setFilters] = useState<ColumnFilters>({
    studentName: '',
    sessionId: 'ALL',
    status: 'ALL',
    dateSaisie: '',
    minAttendanceRate: '',
    recitation: 'ALL',
    oralParticipation: 'ALL'
  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  const filteredRecords = useMemo(() => {
    return (records || []).filter((record) => {
      if (filters.studentName.trim()) {
        const query = filters.studentName.toLowerCase();
        const matchesName = record.studentName.toLowerCase().includes(query);
        const matchesId = record.studentId.toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }

      if (filters.sessionId !== 'ALL' && record.sessionId !== filters.sessionId) {
        return false;
      }

      if (filters.status !== 'ALL' && record.status !== filters.status) {
        return false;
      }

      if (filters.dateSaisie && !record.sessionDate.includes(filters.dateSaisie)) {
        return false;
      }

      if (filters.minAttendanceRate !== '' && record.attendanceRate < Number(filters.minAttendanceRate)) {
        return false;
      }

      const recStatus = normalizeParticipation(record.recitation);
      if (filters.recitation === 'CONFIRMED' && recStatus !== 'CONFIRMED') return false;
      if (filters.recitation === 'SELECTED' && recStatus !== 'SELECTED') return false;
      if (filters.recitation === 'NONE' && recStatus !== 'NONE') return false;

      const oralStatus = normalizeParticipation(record.oralParticipation);
      if (filters.oralParticipation === 'CONFIRMED' && oralStatus !== 'CONFIRMED') return false;
      if (filters.oralParticipation === 'SELECTED' && oralStatus !== 'SELECTED') return false;
      if (filters.oralParticipation === 'NONE' && oralStatus !== 'NONE') return false;

      return true;
    });
  }, [records, filters]);

  const resetFilters = () => {
    setFilters({
      studentName: '',
      sessionId: 'ALL',
      status: 'ALL',
      dateSaisie: '',
      minAttendanceRate: '',
      recitation: 'ALL',
      oralParticipation: 'ALL'
    });
  };

  const handleSaveNote = (recordId: string) => {
    onUpdateNote(recordId, tempNote.trim());
    setEditingNoteId(null);
  };

  const getStatusBadge = (recordId: string, status: AttendanceStatus) => {
    const isPresent = status === 'PRESENT';
    return (
      <button
        onClick={() => onUpdateStatus(recordId, isPresent ? 'ABSENT' : 'PRESENT')}
        title="انقر للتبديل بين حاضر وغائب"
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
          isPresent 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
            : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        <span>{isPresent ? 'حاضر' : 'غائب'}</span>
      </button>
    );
  };

  const getParticipationBadge = (val: ParticipationStatus | boolean | undefined, type: 'recitation' | 'oral') => {
    const norm = normalizeParticipation(val);
    if (norm === 'CONFIRMED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>{type === 'recitation' ? 'تمت التلاوة' : 'تم التكرار'}</span>
        </span>
      );
    }
    if (norm === 'SELECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{type === 'recitation' ? 'قيد التلاوة' : 'قيد التكرار'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
        <span>—</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200">تصفية وتصفح السجل العام</h3>
            <span className="text-[11px] text-slate-500">({filteredRecords.length} سجل)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">اسم الطالب أو المعرف</label>
            <input
              type="text"
              value={filters.studentName}
              onChange={(e) => setFilters({ ...filters, studentName: e.target.value })}
              placeholder="بحث بالاسم..."
              className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">الحلقة / الجلسة</label>
            <select
              value={filters.sessionId}
              onChange={(e) => setFilters({ ...filters, sessionId: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">كافة الحلقات</option>
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.title} ({sess.date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">حالة الحضور</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">كافة الحالات</option>
              <option value="PRESENT">حاضر</option>
              <option value="ABSENT">غائب</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">التلاوة</label>
            <select
              value={filters.recitation}
              onChange={(e) => setFilters({ ...filters, recitation: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">الكل</option>
              <option value="CONFIRMED">تمت التلاوة بنجاح</option>
              <option value="SELECTED">قيد التلاوة (مرشح)</option>
              <option value="NONE">لم يتلُ بعد</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main Records Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[180px]">اسم الطالب</th>
                <th className="py-3 px-3 min-w-[180px]">الحصة / التاريخ</th>
                <th className="py-3 px-3 min-w-[120px] text-center">حالة الحضور</th>
                <th className="py-3 px-3 min-w-[130px] text-center">التلاوة (نقر للتبديل)</th>
                <th className="py-3 px-3 min-w-[130px] text-center">تكرار (نقر للتبديل)</th>
                <th className="py-3 px-4 min-w-[180px]">ملاحظة</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    لا توجد سجلات مطابقة لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, idx) => {
                  return (
                    <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 leading-tight">
                          {record.studentName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {record.studentId}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200 text-[11px] leading-tight">
                          {record.sessionTitle}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          {record.sessionDate}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(record.id, record.status)}
                      </td>

                      {/* Recitation */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onCycleRecitation(record.id)}
                          className="cursor-pointer transition-transform active:scale-95"
                          title="نقر أول: ترشيح • نقر ثانٍ: تأكيد"
                        >
                          {getParticipationBadge(record.recitation, 'recitation')}
                        </button>
                      </td>

                      {/* Oral Participation */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onCycleOral(record.id)}
                          className="cursor-pointer transition-transform active:scale-95"
                          title="نقر أول: ترشيح • نقر ثانٍ: تأكيد"
                        >
                          {getParticipationBadge(record.oralParticipation, 'oral')}
                        </button>
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4">
                        {editingNoteId === record.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              placeholder="أدخل الملاحظة..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNote(record.id);
                                if (e.key === 'Escape') setEditingNoteId(null);
                              }}
                              className="w-full px-2.5 py-1 bg-slate-950 border border-emerald-500 rounded-lg text-xs text-slate-100 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveNote(record.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold"
                            >
                              حفظ
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNoteId(record.id);
                              setTempNote(record.notes || '');
                            }}
                            className="w-full text-right flex items-center justify-between gap-1.5 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors group"
                          >
                            <span className="truncate text-[11px] text-slate-300">
                              {record.notes || <span className="text-slate-600 font-normal italic">إضافة ملاحظة...</span>}
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
