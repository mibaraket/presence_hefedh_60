/**
 * منظومة متابعة حضور وتسميع حفاظ القرآن الكريم - مجموعة حفظ الستين
 * تصميم موحد (Dark Luxury Emerald & Slate)، دعم تعدد الجلسات، التسميع التفاعلي ثنائي المراحل، وقاعدة بيانات Supabase
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header, NavTab } from './components/Header';
import { CheckInTab } from './components/CheckInTab';
import { RecitationQueueTab } from './components/RecitationQueueTab';
import { StudentsRosterTab } from './components/StudentsRosterTab';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { NewSessionModal } from './components/NewSessionModal';
import { DatabaseModal } from './components/DatabaseModal';
import { InstallApkModal } from './components/InstallApkModal';
import { AdminConfigModal } from './components/AdminConfigModal';
import { 
  Student, 
  Session, 
  AttendanceRecord, 
  AttendanceStatus, 
  ExamRecord, 
  ExamEntity,
  AppUser,
  Branch,
  TeacherEntity,
  cycleParticipation,
  normalizeParticipation
} from './types';
import { 
  loadStoredData, 
  saveStoredData, 
  formatDateTimeArabic, 
  recomputeAllAttendanceRates,
  loadStoredBranches,
  saveStoredBranches,
  loadStoredTeachers,
  saveStoredTeachers
} from './utils/storage';
import { exportAttendanceToExcel } from './utils/excel';
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
  const [activeTab, setActiveTab] = useState<NavTab>('checkin');
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [examEntities, setExamEntities] = useState<ExamEntity[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('مجموعة حفظ الستين - مدرسة التحفيظ');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // General Configuration: Branches & Teachers
  const [branches, setBranches] = useState<Branch[]>(() => loadStoredBranches());
  const [teachers, setTeachers] = useState<TeacherEntity[]>(() => loadStoredTeachers());
  const [adminSelectedBranchId, setAdminSelectedBranchId] = useState<string>('ALL');

  // Modals
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isAdminConfigOpen, setIsAdminConfigOpen] = useState(false);

  // Security Guard: Enseignant can ONLY see tab 1 and tab 2
  useEffect(() => {
    if (currentUser?.role === 'TEACHER' && activeTab === 'students') {
      setActiveTab('checkin');
    }
  }, [currentUser, activeTab]);

  const handleUpdateBranches = (newBranches: Branch[]) => {
    setBranches(newBranches);
    saveStoredBranches(newBranches);
  };

  const handleUpdateTeachers = (newTeachers: TeacherEntity[]) => {
    setTeachers(newTeachers);
    saveStoredTeachers(newTeachers);
  };

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

  // Scoped Sessions based on User Role & Branch:
  // Admin sees all sessions or filters by chosen branch.
  // Branch Admin / Teacher sees their branch sessions.
  const scopedSessions = useMemo(() => {
    if (!currentUser) return sessions;
    if (currentUser.role === 'ADMIN') {
      if (adminSelectedBranchId === 'ALL') return sessions;
      const targetBranch = branches.find(b => b.id === adminSelectedBranchId);
      return sessions.filter((s) => 
        s.branchId === adminSelectedBranchId || 
        (targetBranch && s.branchName === targetBranch.name)
      );
    }
    if (currentUser.branchId || currentUser.branchName) {
      return sessions.filter((s) => 
        s.branchId === currentUser.branchId || 
        (currentUser.branchName && (s.branchName === currentUser.branchName || (s.room && s.room.includes(currentUser.branchName)))) ||
        (!s.branchId && !s.branchName)
      );
    }
    return sessions;
  }, [sessions, currentUser, adminSelectedBranchId, branches]);

  // Scoped Students based on User Role & Branch:
  // Admin sees all students or filters by chosen branch.
  // Branch Admin / Teacher sees their branch students.
  const scopedStudents = useMemo(() => {
    if (!currentUser) return students;
    if (currentUser.role === 'ADMIN') {
      if (adminSelectedBranchId === 'ALL') return students;
      const targetBranch = branches.find(b => b.id === adminSelectedBranchId);
      return students.filter((st) => 
        st.branchId === adminSelectedBranchId || 
        (targetBranch && st.branchName === targetBranch.name)
      );
    }
    if (currentUser.branchId || currentUser.branchName) {
      return students.filter((st) => 
        st.branchId === currentUser.branchId || 
        (currentUser.branchName && st.branchName === currentUser.branchName) ||
        (!st.branchId && !st.branchName)
      );
    }
    return students;
  }, [students, currentUser, adminSelectedBranchId, branches]);

  const activeSession = useMemo(() => {
    const list = scopedSessions.length > 0 ? scopedSessions : sessions;
    return list.find((s) => s.id === activeSessionId) || list[0] || null;
  }, [scopedSessions, sessions, activeSessionId]);

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
    const assignedBranch = branches.find(b => b.id === newSession.branchId);
    const sessionWithBranch: Session = {
      ...newSession,
      branchId: newSession.branchId || currentUser?.branchId,
      branchName: newSession.branchName || assignedBranch?.name || currentUser?.branchName
    };
    const updatedSessions = [sessionWithBranch, ...sessions];
    
    // Create attendance records for students belonging to this branch (or all if general)
    const targetStudents = sessionWithBranch.branchId
      ? students.filter(st => st.branchId === sessionWithBranch.branchId || !st.branchId)
      : (scopedStudents.length > 0 ? scopedStudents : students);

    const newRecordsForSession: AttendanceRecord[] = targetStudents.map((st) => ({
      id: `${sessionWithBranch.id}_${st.id}`,
      studentId: st.id,
      studentName: `${st.lastName} ${st.firstName}`,
      sessionId: sessionWithBranch.id,
      sessionTitle: `${sessionWithBranch.title} (${sessionWithBranch.date})`,
      sessionDate: sessionWithBranch.date,
      status: 'ABSENT',
      entryTimestamp: null,
      attendanceRate: 0,
      recitation: 'NONE',
      oralParticipation: 'NONE',
      notes: ''
    }));

    let combinedRecords = [...records, ...newRecordsForSession];
    combinedRecords = recomputeAllAttendanceRates(combinedRecords, students);

    persistState(students, updatedSessions, combinedRecords, sessionWithBranch.id, exams);
  };

  // Close session action
  const handleCloseSession = (sessionId: string) => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) return;

    const updatedSessions = sessions.map((s) => s.id === sessionId ? { ...s, isClosed: true } : s);

    let updatedRecords = recomputeAllAttendanceRates(records, students);
    persistState(students, updatedSessions, updatedRecords, sessionId, exams);

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
    const studentWithBranch: Student = {
      ...newStudent,
      branchId: newStudent.branchId || currentUser?.branchId,
      branchName: newStudent.branchName || currentUser?.branchName
    };
    const updatedStudents = [...students, studentWithBranch];
    const newRecords: AttendanceRecord[] = sessions.map((sess) => ({
      id: `${sess.id}_${studentWithBranch.id}`,
      studentId: studentWithBranch.id,
      studentName: `${studentWithBranch.lastName} ${studentWithBranch.firstName}`,
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
        sessions={scopedSessions}
        activeSession={activeSession}
        onSelectSession={(id) => setActiveSessionId(id)}
        onOpenNewSession={() => setIsNewSessionModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenAdminConfig={() => setIsAdminConfigOpen(true)}
        onExportExcel={handleExportExcel}
        institutionName={institutionName}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchProfile={handleSwitchProfile}
        onAddProfile={() => setCurrentUserState(null)}
        branches={branches}
        selectedBranchId={adminSelectedBranchId}
        onSelectBranch={(bId) => setAdminSelectedBranchId(bId)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 pb-24 sm:pb-28">
        
        {/* Tab 1: تسجيل الحضور الفوري بالمعرف الوحيد */}
        {activeTab === 'checkin' && (
          <CheckInTab
            students={scopedStudents}
            sessions={scopedSessions}
            activeSession={activeSession}
            records={records}
            onUpdateStatus={handleUpdateStatus}
            onCycleRecitation={handleCycleRecitation}
            onCycleOral={handleCycleOral}
            onMarkAllPresent={handleMarkAllPresent}
            onCloseSession={handleCloseSession}
          />
        )}

        {/* Tab 2: قوائم وتناوب التلاوة والتكرار */}
        {activeTab === 'recitation_queue' && (
          <RecitationQueueTab
            students={scopedStudents}
            sessions={scopedSessions}
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

        {/* Tab 3: إدارة الطلاب واستيراد الإكسيل (فقط للمدير ومسؤول الفرع) */}
        {activeTab === 'students' && currentUser.role !== 'TEACHER' && (
          <StudentsRosterTab
            students={scopedStudents}
            onImportStudents={handleImportStudents}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onExportExcel={handleExportExcel}
          />
        )}

      </main>

      {/* Discrete Status Bar Footer (Desktop view) */}
      <footer className="hidden sm:flex bg-slate-900/90 border-t border-slate-800 px-6 py-2.5 shrink-0 justify-between items-center text-xs text-slate-400 mb-16">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
          <p className="text-slate-300 font-medium text-[11px]">
            حالة البيانات: <strong className="text-emerald-400">سحابية ومحفوظة تلقائياً</strong> • آخر مزامنة: {lastSyncTime}
          </p>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          تطبيق أندرويد • منظومة حفظ الستين • {currentUser.roleLabel || currentUser.role}
        </div>
      </footer>

      {/* Android Mobile Bottom Navigation Bar */}
      <AndroidBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        studentsCount={scopedStudents.length}
        userRole={currentUser.role}
      />

      {/* Modal: New Session */}
      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onCreateSession={handleCreateSession}
        teacherDefaultName={currentUser.name}
        branchName={
          adminSelectedBranchId !== 'ALL'
            ? branches.find(b => b.id === adminSelectedBranchId)?.name || currentUser.branchName || 'الفرع الرئيسي'
            : currentUser.branchName || 'الفرع الرئيسي'
        }
        branchId={
          adminSelectedBranchId !== 'ALL'
            ? adminSelectedBranchId
            : currentUser.branchId
        }
        teachers={teachers}
        branches={branches}
        userRole={currentUser.role}
      />

      {/* Modal: Monthly PDF Report */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        students={scopedStudents}
        sessions={scopedSessions}
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

      {/* Modal: Android APK & WebAPK Installation */}
      <InstallApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Modal: Admin General Configuration (Branches, Teachers, Accounts) */}
      <AdminConfigModal
        isOpen={isAdminConfigOpen}
        onClose={() => setIsAdminConfigOpen(false)}
        branches={branches}
        teachers={teachers}
        onUpdateBranches={handleUpdateBranches}
        onUpdateTeachers={handleUpdateTeachers}
        currentUser={currentUser}
      />

    </div>
  );
}
