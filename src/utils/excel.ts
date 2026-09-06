import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Student, AttendanceRecord, Session, normalizeParticipation } from '../types';

/**
 * Parses an Excel or CSV file to extract students
 */
export async function parseStudentsExcel(file: File): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          throw new Error('ملف الإكسيل فارغ.');
        }

        const avatarColors = [
          'bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 
          'bg-teal-600', 'bg-amber-600', 'bg-rose-600', 
          'bg-cyan-600', 'bg-orange-600', 'bg-emerald-700'
        ];

        const parsedStudents: Student[] = rawRows.map((row, index) => {
          const normalized: Record<string, string> = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            normalized[cleanKey] = String(row[key] || '').trim();
          });

          const id = normalized['id'] || 
                     normalized['identifiant'] || 
                     normalized['code'] || 
                     normalized['matricule'] || 
                     normalized['المعرف الوحيد'] || 
                     normalized['المعرف الفريد'] || 
                     normalized['المعرف'] || 
                     normalized['رقم القيد'] ||
                     normalized['student_id'] ||
                     `87${index + 1}`;

          let lastName = normalized['nom'] || normalized['اللقب'] || normalized['lastname'] || normalized['last_name'] || '';
          let firstName = normalized['prenom'] || normalized['الاسم'] || normalized['firstname'] || normalized['first_name'] || '';

          if (!lastName && !firstName) {
            const fullName = normalized['nom et prenom'] || normalized['الاسم واللقب'] || normalized['الاسم الكامل'] || normalized['fullname'] || normalized['name'] || `طالب القرآن ${index + 1}`;
            const parts = fullName.split(' ');
            if (parts.length > 1) {
              lastName = parts[0];
              firstName = parts.slice(1).join(' ');
            } else {
              lastName = fullName;
              firstName = '';
            }
          }

          const group = normalized['groupe'] || normalized['الفوج'] || normalized['حلقة التحفيظ'] || normalized['classe'] || normalized['filiere'] || 'فوج حفظ الستين';
          const hizbProgress = normalized['الحفظ'] || normalized['الحزب'] || normalized['مستوى الحفظ'] || normalized['niveau'] || 'قيد المتابعة';
          const email = normalized['email'] || normalized['البريد'] || normalized['courriel'] || '';
          const phone = normalized['telephone'] || normalized['الهاتف'] || normalized['tel'] || '';

          const colorIndex = Math.abs(id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % avatarColors.length;

          return {
            id: id.toUpperCase(),
            lastName: lastName || 'طالب',
            firstName: firstName || '',
            group,
            hizbProgress,
            email,
            phone,
            avatarColor: avatarColors[colorIndex]
          };
        });

        resolve(parsedStudents);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('حدث خطأ أثناء قراءة ملف الإكسيل'));
      }
    };

    reader.onerror = () => reject(new Error('خطأ في تحميل وقراءة الملف'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates and downloads a standard Excel template for students import
 */
export function downloadStudentsTemplate() {
  const sampleData = [
    {
      'المعرف الوحيد': '871',
      'اللقب': 'المنصوري',
      'الاسم': 'محمد ياسين',
      'الفوج / الحلقة': 'فوج الإمام نافع (رواية قالون)',
      'مستوى الحفظ': 'الحزب 45',
      'رقم الهاتف': '0612345678',
      'البريد الإلكتروني': 'med.mansouri@quran.org'
    },
    {
      'المعرف الوحيد': '872',
      'اللقب': 'الطرابلسي',
      'الاسم': 'أحمد خليل',
      'الفوج / الحلقة': 'فوج الإمام عاصم (رواية حفص)',
      'مستوى الحفظ': 'الحزب 60 (خاتم)',
      'رقم الهاتف': '0698765432',
      'البريد الإلكتروني': 'ahmed.trabelsi@quran.org'
    },
    {
      'المعرف الوحيد': '873',
      'اللقب': 'الزايدي',
      'الاسم': 'يوسف عبد الرحمن',
      'الفوج / الحلقة': 'فوج الإمام نافع (رواية قالون)',
      'مستوى الحفظ': 'الحزب 30',
      'رقم الهاتف': '0622334455',
      'البريد الإلكتروني': 'youssef.zaidi@quran.org'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!views'] = [{ RTL: true }];
  
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 28 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قالب_طلاب_حفظ_الستين');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, 'نموذج_قائمة_طلاب_مجموعة_حفظ_الستين.xlsx');
}

/**
 * Exports current attendance database to a multi-tab rich Excel file
 */
export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  students: Student[],
  sessions: Session[],
  filename = 'سجل_حضور_وتسميع_مجموعة_حفظ_الستين.xlsx'
) {
  const workbook = XLSX.utils.book_new();

  const statusLabels: Record<string, string> = {
    'PRESENT': 'حاضر',
    'RETARD': 'متأخر',
    'ABSENT': 'غائب',
    'EXCUSE': 'معذور',
    'NOT_MARKED': 'غير مسجل'
  };

  const getParticipationLabel = (val: unknown, type: 'recitation' | 'oral') => {
    const norm = normalizeParticipation(val as any);
    if (norm === 'CONFIRMED') {
      return type === 'recitation' ? 'تمت التلاوة بنجاح ✓' : 'تكرار مؤكد ✓';
    }
    if (norm === 'SELECTED') {
      return type === 'recitation' ? 'قيد التلاوة (مرشح)' : 'تكرار مرشح';
    }
    return 'لم يسجل';
  };

  // Sheet 1: Detailed Register
  const detailedData = records.map((rec) => {
    const student = students.find((s) => s.id === rec.studentId);
    return {
      'المعرف الوحيد (ID)': rec.studentId,
      'اسم ولقب الطالب': rec.studentName,
      'حلقة التحفيظ / الفوج': student?.group || 'عام',
      'مستوى الحفظ': student?.hizbProgress || '—',
      'عنوان الحصة': rec.sessionTitle,
      'تاريخ الحصة': rec.sessionDate,
      'حالة الحضور': statusLabels[rec.status] || rec.status,
      'وقت تسجيل الحضور': rec.entryTimestamp || 'لم يتم التسجيل بعد',
      'نسبة الحضور التراكمية': `${rec.attendanceRate}%`,
      'التلاوة': getParticipationLabel(rec.recitation, 'recitation'),
      'تكرار': getParticipationLabel(rec.oralParticipation, 'oral'),
      'ملاحظة': rec.notes || ''
    };
  });

  const wsDetails = XLSX.utils.json_to_sheet(detailedData);
  wsDetails['!views'] = [{ RTL: true }];
  wsDetails['!cols'] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 30 },
    { wch: 18 },
    { wch: 38 },
    { wch: 16 },
    { wch: 20 },
    { wch: 24 },
    { wch: 22 },
    { wch: 24 },
    { wch: 26 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsDetails, 'سجل_الحضور_والتلاوة');

  // Sheet 2: Student Summary
  const studentSummaryData = students.map((s) => {
    const studentRecords = records.filter((r) => r.studentId === s.id);
    const totalSessions = studentRecords.length;
    const presents = studentRecords.filter((r) => r.status === 'PRESENT').length;
    const absents = studentRecords.filter((r) => r.status === 'ABSENT').length;
    const recitations = studentRecords.filter((r) => normalizeParticipation(r.recitation) === 'CONFIRMED').length;
    const orals = studentRecords.filter((r) => normalizeParticipation(r.oralParticipation) === 'CONFIRMED').length;
    const rate = totalSessions > 0 ? Math.round((presents / totalSessions) * 100) : 0;

    return {
      'المعرف الوحيد': s.id,
      'اللقب': s.lastName,
      'الاسم': s.firstName,
      'حلقة التحفيظ': s.group || 'عام',
      'مستوى الحفظ الحالي': s.hizbProgress || '—',
      'إجمالي الحصص': totalSessions,
      'عدد مرات الحضور': presents,
      'عدد مرات الغياب': absents,
      'نسبة الحضور العامة': `${rate}%`,
      'مجموع حصص التلاوة': recitations,
      'مجموع جلسات التكرار': orals,
      'رقم الهاتف': s.phone || '',
      'البريد الإلكتروني': s.email || ''
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(studentSummaryData);
  wsSummary['!views'] = [{ RTL: true }];
  wsSummary['!cols'] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'خلاصة_الطلاب');

  // Sheet 3: Sessions List
  const sessionsData = sessions.map((sess) => {
    const sessRecords = records.filter((r) => r.sessionId === sess.id);
    const presentCount = sessRecords.filter((r) => r.status === 'PRESENT').length;
    const totalSlots = sessRecords.length;
    const attendancePct = totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0;
    const recitationsCount = sessRecords.filter((r) => normalizeParticipation(r.recitation) === 'CONFIRMED').length;

    return {
      'معرف الحصة': sess.id,
      'عنوان الحصة': sess.title,
      'تاريخ الحصة': sess.date,
      'وقت الحصة': `${sess.startTime} - ${sess.endTime}`,
      'المقر / القاعة': sess.room || 'قاعة التحفيظ',
      'الشيخ المشرف': sess.teacher || '—',
      'حالة الحصة': sess.isClosed ? 'مكتملة ومختومة' : 'جارية',
      'عدد الحاضرين': `${presentCount} / ${totalSlots}`,
      'نسبة الحضور': `${attendancePct}%`,
      'عدد التسميعات': recitationsCount
    };
  });

  const wsSessions = XLSX.utils.json_to_sheet(sessionsData);
  wsSessions['!views'] = [{ RTL: true }];
  wsSessions['!cols'] = [
    { wch: 16 },
    { wch: 38 },
    { wch: 16 },
    { wch: 20 },
    { wch: 26 },
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(workbook, wsSessions, 'سجل_الحصص_والجلسات');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, filename);
}

export function exportStudentsToExcel(students: Student[], filename = 'قائمة_طلاب_مجموعة_حفظ_الستين.xlsx') {
  const data = students.map((s) => ({
    'المعرف الوحيد (ID)': s.id,
    'اللقب': s.lastName,
    'الاسم': s.firstName,
    'حلقة التحفيظ / الفوج': s.group || 'عام',
    'مستوى الحفظ': s.hizbProgress || '—',
    'رقم الهاتف': s.phone || '',
    'البريد الإلكتروني': s.email || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!views'] = [{ RTL: true }];
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 28 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قائمة_الطلاب');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(blob, filename);
}
