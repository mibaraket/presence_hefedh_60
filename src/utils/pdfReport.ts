import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { Student, Session, AttendanceRecord, MonthlyReportData } from '../types';

export function computeMonthlyStats(
  month: number, // 0 - 11
  year: number,
  students: Student[],
  sessions: Session[],
  records: AttendanceRecord[]
): MonthlyReportData {
  const monthNamesArabic = [
    'جانفي (محرم)',
    'فيفري (صفر)',
    'مارس (ربيع الأول)',
    'أفريل (ربيع الثاني)',
    'ماي (جمادى الأولى)',
    'جوان (جمادى الآخرة)',
    'جويلية (رجب)',
    'أوت (شعبان)',
    'سبتمبر (رمضان)',
    'أكتوبر (شوال)',
    'نوفمبر (ذو القعدة)',
    'ديسمبر (ذو الحجة)'
  ];

  // Filter sessions that belong to this month and year
  const monthSessions = sessions.filter((s) => {
    const sDate = new Date(s.date);
    return sDate.getFullYear() === year && sDate.getMonth() === month;
  });

  const sessionIds = new Set(monthSessions.map((s) => s.id));
  const monthRecords = records.filter((r) => sessionIds.has(r.sessionId));

  let totalRecitations = 0;
  let totalOralParticipations = 0;
  let totalPresents = 0;
  let totalExpectedSlots = 0;

  const studentStats = students.map((s) => {
    const sRecords = monthRecords.filter((r) => r.studentId === s.id);
    const presentCount = sRecords.filter((r) => r.status === 'PRESENT').length;
    const absentCount = sRecords.filter((r) => r.status === 'ABSENT').length;
    const recitationCount = sRecords.filter((r) => r.recitation).length;
    const oralCount = sRecords.filter((r) => r.oralParticipation).length;

    totalRecitations += recitationCount;
    totalOralParticipations += oralCount;
    totalPresents += presentCount;
    totalExpectedSlots += sRecords.length;

    const monthlyRate = sRecords.length > 0
      ? Math.round((presentCount / sRecords.length) * 100)
      : (monthSessions.length > 0 ? 0 : 100);

    return {
      studentId: s.id,
      studentName: `${s.lastName} ${s.firstName}`.trim(),
      group: s.group,
      presentCount,
      absentCount,
      totalMonthSessions: sRecords.length,
      monthlyRate,
      recitationCount,
      oralCount
    };
  });

  const overallAttendanceRate = totalExpectedSlots > 0
    ? Math.round((totalPresents / totalExpectedSlots) * 100)
    : 100;

  return {
    month,
    year,
    monthName: monthNamesArabic[month] || `شهر ${month + 1}`,
    totalSessions: monthSessions.length,
    totalStudents: students.length,
    overallAttendanceRate,
    totalRecitations,
    totalOralParticipations,
    studentStats
  };
}

/**
 * Generates an official, beautifully styled Arabic PDF report with 100% accurate Arabic glyphs
 */
