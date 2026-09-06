/**
 * منظومة متابعة حضور وتسميع حفاظ القرآن الكريم - مجموعة حفظ الستين
 * تصميم موحد (Dark Luxury Emerald & Slate)، دعم تعدد الجلسات، التسميع التفاعلي ثنائي المراحل، وقاعدة بيانات Supabase
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CheckInTab } from './components/CheckInTab';
import { RecitationQueueTab } from './components/RecitationQueueTab';
import { ExamsTab } from './components/ExamsTab';
import { AttendanceTableTab } from './components/AttendanceTableTab';
import { StudentsRosterTab } from './components/StudentsRosterTab';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { NewSessionModal } from './components/NewSessionModal';
import { DatabaseModal } from './components/DatabaseModal';
import { 
  Student, 
  Session, 
  AttendanceRecord, 
  AttendanceStatus, 
  ExamRecord, 
  ExamEntity,
  AppUser,
  cycleParticipation,
  normalizeParticipation
} from './types';
import { 
  loadStoredData, 
  saveStoredData, 
  formatDateTimeArabic, 
  recomputeAllAttendanceRates 
} from './utils/storage';
import { exportAttendanceToExcel } from './utils/excel';
import { soundManager } from './utils/sound';
import { 
  getCurrentUser, 
  setCurrentUser as saveCurrentUser, 
  getActiveSessions, 
  switchActiveSession, 
  removeActiveSession 
} from './utils/auth';
import { LoginScreen } from './components/LoginModal';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<AppUser | null>(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<'checkin' | 'recitation_queue' | 'exams' | 'table' | 'students'>('checkin');
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [examEntities, setExamEntities] = useState<ExamEntity[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('مجموعة حفظ الستين - مدرسة التحفيظ');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Modals
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  // Load Initial Data on Mount
  useEffect(() => {
    const data = loadStoredData();
    setStudents(data.students);
    setSessions(data.sessions);
    setRecords(data.records);
    setExams(data.exams || []);
    setExamEntities(data.examEntities || []);
    setActiveSessionId(data.activeSessionId);
    setInstitutionName(data.institutionName);
    setLastSyncTime(new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || new Date().toLocaleTimeString());
  }, []);

  // Save changes to storage and Supabase sync
  const persistState = (
    newStudents: Student[],
    newSessions: Session[],
    newRecords: AttendanceRecord[],
    newActiveSessionId: string,
    newExams: ExamRecord[] = exams,
    newInstName = institutionName,
    newExamEntities: ExamEntity[] = examEntities
  ) => {
    setStudents(newStudents);
    setSessions(newSessions);
    setRecords(newRecords);
    setExams(newExams);
    setExamEntities(newExamEntities);
    setActiveSessionId(newActiveSessionId);
    setInstitutionName(newInstName);
    saveStoredData(newStudents, newSessions, newRecords, newExams, newActiveSessionId, newInstName, newExamEntities);
    setLastSyncTime(new Date().toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || new Date().toLocaleTimeString());
  };

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  // Mark Attendance via Unique ID
  const handleMarkAttendance = (
    studentIdOrCode: string,
    status: AttendanceStatus = 'PRESENT'
  ) => {
    if (!activeSession) {
      return { success: false, message: 'لا توجد أي حلقة أو حصة تسميع نشطة حالياً.' };
    }

    const cleanCode = studentIdOrCode.trim().toUpperCase();
    const student = students.find((s) => s.id.toUpperCase() === cleanCode);

    if (!student) {
      return { 
        success: false, 
        message: `المعرف "${cleanCode}" غير موجود في قائمة طلاب الستين.` 
      };
    }

    const recordId = `${activeSession.id}_${student.id}`;
    const existingIndex = records.findIndex((r) => r.id === recordId);
    const nowTimestamp = formatDateTimeArabic();

    let alreadyChecked = false;
    let updatedRecords = [...records];

    if (existingIndex >= 0) {
      const existing = updatedRecords[existingIndex];
      if (existing.status === 'PRESENT') {
        alreadyChecked = true;
      }
      updatedRecords[existingIndex] = {
        ...existing,
        status,
        entryTimestamp: nowTimestamp
      };
    } else {
      updatedRecords.push({
        id: recordId,
        studentId: student.id,
        studentName: `${student.lastName} ${student.firstName}`,
        sessionId: activeSession.id,
        sessionTitle: `${activeSession.title} (${activeSession.date})`,
        sessionDate: activeSession.date,
        status,
        entryTimestamp: nowTimestamp,
        attendanceRate: 100,
        recitation: 'NONE',
        oralParticipation: 'NONE',
        notes: ''
      });
    }

    updatedRecords = recomputeAllAttendanceRates(updatedRecords, students);
    persistState(students, sessions, updatedRecords, activeSessionId, exams);

    return {
      success: true,
      message: 'تم تسجيل الحضور بنجاح',
      student,
      alreadyChecked
    };
  };

  const handleMarkAllPresent = () => {
    if (!activeSession) return;
    const nowTimestamp = formatDateTimeArabic();
    let updatedRecords = [...records];
    
    students.forEach((student) => {
      const recordId = `${activeSession.id}_${student.id}`;
      const existingIndex = updatedRecords.findIndex((r) => r.id === recordId);
      if (existingIndex >= 0) {
        updatedRecords[existingIndex] = {
          ...updatedRecords[existingIndex],
          status: 'PRESENT',
          entryTimestamp: updatedRecords[existingIndex].entryTimestamp || nowTimestamp
        };
      } else {
        updatedRecords.push({
          id: recordId,
          studentId: student.id,
          studentName: `${student.lastName} ${student.firstName}`,
          sessionId: activeSession.id,
          sessionTitle: `${activeSession.title} (${activeSession.date})`,
          sessionDate: activeSession.date,
          status: 'PRESENT',
          entryTimestamp: nowTimestamp,
          attendanceRate: 100,
          recitation: 'NONE',
          oralParticipation: 'NONE',
          notes: ''
        });
      }
    });

    updatedRecords = recomputeAllAttendanceRates(updatedRecords, students);
    persistState(students, sessions, updatedRecords, activeSessionId, exams);
  };

  // Update a single record
  const handleUpdateRecord = (recordId: string, updates: Partial<AttendanceRecord>) => {
    let updatedRecords = records.map((r) => (r.id === recordId ? { ...r, ...updates } : r));
    updatedRecords = recomputeAllAttendanceRates(updatedRecords, students);
    persistState(students, sessions, updatedRecords, activeSessionId, exams);
  };

  // Update status directly
  const handleUpdateStatus = (recordId: string, status: AttendanceStatus) => {
    const existing = records.find((r) => r.id === recordId);
    if (existing) {
      handleUpdateRecord(recordId, { 
        status,
        entryTimestamp: status === 'PRESENT' && !existing.entryTimestamp ? formatDateTimeArabic() : existing.entryTimestamp
      });
    } else {
      // Find from student id and active session
      const parts = recordId.split('_');
      const sId = parts[0];
      const stId = parts[1];
      const st = students.find((s) => s.id === stId);
      const sess = sessions.find((s) => s.id === sId) || activeSession;
      if (st && sess) {
        const newRecord: AttendanceRecord = {
          id: recordId,
          studentId: st.id,
          studentName: `${st.lastName} ${st.firstName}`,
          sessionId: sess.id,
          sessionTitle: `${sess.title} (${sess.date})`,
          sessionDate: sess.date,
          status,
          entryTimestamp: status === 'PRESENT' ? formatDateTimeArabic() : null,
          attendanceRate: 100,
          recitation: 'NONE',
          oralParticipation: 'NONE',
          notes: ''
        };
        let combined = [...records, newRecord];
        combined = recomputeAllAttendanceRates(combined, students);
        persistState(students, sessions, combined, activeSessionId, exams);
      }
    }
  };

  // Cycle Recitation (2-step click: NONE -> SELECTED -> CONFIRMED -> NONE)
  const handleCycleRecitation = (recordId: string) => {
    const existing = records.find((r) => r.id === recordId);
    if (existing) {
      const nextStatus = cycleParticipation(existing.recitation);
      if (nextStatus === 'CONFIRMED') {
        soundManager.playSuccess();
      }
      handleUpdateRecord(recordId, { recitation: nextStatus });
    } else {
      const parts = recordId.split('_');
      const sId = parts[0];
      const stId = parts[1];
      const st = students.find((s) => s.id === stId);
      const sess = sessions.find((s) => s.id === sId) || activeSession;
      if (st && sess) {
        const newRecord: AttendanceRecord = {
          id: recordId,
          studentId: st.id,
          studentName: `${st.lastName} ${st.firstName}`,
          sessionId: sess.id,
          sessionTitle: `${sess.title} (${sess.date})`,
          sessionDate: sess.date,
          status: 'PRESENT',
          entryTimestamp: formatDateTimeArabic(),
          attendanceRate: 100,
          recitation: 'SELECTED',
          oralParticipation: 'NONE',
          notes: ''
        };
        let combined = [...records, newRecord];
        combined = recomputeAllAttendanceRates(combined, students);
        persistState(students, sessions, combined, activeSessionId, exams);
      }
    }
  };

  // Cycle Oral Participation (2-step click: NONE -> SELECTED -> CONFIRMED -> NONE)
  const handleCycleOral = (recordId: string) => {
    const existing = records.find((r) => r.id === recordId);
    if (existing) {
      const nextStatus = cycleParticipation(existing.oralParticipation);
      handleUpdateRecord(recordId, { oralParticipation: nextStatus });
    } else {
      const parts = recordId.split('_');
      const sId = parts[0];
      const stId = parts[1];
      const st = students.find((s) => s.id === stId);
      const sess = sessions.find((s) => s.id === sId) || activeSession;
      if (st && sess) {
        const newRecord: AttendanceRecord = {
          id: recordId,
          studentId: st.id,
          studentName: `${st.lastName} ${st.firstName}`,
          sessionId: sess.id,
          sessionTitle: `${sess.title} (${sess.date})`,
          sessionDate: sess.date,
          status: 'PRESENT',
          entryTimestamp: formatDateTimeArabic(),
          attendanceRate: 100,
          recitation: 'NONE',
          oralParticipation: 'SELECTED',
          notes: ''
        };
        let combined = [...records, newRecord];
        combined = recomputeAllAttendanceRates(combined, students);
        persistState(students, sessions, combined, activeSessionId, exams);
      }
    }
  };

  // Update Note
  const handleUpdateNote = (recordId: string, note: string) => {
    const existing = records.find((r) => r.id === recordId);
    if (existing) {
      handleUpdateRecord(recordId, { notes: note });
    } else {
      const parts = recordId.split('_');
      const sId = parts[0];
      const stId = parts[1];
      const st = students.find((s) => s.id === stId);
      const sess = sessions.find((s) => s.id === sId) || activeSession;
      if (st && sess) {
        const newRecord: AttendanceRecord = {
          id: recordId,
          studentId: st.id,
          studentName: `${st.lastName} ${st.firstName}`,
          sessionId: sess.id,
          sessionTitle: `${sess.title} (${sess.date})`,
          sessionDate: sess.date,
          status: 'ABSENT',
          entryTimestamp: null,
          attendanceRate: 0,
          recitation: 'NONE',
          oralParticipation: 'NONE',
          notes: note
        };
        let combined = [...records, newRecord];
        combined = recomputeAllAttendanceRates(combined, students);
        persistState(students, sessions, combined, activeSessionId, exams);
      }
    }
  };

  // Create a new session with all students loaded automatically
  const handleCreateSession = (newSession: Session) => {
    const updatedSessions = [newSession, ...sessions];
    
    const newRecordsForSession: AttendanceRecord[] = students.map((st) => ({
      id: `${newSession.id}_${st.id}`,
      studentId: st.id,
      studentName: `${st.lastName} ${st.firstName}`,
      sessionId: newSession.id,
      sessionTitle: `${newSession.title} (${newSession.date})`,
      sessionDate: newSession.date,
      status: 'ABSENT',
      entryTimestamp: null,
      attendanceRate: 0,
      recitation: 'NONE',
      oralParticipation: 'NONE',
      notes: ''
    }));

    let combinedRecords = [...records, ...newRecordsForSession];
    combinedRecords = recomputeAllAttendanceRates(combinedRecords, students);

    persistState(students, updatedSessions, combinedRecords, newSession.id, exams);
  };

  // Close session action
  const handleCloseSession = (sessionId: string) => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) return;

    const updatedSessions = sessions.map((s) => s.id === sessionId ? { ...s, isClosed: true } : s);

    let updatedRecords = recomputeAllAttendanceRates(records, students);
    persistState(students, updatedSessions, updatedRecords, sessionId, exams);

    soundManager.playSuccess();

    exportAttendanceToExcel(
      updatedRecords,
      students,
      updatedSessions,
      `سجل_حفظ_الستين_حصة_${targetSession.date}.xlsx`
    );
  };

  // Import students from Excel
  const handleImportStudents = (newStudents: Student[]) => {
    const newRecords: AttendanceRecord[] = [];

    newStudents.forEach((st) => {
      sessions.forEach((sess) => {
        const recordId = `${sess.id}_${st.id}`;
        if (!records.some((r) => r.id === recordId)) {
          newRecords.push({
            id: recordId,
            studentId: st.id,
            studentName: `${st.lastName} ${st.firstName}`,
            sessionId: sess.id,
            sessionTitle: `${sess.title} (${sess.date})`,
            sessionDate: sess.date,
            status: 'ABSENT',
            entryTimestamp: null,
            attendanceRate: 0,
            recitation: 'NONE',
            oralParticipation: 'NONE',
            notes: ''
          });
        }
      });
    });

    let combinedRecords = [...records, ...newRecords];
    combinedRecords = recomputeAllAttendanceRates(combinedRecords, newStudents);

    persistState(newStudents, sessions, combinedRecords, activeSessionId, exams);
  };

  // Add individual student
  const handleAddStudent = (newStudent: Student) => {
    const updatedStudents = [...students, newStudent];
    const newRecords: AttendanceRecord[] = sessions.map((sess) => ({
      id: `${sess.id}_${newStudent.id}`,
      studentId: newStudent.id,
      studentName: `${newStudent.lastName} ${newStudent.firstName}`,
      sessionId: sess.id,
      sessionTitle: `${sess.title} (${sess.date})`,
      sessionDate: sess.date,
      status: 'ABSENT',
      entryTimestamp: null,
      attendanceRate: 0,
      recitation: 'NONE',
      oralParticipation: 'NONE',
      notes: ''
    }));

    let combinedRecords = [...records, ...newRecords];
    combinedRecords = recomputeAllAttendanceRates(combinedRecords, updatedStudents);

    persistState(updatedStudents, sessions, combinedRecords, activeSessionId, exams);
  };

  // Update individual student
  const handleUpdateStudent = (updatedStudent: Student) => {
    const updatedStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    const updatedRecords = records.map((r) => {
      if (r.studentId === updatedStudent.id) {
        return {
          ...r,
          studentName: `${updatedStudent.lastName} ${updatedStudent.firstName}`
        };
      }
      return r;
    });
    persistState(updatedStudents, sessions, updatedRecords, activeSessionId, exams);
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    const updatedStudents = students.filter((s) => s.id !== studentId);
    let updatedRecords = records.filter((r) => r.studentId !== studentId);
    let updatedExams = exams.filter((e) => e.studentId !== studentId);
    updatedRecords = recomputeAllAttendanceRates(updatedRecords, updatedStudents);

    persistState(updatedStudents, sessions, updatedRecords, activeSessionId, updatedExams);
  };

  // Queue reset handlers
  const handleResetRecitationQueue = () => {
    if (!activeSession) return;
    const updatedRecords = records.map((r) => {
      if (r.sessionId === activeSession.id) {
        return {
          ...r,
          recitation: 'NONE' as const
        };
      }
      return r;
    });
    persistState(students, sessions, updatedRecords, activeSessionId);
  };

  const handleResetRepetitionQueue = () => {
    if (!activeSession) return;
    const updatedRecords = records.map((r) => {
      if (r.sessionId === activeSession.id) {
        return {
          ...r,
          oralParticipation: 'NONE' as const
        };
      }
      return r;
    });
    persistState(students, sessions, updatedRecords, activeSessionId);
  };

  // Exam handlers
  const handleAddExam = (newExam: ExamRecord) => {
    const updated = [newExam, ...exams];
    persistState(students, sessions, records, activeSessionId, updated);
  };

  const handleDeleteExam = (examId: string) => {
    const updated = exams.filter((e) => e.id !== examId);
    persistState(students, sessions, records, activeSessionId, updated);
  };

  const handleAddExamEntity = (newEntity: ExamEntity) => {
    const updated = [newEntity, ...examEntities];
    persistState(students, sessions, records, activeSessionId, exams, institutionName, updated);
  };

  const handleDeleteExamEntity = (entityId: string) => {
    const updatedEntities = examEntities.filter((e) => e.id !== entityId);
    const updatedExams = exams.filter((e) => e.examId !== entityId);
    persistState(students, sessions, records, activeSessionId, updatedExams, institutionName, updatedEntities);
  };

  const handleSaveCandidateScore = (examRecord: ExamRecord) => {
    const existingIndex = exams.findIndex((e) => e.id === examRecord.id || (e.examId && e.examId === examRecord.examId && e.studentId === examRecord.studentId));
    let updatedExams: ExamRecord[];
    if (existingIndex >= 0) {
      updatedExams = [...exams];
      updatedExams[existingIndex] = examRecord;
    } else {
      updatedExams = [examRecord, ...exams];
    }
    persistState(students, sessions, records, activeSessionId, updatedExams);
  };

  const handleDeleteCandidateScore = (recordId: string) => {
    const updatedExams = exams.filter((e) => e.id !== recordId);
    persistState(students, sessions, records, activeSessionId, updatedExams);
  };

  // Export full Excel ledger
  const handleExportExcel = () => {
    exportAttendanceToExcel(
      records,
      students,
      sessions,
      `سجل_حضور_وتسميع_الستين_${activeSession?.date || 'شامل'}.xlsx`
    );
  };

  // Login and Logout handlers
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUserState(user);
    saveCurrentUser(user);
  };

  const handleLogout = () => {
    if (currentUser) {
      removeActiveSession(currentUser.username);
    }
    const remaining = getActiveSessions();
    if (remaining.length > 0) {
      const nextUser = switchActiveSession(remaining[0].username);
      setCurrentUserState(nextUser);
    } else {
      setCurrentUserState(null);
      saveCurrentUser(null);
    }
  };

  const handleSwitchProfile = (username: string) => {
    const nextUser = switchActiveSession(username);
    if (nextUser) {
      setCurrentUserState(nextUser);
    }
  };

  // If user is not logged in, render the login & registration screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Navigation & Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={(id) => setActiveSessionId(id)}
        onOpenNewSession={() => setIsNewSessionModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onExportExcel={handleExportExcel}
        institutionName={institutionName}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchProfile={handleSwitchProfile}
        onAddProfile={() => setCurrentUserState(null)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Tab 1: تسجيل الحضور الفوري بالمعرف الوحيد */}
        {activeTab === 'checkin' && (
          <CheckInTab
            students={students}
            sessions={sessions}
            activeSession={activeSession}
            records={records}
            onMarkAttendance={handleMarkAttendance}
            onUpdateStatus={handleUpdateStatus}
            onCycleRecitation={handleCycleRecitation}
            onCycleOral={handleCycleOral}
            onUpdateNote={handleUpdateNote}
            onExportExcel={handleExportExcel}
            onCloseSession={handleCloseSession}
          />
        )}

        {/* Tab 2: قوائم وتناوب التلاوة والتكرار */}
        {activeTab === 'recitation_queue' && (
          <RecitationQueueTab
            students={students}
            sessions={sessions}
            records={records}
            activeSession={activeSession}
            onCycleRecitation={handleCycleRecitation}
            onCycleOral={handleCycleOral}
            onResetRecitationQueue={handleResetRecitationQueue}
            onResetRepetitionQueue={handleResetRepetitionQueue}
            onMarkAllPresent={handleMarkAllPresent}
            onMarkPresentAndRecite={(studentId) => {
              handleMarkAttendance(studentId, 'PRESENT');
              const recId = `${activeSession?.id || ''}_${studentId}`;
              handleCycleRecitation(recId);
            }}
            onSelectSession={(id) => setActiveSessionId(id)}
          />
        )}

        {/* Tab 3: سجل الاختبارات والدرجات */}
        {activeTab === 'exams' && (
          <ExamsTab
            students={students}
            exams={exams}
            examEntities={examEntities}
            onAddExamEntity={handleAddExamEntity}
            onDeleteExamEntity={handleDeleteExamEntity}
            onSaveCandidateScore={handleSaveCandidateScore}
            onDeleteCandidateScore={handleDeleteCandidateScore}
            onAddExam={handleAddExam}
            onDeleteExam={handleDeleteExam}
          />
        )}

        {/* Tab 4: سجل الحضور والمتابعة الشامل */}
        {activeTab === 'table' && (
          <AttendanceTableTab
            records={records}
            sessions={sessions}
            students={students}
            onUpdateStatus={handleUpdateStatus}
            onCycleRecitation={handleCycleRecitation}
            onCycleOral={handleCycleOral}
            onUpdateNote={handleUpdateNote}
            onExportExcel={handleExportExcel}
          />
        )}

        {/* Tab 5: إدارة الطلاب واستيراد الإكسيل */}
        {activeTab === 'students' && (
          <StudentsRosterTab
            students={students}
            onImportStudents={handleImportStudents}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

      </main>

      {/* Real-time Status Bar Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-6 sm:px-8 py-3.5 shrink-0 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
          <p className="text-slate-300 font-medium">
            حالة البيانات : <strong className="text-emerald-400">سحابية ومحفوظة تلقائياً</strong> • آخر حفظ: {lastSyncTime}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs flex-wrap justify-center font-medium">
          <button
            onClick={() => setActiveTab('recitation_queue')}
            className="hover:text-emerald-400 transition-colors text-slate-400"
          >
            قوائم وتناوب
          </button>
          <span className="text-slate-700">•</span>
          <button
            onClick={() => setActiveTab('exams')}
            className="hover:text-emerald-400 transition-colors text-slate-400"
          >
            الاختبارات ({exams.length})
          </button>
          <span className="text-slate-700">•</span>
          <button
            onClick={() => setActiveTab('students')}
            className="hover:text-emerald-400 transition-colors text-slate-400"
          >
            الحفاظ ({students.length})
          </button>
          <span className="text-slate-700">•</span>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="hover:text-emerald-400 transition-colors text-slate-400"
          >
            تقرير PDF
          </button>
          <span className="text-slate-700">•</span>
          <button
            onClick={() => setIsDatabaseModalOpen(true)}
            className="hover:text-emerald-400 transition-colors text-emerald-400/90"
          >
            قاعدة Supabase
          </button>
        </div>
      </footer>

      {/* Modal: New Session */}
      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onCreateSession={handleCreateSession}
        teacherDefaultName={currentUser.name}
      />

      {/* Modal: Monthly PDF Report */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        students={students}
        sessions={sessions}
        records={records}
        institutionName={institutionName}
        onUpdateInstitutionName={(name) => {
          setInstitutionName(name);
          saveStoredData(students, sessions, records, exams, activeSessionId, name);
        }}
      />

      {/* Modal: Supabase Configuration & Schema */}
      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
      />

    </div>
  );
}
