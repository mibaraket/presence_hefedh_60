import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  BookOpen, 
  Calendar, 
  User, 
  Star, 
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Sparkles,
  Edit3,
  Clock
} from 'lucide-react';
import { Student, ExamRecord, ExamEntity } from '../types';
import { 
  calculateExamGrade, 
  getTodayDateStr, 
  DEFAULT_EXAM_CATEGORIES,
  DEFAULT_EXAM_ENTITIES 
} from '../utils/storage';

interface ExamsTabProps {
  students: Student[];
  exams: ExamRecord[];
  examEntities?: ExamEntity[];
  onAddExamEntity?: (entity: ExamEntity) => void;
  onDeleteExamEntity?: (entityId: string) => void;
  onSaveCandidateScore?: (record: ExamRecord) => void;
  onDeleteCandidateScore?: (recordId: string) => void;
  onAddExam: (exam: ExamRecord) => void;
  onDeleteExam: (examId: string) => void;
}

export const ExamsTab: React.FC<ExamsTabProps> = ({
  students = [],
  exams = [],
  examEntities = DEFAULT_EXAM_ENTITIES,
  onAddExamEntity,
  onDeleteExamEntity,
  onSaveCandidateScore,
  onDeleteCandidateScore,
  onAddExam,
  onDeleteExam
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ensure active exam definitions
  const activeExams = useMemo(() => {
    if (examEntities && examEntities.length > 0) return examEntities;
    return DEFAULT_EXAM_ENTITIES;
  }, [examEntities]);

  // Selected exam dropdown state
  const [selectedExamId, setSelectedExamId] = useState<string>(() => activeExams[0]?.id || '');

  // Keep selectedExamId valid if activeExams changes
  const selectedExam = useMemo(() => {
    const found = activeExams.find(e => e.id === selectedExamId);
    return found || activeExams[0] || null;
  }, [activeExams, selectedExamId]);

  // Modal states
  const [isNewExamModalOpen, setIsNewExamModalOpen] = useState(false);
  const [selectedCandidateToGrade, setSelectedCandidateToGrade] = useState<{
    exam: ExamEntity;
    student: Student;
    existingRecord?: ExamRecord;
  } | null>(null);

  // Form State: Add New Exam Entity
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCategory, setNewExamCategory] = useState(DEFAULT_EXAM_CATEGORIES[0] || 'حفظ الأجزاء والأحزاب');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [newExamPortion, setNewExamPortion] = useState('الجزء الأول (سورة الفاتحة والبقرة 1-141)');
  const [newExamDate, setNewExamDate] = useState(getTodayDateStr());
  const [newExamExaminer, setNewExamExaminer] = useState('الشيخ مراد الجدلي');
  const [newExamTargetGroup, setNewExamTargetGroup] = useState('ALL');
  const [newHifzMax, setNewHifzMax] = useState<number>(40);
  const [newTilawaMax, setNewTilawaMax] = useState<number>(30);
  const [newTajweedMax, setNewTajweedMax] = useState<number>(30);
  const [newExamDescription, setNewExamDescription] = useState('');

  // Form State: Grading Modal
  const [gradeHifz, setGradeHifz] = useState<number>(38);
  const [gradeTilawa, setGradeTilawa] = useState<number>(28);
  const [gradeTajweed, setGradeTajweed] = useState<number>(29);

  // Open grading modal for candidate
  const handleOpenGradingModal = (exam: ExamEntity, student: Student, existingRecord?: ExamRecord) => {
    setSelectedCandidateToGrade({ exam, student, existingRecord });
    if (existingRecord) {
      setGradeHifz(existingRecord.breakdown.hifzScore);
      setGradeTilawa(existingRecord.breakdown.tilawaScore);
      setGradeTajweed(existingRecord.breakdown.tajweedScore);
    } else {
      setGradeHifz(Math.round(exam.hifzMax * 0.9));
      setGradeTilawa(Math.round(exam.tilawaMax * 0.9));
      setGradeTajweed(Math.round(exam.tajweedMax * 0.9));
    }
  };

  // Submit candidate grade
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateToGrade) return;

    const { exam, student, existingRecord } = selectedCandidateToGrade;
    const hifz = Math.min(exam.hifzMax, Math.max(0, Number(gradeHifz)));
    const tilawa = Math.min(exam.tilawaMax, Math.max(0, Number(gradeTilawa)));
    const tajweed = Math.min(exam.tajweedMax, Math.max(0, Number(gradeTajweed)));

    const totalScore = hifz + tilawa + tajweed;
    const totalMax = exam.totalMax || (exam.hifzMax + exam.tilawaMax + exam.tajweedMax);
    const grade = calculateExamGrade(totalScore, totalMax);

    const recordToSave: ExamRecord = {
      id: existingRecord?.id || `exam-rec-${Date.now()}-${student.id}`,
      examId: exam.id,
      studentId: student.id,
      studentName: `${student.lastName} ${student.firstName}`,
      group: student.group,
      examDate: exam.examDate,
      category: exam.category,
      juzOrPortion: exam.juzOrPortion,
      examinerName: exam.examinerName,
      breakdown: {
        hifzScore: hifz,
        hifzMax: exam.hifzMax,
        tilawaScore: tilawa,
        tilawaMax: exam.tilawaMax,
        tajweedScore: tajweed,
        tajweedMax: exam.tajweedMax
      },
      totalScore,
      totalMax,
      grade
    };

    if (onSaveCandidateScore) {
      onSaveCandidateScore(recordToSave);
    } else {
      onAddExam(recordToSave);
    }

    setSelectedCandidateToGrade(null);
  };

  // Delete candidate grade
  const handleDeleteGrade = (recordId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدرجة المرصودة للطالب؟')) {
      if (onDeleteCandidateScore) {
        onDeleteCandidateScore(recordId);
      } else {
        onDeleteExam(recordId);
      }
      setSelectedCandidateToGrade(null);
    }
  };

  // Handle submit create new exam
  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;

    const category = isCustomCategory ? customCategoryName.trim() : newExamCategory;
    if (!category) return;

    const totalMax = Number(newHifzMax) + Number(newTilawaMax) + Number(newTajweedMax);
    const newEntity: ExamEntity = {
      id: `exam-ent-${Date.now()}`,
      title: newExamTitle.trim(),
      category,
      examDate: newExamDate,
      juzOrPortion: newExamPortion.trim(),
      examinerName: newExamExaminer.trim(),
      targetGroup: newExamTargetGroup,
      hifzMax: Number(newHifzMax),
      tilawaMax: Number(newTilawaMax),
      tajweedMax: Number(newTajweedMax),
      totalMax,
      description: newExamDescription.trim()
    };

    if (onAddExamEntity) {
      onAddExamEntity(newEntity);
    }

    setSelectedExamId(newEntity.id);

    // Reset form
    setNewExamTitle('');
    setNewExamDescription('');
    setIsCustomCategory(false);
    setCustomCategoryName('');
    setIsNewExamModalOpen(false);
  };

  // Candidates list for selected exam
  const examCandidates = useMemo(() => {
    if (!selectedExam) return [];
    let eligibleStudents = students;
    if (selectedExam.targetGroup && selectedExam.targetGroup !== 'ALL') {
      eligibleStudents = students.filter(s => s.group === selectedExam.targetGroup);
    }

    // Sort naturally by numerical ID
    eligibleStudents = [...eligibleStudents].sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.id.localeCompare(b.id);
    });

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      eligibleStudents = eligibleStudents.filter(st => 
        (st.lastName + ' ' + st.firstName).toLowerCase().includes(query) ||
        st.id.toLowerCase().includes(query) ||
        (st.group || '').toLowerCase().includes(query)
      );
    }

    return eligibleStudents.map(student => {
      const record = exams.find(ex => 
        (ex.examId === selectedExam.id && ex.studentId === student.id) ||
        (!ex.examId && ex.studentId === student.id && ex.juzOrPortion === selectedExam.juzOrPortion)
      );
      return {
        student,
        record,
        isGraded: !!record
      };
    });
  }, [selectedExam, students, exams, searchQuery]);

  // Badge for grades
  const getGradeBadge = (grade: string | undefined) => {
    if (!grade) return null;
    if (grade.includes('ممتاز')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
          <span>{grade}</span>
        </span>
      );
    }
    if (grade.includes('جيد جداً')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
          <span>{grade}</span>
        </span>
      );
    }
    if (grade.includes('جيد')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span>{grade}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
        <span>{grade}</span>
      </span>
    );
  };

  const distinctGroups = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.group) set.add(s.group);
    });
    return Array.from(set);
  }, [students]);

  return (
    <div className="space-y-4">
      
      {/* 1. TOP HEADER & EXAM DROPDOWN SELECTOR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>منظومة الاختبارات والتقييمات القرآنية</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              اختر الامتحان من القائمة لعرض قائمة المرشحين ورصد الدرجات (الحفظ، التلاوة، التجويد، والمجموع)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewExamModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة امتحان قرآني جديد</span>
          </button>
        </div>

        {/* Dropdown for Exam Selection */}
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            اختر الامتحان المطلوب:
          </label>
          <div className="relative">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner"
            >
              {activeExams.length === 0 ? (
                <option value="">لا توجد امتحانات متاحة</option>
              ) : (
                activeExams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} — {ex.juzOrPortion} ({ex.examDate})
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search filter for candidates */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن طالب بالاسم أو المعرف الوحيد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

      </div>

      {/* 2. SELECTED EXAM DETAILS & CANDIDATES TABLE */}
      {selectedExam ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          
          {/* Exam Header Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {selectedExam.category}
                </span>
                <h3 className="font-black text-slate-100 text-base md:text-lg">
                  {selectedExam.title}
                </h3>
                {selectedExam.targetGroup && selectedExam.targetGroup !== 'ALL' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    الحلقة: {selectedExam.targetGroup}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200 font-medium">{selectedExam.juzOrPortion}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{selectedExam.examDate}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>المحكم: <strong className="text-emerald-400">{selectedExam.examinerName}</strong></span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
                المقيّمون: <strong className="text-emerald-400 font-black">{examCandidates.filter(c => c.isGraded).length}</strong> / {examCandidates.length}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`هل أنت متأكد من حذف امتحان: "${selectedExam.title}"؟`)) {
                    if (onDeleteExamEntity) onDeleteExamEntity(selectedExam.id);
                  }
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 transition-all cursor-pointer"
                title="حذف هذا الامتحان"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Candidates List Table */}
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 bg-slate-950/60">
                  <th className="p-3">#</th>
                  <th className="p-3">Nom et Prénom (اسم ولقب الطالب)</th>
                  <th className="p-3 text-center">الحفظ (/{selectedExam.hifzMax})</th>
                  <th className="p-3 text-center">التلاوة (/{selectedExam.tilawaMax})</th>
                  <th className="p-3 text-center">التجويد (/{selectedExam.tajweedMax})</th>
                  <th className="p-3 text-center">المجموع (/{selectedExam.totalMax})</th>
                  <th className="p-3 text-center">المحكم</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {examCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      لا توجد نتائج مطابقة للبحث أو لا يوجد مرشحون مسجلون.
                    </td>
                  </tr>
                ) : (
                  examCandidates.map(({ student, record, isGraded }) => {
                    return (
                      <tr 
                        key={student.id}
                        onClick={() => handleOpenGradingModal(selectedExam, student, record)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="p-3 font-mono text-slate-400 font-bold whitespace-nowrap">
                          #{student.id}
                        </td>
                        <td className="p-3 font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                          <div className="flex items-center gap-2">
                            <span>{student.lastName} {student.firstName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {student.group}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-200">
                          {isGraded ? record?.breakdown.hifzScore : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-200">
                          {isGraded ? record?.breakdown.tilawaScore : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-200">
                          {isGraded ? record?.breakdown.tajweedScore : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-emerald-400">
                          {isGraded ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span>{record?.totalScore}</span>
                              {getGradeBadge(record?.grade)}
                            </div>
                          ) : (
                            <span className="text-amber-400/80 text-[11px] font-normal">في الانتظار</span>
                          )}
                        </td>
                        <td className="p-3 text-center text-slate-300">
                          {record?.examinerName || selectedExam.examinerName}
                        </td>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenGradingModal(selectedExam, student, record)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                              isGraded
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            }`}
                          >
                            {isGraded ? (
                              <>
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>رصد الدرجات</span>
                              </>
                            )}
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
      ) : (
        <div className="py-16 text-center text-slate-400 text-xs bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-3">
          <Award className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-200 text-sm">لا توجد اختبارات مضافة حالياً</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            قم بإنشاء امتحان قرآني جديد للبدء برصد الدرجات.
          </p>
          <button
            type="button"
            onClick={() => setIsNewExamModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء امتحان جديد</span>
          </button>
        </div>
      )}

      {/* 3. MODAL: ADD NEW EXAM */}
      {isNewExamModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white">إضافة امتحان قرآني جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewExamModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExamSubmit} className="space-y-4">
              
              {/* Exam Title */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  عنوان الامتحان (مثال: اختبار الجزء الثالث) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="عنوان الامتحان..."
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  فئة التصنيف *
                </label>
                <select
                  value={isCustomCategory ? 'CUSTOM' : newExamCategory}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      setNewExamCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {DEFAULT_EXAM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="CUSTOM">+ إضافة فئة مخصصة...</option>
                </select>

                {isCustomCategory && (
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسم الفئة الجديدة..."
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    className="w-full mt-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Portion / Juz */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  المقدار الممتحن (السور أو الأجزاء) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الجزء الثالث (سورة البقرة 253 إلى آل عمران 92)"
                  value={newExamPortion}
                  onChange={(e) => setNewExamPortion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Date & Examiner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    تاريخ الامتحان *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    اسم المحكم / الشيخ المشرف *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExamExaminer}
                    onChange={(e) => setNewExamExaminer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                  />
                </div>
              </div>

              {/* Target Group */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  الحلقة المستهدفة
                </label>
                <select
                  value={newExamTargetGroup}
                  onChange={(e) => setNewExamTargetGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                >
                  <option value="ALL">كافة الحلقات والطلاب</option>
                  {distinctGroups.map(g => (
                    <option key={g} value={g}>حلقة {g}</option>
                  ))}
                </select>
              </div>

              {/* Max Scores */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-emerald-400 block mb-1">الحفظ (Max)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newHifzMax}
                    onChange={(e) => setNewHifzMax(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-center font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-sky-400 block mb-1">التلاوة (Max)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newTilawaMax}
                    onChange={(e) => setNewTilawaMax(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-center font-bold text-sky-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-400 block mb-1">التجويد (Max)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newTajweedMax}
                    onChange={(e) => setNewTajweedMax(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-center font-bold text-amber-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  توجيهات أو وصف للامتحان
                </label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر لمحتوى الامتحان وضوابطه..."
                  value={newExamDescription}
                  onChange={(e) => setNewExamDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء الامتحان وإدراجه</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 4. MODAL: GRADING CANDIDATE */}
      {selectedCandidateToGrade && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-sm">
                  #{selectedCandidateToGrade.student.id}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedCandidateToGrade.student.lastName} {selectedCandidateToGrade.student.firstName}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedCandidateToGrade.exam.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidateToGrade(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>المقدار الممتحن:</span>
                  <span className="font-semibold text-slate-200">{selectedCandidateToGrade.exam.juzOrPortion}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>المحكم:</span>
                  <span className="font-semibold text-slate-200">{selectedCandidateToGrade.exam.examinerName}</span>
                </div>
              </div>

              <div className="space-y-3">
                
                {/* Hifz */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-400">
                      الحفظ (الحد الأقصى: {selectedCandidateToGrade.exam.hifzMax})
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-300">
                      {gradeHifz} / {selectedCandidateToGrade.exam.hifzMax}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={selectedCandidateToGrade.exam.hifzMax}
                    required
                    value={gradeHifz}
                    onChange={(e) => setGradeHifz(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                  />
                </div>

                {/* Tilawa */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-sky-400">
                      التلاوة (الحد الأقصى: {selectedCandidateToGrade.exam.tilawaMax})
                    </label>
                    <span className="font-mono text-xs font-bold text-sky-300">
                      {gradeTilawa} / {selectedCandidateToGrade.exam.tilawaMax}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={selectedCandidateToGrade.exam.tilawaMax}
                    required
                    value={gradeTilawa}
                    onChange={(e) => setGradeTilawa(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold font-mono text-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500 text-center"
                  />
                </div>

                {/* Tajweed */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-amber-400">
                      التجويد (الحد الأقصى: {selectedCandidateToGrade.exam.tajweedMax})
                    </label>
                    <span className="font-mono text-xs font-bold text-amber-300">
                      {gradeTajweed} / {selectedCandidateToGrade.exam.tajweedMax}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={selectedCandidateToGrade.exam.tajweedMax}
                    required
                    value={gradeTajweed}
                    onChange={(e) => setGradeTajweed(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold font-mono text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                  />
                </div>

              </div>

              {/* Total Calculation */}
              {(() => {
                const totalScore = Number(gradeHifz) + Number(gradeTilawa) + Number(gradeTajweed);
                const totalMax = selectedCandidateToGrade.exam.totalMax || 100;
                const percentage = Math.round((totalScore / totalMax) * 100);
                const calculatedGrade = calculateExamGrade(totalScore, totalMax);

                return (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-semibold">المجموع الكلي:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-emerald-400 font-mono">{totalScore}</span>
                        <span className="text-xs text-slate-500 font-mono">/ {totalMax} ({percentage}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">التقدير:</span>
                      <div>{getGradeBadge(calculatedGrade)}</div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {selectedCandidateToGrade.existingRecord ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteGrade(selectedCandidateToGrade.existingRecord!.id)}
                    className="px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCandidateToGrade(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ الدرجات</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
