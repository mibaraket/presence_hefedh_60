import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, Clock, BookOpen, MapPin, User, ChevronDown, Building2 } from 'lucide-react';
import { Session, TeacherEntity, Branch, UserRole } from '../types';
import { getTodayDateStr } from '../utils/storage';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (session: Session) => void;
  teacherDefaultName?: string;
  branchName?: string;
  branchId?: string;
  teachers?: TeacherEntity[];
  branches?: Branch[];
  userRole?: UserRole;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  onCreateSession,
  teacherDefaultName = 'الشيخ المقرئ',
  branchName = 'الفرع الرئيسي - المقر المركزي',
  branchId,
  teachers = [],
  branches = [],
  userRole
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayDateStr());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  
  // Selected Branch for Admin
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchId || branches[0]?.id || '');
  const [selectedBranchName, setSelectedBranchName] = useState<string>(branchName);

  const isAdmin = userRole === 'ADMIN';

  // Teachers selection
  const initialTeacher = (teachers.length > 0 ? teachers[0].name : teacherDefaultName);
  const [selectedTeacherOption, setSelectedTeacherOption] = useState<string>(initialTeacher);
  const [customTeacher, setCustomTeacher] = useState('');
  const isCustomTeacher = selectedTeacherOption === '__CUSTOM__';

  useEffect(() => {
    if (branchId) {
      setSelectedBranchId(branchId);
      setSelectedBranchName(branchName);
    } else if (branches.length > 0) {
      setSelectedBranchId(branches[0].id);
      setSelectedBranchName(branches[0].name);
    }
  }, [isOpen, branchId, branchName, branches]);

  const handleBranchChange = (newBId: string) => {
    setSelectedBranchId(newBId);
    const found = branches.find(b => b.id === newBId);
    if (found) {
      setSelectedBranchName(found.name);
    }
  };

  useEffect(() => {
    if (teachers.length > 0) {
      // Find teachers for selected branch if possible
      const branchTeachers = teachers.filter(t => !selectedBranchId || !t.branchId || t.branchId === selectedBranchId);
      const match = branchTeachers.find(t => t.name === teacherDefaultName);
      if (match) {
        setSelectedTeacherOption(match.name);
      } else if (branchTeachers.length > 0) {
        setSelectedTeacherOption(branchTeachers[0].name);
      } else {
        setSelectedTeacherOption(teachers[0].name);
      }
    } else {
      setSelectedTeacherOption(teacherDefaultName);
    }
  }, [isOpen, teachers, teacherDefaultName, selectedBranchId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const teacherFinalName = isCustomTeacher 
      ? (customTeacher.trim() || 'الشيخ المقرئ')
      : selectedTeacherOption;

    const finalBranchId = isAdmin ? selectedBranchId : branchId;
    const finalBranchName = isAdmin ? selectedBranchName : branchName;

    const newSession: Session = {
      id: `sess-${Date.now()}`,
      title: title.trim(),
      date,
      startTime,
      endTime,
      room: finalBranchName || 'قاعة التحفيظ',
      teacher: teacherFinalName,
      branchId: finalBranchId,
      branchName: finalBranchName,
      isClosed: false
    };

    onCreateSession(newSession);
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4 animate-fadeIn">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                إنشاء حلقة / جلسة تسميع جديدة
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAdmin ? 'تخصيص الفرع والمشرف للجلسة' : `فرع: ${branchName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>عنوان حلقة التسميع والورد *</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حلقة تثبيت سورة البقرة والأحزاب (1-10)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Branch Selection: Selectable for ADMIN, Fixed for others */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>الفرع / المقر المخصص للحلقة *</span>
            </label>
            {isAdmin && branches.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none pl-8"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <input
                type="text"
                value={selectedBranchName || branchName}
                readOnly
                disabled
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold cursor-not-allowed select-none truncate"
              />
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>تاريخ الحصة *</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>وقت البدء</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>وقت الانتهاء</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>المشرف / الشيخ *</span>
            </label>

            {teachers.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedTeacherOption}
                  onChange={(e) => setSelectedTeacherOption(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none pl-8"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.branchName ? `(${t.branchName})` : ''}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ إدخال اسم شيخ آخر...</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <input
                type="text"
                value={selectedTeacherOption}
                onChange={(e) => setSelectedTeacherOption(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
          </div>

          {/* Conditional input if custom teacher is selected */}
          {isCustomTeacher && (
            <div className="animate-fadeIn">
              <label className="text-[10px] text-slate-400 block mb-1">اسم الأستاذ / الشيخ الجديد:</label>
              <input
                type="text"
                required
                value={customTeacher}
                onChange={(e) => setCustomTeacher(e.target.value)}
                placeholder="اكتب اسم الشيخ المحفظ..."
                className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/50 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              إنشاء الحلقة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
