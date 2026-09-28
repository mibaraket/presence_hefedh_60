import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  BookOpen, 
  Phone, 
  Mail,
  FileText,
  Sparkles
} from 'lucide-react';
import { Student } from '../types';
import { exportStudentsToExcel, downloadStudentsTemplate, parseStudentsExcel } from '../utils/excel';

interface StudentsRosterTabProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onImportStudents: (newStudents: Student[]) => void;
  onOpenReportModal?: () => void;
  onExportExcel?: () => void;
}

export const StudentsRosterTab: React.FC<StudentsRosterTabProps> = ({
  students = [],
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onImportStudents,
  onOpenReportModal,
  onExportExcel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formGroup, setFormGroup] = useState('فوج الإمام نافع (رواية قالون)');
  const [formHizb, setFormHizb] = useState('الحزب 1');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  // Groups list
  const groups = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.group) set.add(s.group);
    });
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !query ||
        `${student.lastName} ${student.firstName}`.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query) ||
        (student.hizbProgress || '').toLowerCase().includes(query);
      
      const matchesGroup = selectedGroup === 'ALL' || student.group === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [students, searchQuery, selectedGroup]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormId(`QS-${String(students.length + 1).padStart(2, '0')}`);
    setFormLastName('');
    setFormFirstName('');
    setFormGroup('فوج الإمام نافع (رواية قالون)');
    setFormHizb('الحزب 1');
    setFormPhone('');
    setFormEmail('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (st: Student) => {
    setEditingStudent(st);
    setFormId(st.id);
    setFormLastName(st.lastName);
    setFormFirstName(st.firstName);
    setFormGroup(st.group || 'فوج الإمام نافع (رواية قالون)');
    setFormHizb(st.hizbProgress || 'الحزب 1');
    setFormPhone(st.phone || '');
    setFormEmail(st.email || '');
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLastName.trim() || !formFirstName.trim()) return;

    const avatarColors = [
      'bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 
      'bg-teal-600', 'bg-amber-600', 'bg-rose-600', 
      'bg-cyan-600', 'bg-orange-600', 'bg-emerald-700'
    ];
    const colorIndex = Math.abs(formId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % avatarColors.length;

    const studentData: Student = {
      id: formId.trim().toUpperCase(),
      lastName: formLastName.trim(),
      firstName: formFirstName.trim(),
      group: formGroup.trim(),
      hizbProgress: formHizb.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      avatarColor: editingStudent?.avatarColor || avatarColors[colorIndex]
    };

    if (editingStudent) {
      onUpdateStudent(studentData);
    } else {
      onAddStudent(studentData);
    }

    setIsAddModalOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseStudentsExcel(file);
      if (parsed.length > 0) {
        onImportStudents(parsed);
      }
    } catch (err) {
      console.error('Error importing excel:', err);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Export & Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* 1. Monthly Report PDF */}
        {onOpenReportModal && (
          <button
            type="button"
            onClick={onOpenReportModal}
            className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 flex flex-col items-center justify-center text-center gap-2 group transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:bg-rose-500/20 group-hover:scale-105 transition-all">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-xs group-hover:text-rose-300">تقرير شهري (PDF)</div>
              <div className="text-[10px] text-slate-400 mt-0.5">طباعة وإحصائيات الحضور</div>
            </div>
          </button>
        )}

        {/* 2. Monthly Excel Export */}
        {onExportExcel && (
          <button
            type="button"
            onClick={onExportExcel}
            className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center text-center gap-2 group transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-xs group-hover:text-emerald-300">تصدير شهري (Excel)</div>
              <div className="text-[10px] text-slate-400 mt-0.5">جدول إكسيل تفصيلي شامل</div>
            </div>
          </button>
        )}

        {/* 3. Import Excel */}
        <label className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 flex flex-col items-center justify-center text-center gap-2 group transition-all cursor-pointer shadow-sm active:scale-98">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:bg-teal-500/20 group-hover:scale-105 transition-all">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-xs group-hover:text-teal-300">استيراد طلاب (Excel)</div>
            <div className="text-[10px] text-slate-400 mt-0.5">إدراج قوائم جماعية</div>
          </div>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* 4. Template Download */}
        <button
          type="button"
          onClick={downloadStudentsTemplate}
          className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 flex flex-col items-center justify-center text-center gap-2 group transition-all cursor-pointer shadow-sm active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:bg-sky-500/20 group-hover:scale-105 transition-all">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-xs group-hover:text-sky-300">قالب Excel فارغ</div>
            <div className="text-[10px] text-slate-400 mt-0.5">نموذج تعبئة للطلاب</div>
          </div>
        </button>

        {/* 5. Add New Student */}
        <button
          type="button"
          onClick={openAddModal}
          className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-500/40 text-white flex flex-col items-center justify-center text-center gap-2 group transition-all cursor-pointer shadow-lg shadow-emerald-950/50 active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center group-hover:scale-105 transition-all">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-xs">إضافة طالب جديد</div>
            <div className="text-[10px] text-emerald-100 mt-0.5">تسجيل يدوي فوري</div>
          </div>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث في قائمة الحفاظ بالاسم أو المعرف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full sm:w-auto bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
          >
            <option value="ALL">كافة الأفواج والحلقات ({students.length})</option>
            {groups.map((grp) => (
              <option key={grp} value={grp}>{grp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                <th className="py-3 px-3 text-center min-w-[100px] w-28">المعرف الوحيد (ID)</th>
                <th className="py-3 px-4 min-w-[200px]">اسم ولقب الطالب</th>
                <th className="py-3 px-3 min-w-[180px]">الفوج / الحلقة</th>
                <th className="py-3 px-3 min-w-[140px]">الهاتف والبريد</th>
                <th className="py-3 px-4 w-24 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    لا يوجد طلاب مطابقين للبحث
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Unique ID as First Column */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block font-mono font-bold text-xs text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                        #{st.id}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 text-xs sm:text-sm">
                        {st.lastName} {st.firstName}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {st.group || '—'}
                    </td>

                    <td className="py-3 px-3 text-slate-400 text-[11px] space-y-0.5">
                      {st.phone && <div>{st.phone}</div>}
                      {st.email && <div className="text-slate-500">{st.email}</div>}
                      {!st.phone && !st.email && <div>—</div>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(st)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="تعديل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف الطالب ${st.lastName} ${st.firstName}؟`)) {
                              onDeleteStudent(st.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد في حلقة الستين'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">المعرف الوحيد *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="00871"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">مستوى الحفظ *</label>
                  <input
                    type="text"
                    required
                    value={formHizb}
                    onChange={(e) => setFormHizb(e.target.value)}
                    placeholder="الحزب 30"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">اللقب *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    placeholder="المنصوري"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">الاسم *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    placeholder="محمد ياسين"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">الفوج / الحلقة</label>
                <input
                  type="text"
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  placeholder="فوج الإمام نافع (رواية قالون)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="student@quran.org"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  {editingStudent ? 'تحديث البيانات' : 'حفظ الطالب'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
