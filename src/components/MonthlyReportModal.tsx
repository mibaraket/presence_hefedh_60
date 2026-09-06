import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Mic, 
  Calendar,
  Building2,
  Printer
} from 'lucide-react';
import { Student, Session, AttendanceRecord } from '../types';
import { computeMonthlyStats, generateMonthlyAttendancePDF } from '../utils/pdfReport';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  sessions: Session[];
  records: AttendanceRecord[];
  institutionName: string;
  onUpdateInstitutionName: (name: string) => void;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  students = [],
  sessions = [],
  records = [],
  institutionName,
  onUpdateInstitutionName
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [institution, setInstitution] = useState(institutionName || 'مجموعة حفظ الستين - مدرسة الإمام نافع لتحفيظ القرآن الكريم');

  const months = [
    { value: 0, label: 'جانفي / محرم' },
    { value: 1, label: 'فيفري / صفر' },
    { value: 2, label: 'مارس / ربيع الأول' },
    { value: 3, label: 'أفريل / ربيع الثاني' },
    { value: 4, label: 'ماي / جمادى الأولى' },
    { value: 5, label: 'جوان / جمادى الآخرة' },
    { value: 6, label: 'جويلية / رجب' },
    { value: 7, label: 'أوت / شعبان' },
    { value: 8, label: 'سبتمبر / رمضان' },
    { value: 9, label: 'أكتوبر / شوال' },
    { value: 10, label: 'نوفمبر / ذو القعدة' },
    { value: 11, label: 'ديسمبر / ذو الحجة' }
  ];

  const reportData = useMemo(() => {
    return computeMonthlyStats(selectedMonth, selectedYear, students, sessions, records);
  }, [selectedMonth, selectedYear, students, sessions, records]);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      if (institution !== institutionName) {
        onUpdateInstitutionName(institution);
      }
      await generateMonthlyAttendancePDF(reportData, institution || 'مجموعة حفظ الستين - مدرسة التحفيظ');
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="bg-slate-950/50 p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                التقرير الشهري لمواظبة وتسميع حفاظ الستين (PDF)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>الشهر المعني</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full text-xs font-medium bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                السنة الميلادية
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full text-xs font-medium bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>المؤسسة / المسجد</span>
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full text-xs font-medium bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Stat Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">عدد الحصص في الشهر</div>
              <div className="text-xl font-black text-slate-100 mt-0.5">{reportData.totalSessions}</div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">نسبة الحضور العامة</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{reportData.overallAttendanceRate}%</div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">إجمالي حصص التلاوة</div>
              <div className="text-xl font-black text-sky-400 mt-0.5">{reportData.totalRecitations}</div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">جلسات التكرار</div>
              <div className="text-xl font-black text-teal-400 mt-0.5">{reportData.totalOralParticipations}</div>
            </div>
          </div>

          {/* Detailed Students Stats Preview */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-2.5">اسم الطالب</th>
                    <th className="p-2.5">الفوج</th>
                    <th className="p-2.5 text-center">حاضر</th>
                    <th className="p-2.5 text-center">غائب</th>
                    <th className="p-2.5 text-center">التلاوة</th>
                    <th className="p-2.5 text-center">النسبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {reportData.studentStats.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-slate-100">{st.studentName}</td>
                      <td className="p-2.5 text-slate-400">{st.group}</td>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">{st.presentCount}</td>
                      <td className="p-2.5 text-center text-rose-400 font-bold">{st.absentCount}</td>
                      <td className="p-2.5 text-center text-sky-400 font-bold">{st.recitationCount}</td>
                      <td className="p-2.5 text-center font-bold text-slate-200">{st.monthlyRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-colors"
          >
            إغلاق
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <span>جاري توليد ملف PDF...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>تحميل واستخراج التقرير الرسمي (PDF)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