export async function generateMonthlyAttendancePDF(
  reportData: MonthlyReportData,
  institutionName = 'مجموعة حفظ الستين • مدرسة القرآن الكريم'
): Promise<void> {
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create temporary container for high-res HTML-to-Canvas rendering
  const container = document.createElement('div');
  container.setAttribute('dir', 'rtl');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '850px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Cairo', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
  container.style.padding = '32px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '99999';
  container.style.opacity = '1';
  container.style.visibility = 'visible';
  container.style.pointerEvents = 'none';

  // Build high-definition HTML Template
  container.innerHTML = `
    <div style="direction: rtl; text-align: right; font-family: inherit; background: #ffffff; color: #0f172a;">
      <!-- Islamic Header -->
      <div style="text-align: center; margin-bottom: 12px;">
        <span style="font-size: 14px; font-weight: 700; color: #065f46; letter-spacing: 1px;">
          بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ
        </span>
      </div>

      <!-- Top Official Header Banner -->
      <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); color: #ffffff; border-radius: 12px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div>
          <div style="font-size: 18px; font-weight: 800; margin-bottom: 4px; color: #ffffff;">
            ${institutionName}
          </div>
          <div style="font-size: 13px; color: #a7f3d0; font-weight: 600;">
            التقرير الإحصائي الشهري للحضور والمواظبة وجلسات التسميع القرآني
          </div>
        </div>
        <div style="text-align: left; background: rgba(255, 255, 255, 0.12); padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2);">
          <div style="font-size: 13px; font-weight: 700; color: #ffffff;">
            ${reportData.monthName} ${reportData.year}
          </div>
          <div style="font-size: 10px; color: #d1fae5; margin-top: 2px;">
            تاريخ التوليد: ${generationDateStr}
          </div>
        </div>
      </div>

      <!-- Summary KPI Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: #166534; font-weight: 700; margin-bottom: 4px;">نسبة الحضور العامة</div>
          <div style="font-size: 20px; font-weight: 800; color: #14532d;">${reportData.overallAttendanceRate}%</div>
          <div style="font-size: 9px; color: #15803d; margin-top: 2px;">معدل الالتزام بالحلقات</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: #475569; font-weight: 700; margin-bottom: 4px;">حصص الشهر المعقودة</div>
          <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${reportData.totalSessions}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">حلقة تحفيظ ومراجعة</div>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: #047857; font-weight: 700; margin-bottom: 4px;">مجموع جلسات التسميع</div>
          <div style="font-size: 20px; font-weight: 800; color: #064e3b;">${reportData.totalRecitations}</div>
          <div style="font-size: 9px; color: #059669; margin-top: 2px;">تسميع مباشر للشيخ</div>
        </div>

        <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 12px; text-align: center;">
          <div style="font-size: 11px; color: #0f766e; font-weight: 700; margin-bottom: 4px;">المشاركات والأحكام</div>
          <div style="font-size: 20px; font-weight: 800; color: #134e4a;">${reportData.totalOralParticipations}</div>
          <div style="font-size: 9px; color: #0d9488; margin-top: 2px;">تجويد ومشاركة شفوية</div>
        </div>
      </div>

      <!-- Students Table Section Title -->
      <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
        <span style="font-size: 14px; font-weight: 800; color: #0f172a;">
          جدول المتابعة الفردية للطلاب (${reportData.studentStats.length} طالباً)
        </span>
        <span style="font-size: 11px; color: #64748b;">
          مجموعة حفظ الستين • تصنيف حسب الأفواج
        </span>
      </div>

      <!-- Detailed Attendance Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff; text-align: center;">
            <th style="padding: 8px 6px; border: 1px solid #334155; width: 65px;">المعرف الوحيد</th>
            <th style="padding: 8px 10px; border: 1px solid #334155; text-align: right;">اسم ولقب الطالب</th>
            <th style="padding: 8px 6px; border: 1px solid #334155;">الفوج</th>
            <th style="padding: 8px 6px; border: 1px solid #334155; width: 55px;">حضور</th>
            <th style="padding: 8px 6px; border: 1px solid #334155; width: 55px;">غياب</th>
            <th style="padding: 8px 8px; border: 1px solid #334155; width: 65px;">نسبة الحضور</th>
            <th style="padding: 8px 6px; border: 1px solid #334155; width: 60px;">التلاوة</th>
            <th style="padding: 8px 6px; border: 1px solid #334155; width: 60px;">التكرار</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.studentStats.map((st, idx) => {
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            const rateColor = st.monthlyRate >= 80 ? '#15803d' : (st.monthlyRate >= 50 ? '#b45309' : '#b91c1c');
            return `
              <tr style="background: ${rowBg}; text-align: center; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 7px 4px; border: 1px solid #e2e8f0; font-weight: 700; color: #475569; font-family: monospace; font-size: 10px;">${st.studentId}</td>
                <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">${st.studentName}</td>
                <td style="padding: 7px 6px; border: 1px solid #e2e8f0; color: #475569; font-size: 10px;">${st.group || 'عام'}</td>
                <td style="padding: 7px 4px; border: 1px solid #e2e8f0; font-weight: 700; color: #166534;">${st.presentCount}</td>
                <td style="padding: 7px 4px; border: 1px solid #e2e8f0; font-weight: 700; color: #dc2626;">${st.absentCount}</td>
                <td style="padding: 7px 6px; border: 1px solid #e2e8f0; font-weight: 800; color: ${rateColor};">
                  ${st.monthlyRate}%
                </td>
                <td style="padding: 7px 4px; border: 1px solid #e2e8f0; font-weight: 700; color: #065f46;">
                  ${st.recitationCount > 0 ? `✓ (${st.recitationCount})` : '—'}
                </td>
                <td style="padding: 7px 4px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f766e;">
                  ${st.oralCount > 0 ? `✓ (${st.oralCount})` : '—'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Signatures and Official Stamp Section -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; padding-top: 15px; border-top: 2px dashed #cbd5e1;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; height: 90px; position: relative;">
          <div style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 4px;">
            توقيع وملاحظات شيخ الحلقة / المشرف التربوي:
          </div>
          <div style="position: absolute; bottom: 8px; right: 14px; font-size: 9px; color: #94a3b8;">
            التوقيع المعتمد
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; height: 90px; position: relative; text-align: left;">
          <div style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 4px; text-align: right;">
            ختم إدارة المدرسة القرآنية / المعهد:
          </div>
          <div style="position: absolute; bottom: 8px; left: 14px; font-size: 9px; color: #94a3b8;">
            الختم الرسمي
          </div>
        </div>
      </div>

      <!-- Footer Note -->
      <div style="text-align: center; margin-top: 16px; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px;">
        تم استخراج هذا التقرير آلياً عبر منظومة متابعة حفظ القرآن الكريم • مجموعة حفظ الستين
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1000
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const safeMonth = (reportData.monthName || 'شهري').replace(/\s+/g, '_');
    const safeFileName = `تقرير_مواظبة_${safeMonth}_${reportData.year}.pdf`;
    
    // Robust blob download
    const blob = pdf.output('blob');
    saveAs(blob, safeFileName);
  } catch (canvasErr) {
    console.error('Canvas capture failed, falling back to direct jsPDF generation:', canvasErr);
    // Reliable fallback text/tabular PDF
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.setFontSize(16);
    pdf.text(institutionName, 105, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Rapport Mensuel / تقرير الحضور - ${reportData.monthName} ${reportData.year}`, 105, 30, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`Sessions: ${reportData.totalSessions} | Taux General: ${reportData.overallAttendanceRate}%`, 105, 40, { align: 'center' });
    pdf.text(`Recitations: ${reportData.totalRecitations} | Repetitions: ${reportData.totalOralParticipations}`, 105, 46, { align: 'center' });

    let y = 60;
    pdf.text('ID    Nom & Prenom                        Pres.   Abs.    Taux    Tilawa', 15, y);
    y += 4;
    pdf.line(15, y, 195, y);
    y += 6;

    reportData.studentStats.forEach((st) => {
      if (y > 275) {
        pdf.addPage();
        y = 20;
      }
      const line = `${st.studentId.padEnd(5)} ${st.studentName.padEnd(30)} ${String(st.presentCount).padStart(3)}     ${String(st.absentCount).padStart(3)}     ${st.monthlyRate}%     ${st.recitationCount > 0 ? 'Oui' : '-'}`;
      pdf.text(line, 15, y);
      y += 7;
    });

    const safeMonth = (reportData.monthName || 'شهري').replace(/\s+/g, '_');
    const safeFileName = `تقرير_مواظبة_${safeMonth}_${reportData.year}.pdf`;
    const blob = pdf.output('blob');
    saveAs(blob, safeFileName);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Native Browser Print / Save as PDF Fallback
 */
export function printMonthlyAttendanceReport(
  reportData: MonthlyReportData,
  institutionName = 'مجموعة حفظ الستين • مدرسة القرآن الكريم'
): void {
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = 'none';

  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow?.document;
  if (!doc) return;

  const now = new Date();
  const generationDateStr = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>تقرير مواظبة - ${reportData.monthName} ${reportData.year}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: system-ui, -apple-system, sans-serif; direction: rtl; text-align: right; color: #0f172a; margin: 0; padding: 10px; }
        .header { background: #064e3b; color: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
        .kpis { display: flex; gap: 10px; margin-bottom: 20px; }
        .kpi { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; }
        th { background: #0f172a; color: white; }
        .signatures { display: flex; justify-content: space-between; margin-top: 30px; gap: 20px; }
        .sig-box { flex: 1; border: 1px solid #cbd5e1; padding: 12px; height: 70px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div style="text-align: center; font-weight: bold; margin-bottom: 10px; color: #065f46;">بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ</div>
      <div class="header">
        <h2 style="margin: 0 0 5px 0;">${institutionName}</h2>
        <div style="font-size: 13px;">التقرير الإحصائي الشهري للحضور والتسميع القرآني - ${reportData.monthName} ${reportData.year}</div>
        <div style="font-size: 11px; opacity: 0.9; margin-top: 4px;">تاريخ الاستخراج: ${generationDateStr}</div>
      </div>
      <div class="kpis">
        <div class="kpi"><div>نسبة الحضور</div><strong style="font-size: 18px; color: #15803d;">${reportData.overallAttendanceRate}%</strong></div>
        <div class="kpi"><div>حصص الشهر</div><strong style="font-size: 18px;">${reportData.totalSessions}</strong></div>
        <div class="kpi"><div>جلسات التسميع</div><strong style="font-size: 18px; color: #065f46;">${reportData.totalRecitations}</strong></div>
        <div class="kpi"><div>جلسات التكرار</div><strong style="font-size: 18px; color: #0f766e;">${reportData.totalOralParticipations}</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>المعرف</th><th>اسم ولقب الطالب</th><th>الفوج</th><th>حاضر</th><th>غائب</th><th>النسبة</th><th>تلاوة</th><th>تكرار</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.studentStats.map((st) => `
            <tr>
              <td>${st.studentId}</td>
              <td style="text-align: right; font-weight: bold;">${st.studentName}</td>
              <td>${st.group || '—'}</td>
              <td style="color: #15803d; font-weight: bold;">${st.presentCount}</td>
              <td style="color: #dc2626;">${st.absentCount}</td>
              <td style="font-weight: bold;">${st.monthlyRate}%</td>
              <td>${st.recitationCount}</td>
              <td>${st.oralCount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="signatures">
        <div class="sig-box">توقيع شيخ الحلقة / المشرف التربوي:</div>
        <div class="sig-box">ختم إدارة المدرسة القرآنية:</div>
      </div>
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    printIframe.contentWindow?.focus();
    printIframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(printIframe)) {
        document.body.removeChild(printIframe);
      }
    }, 2000);
  }, 500);
}
