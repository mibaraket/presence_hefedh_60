import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Student, Session, AttendanceRecord, ExamRecord } from '../types';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

/**
 * Complete PostgreSQL/Supabase SQL Schema generator
 * Users can copy and execute this in Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- منظومة حفظ الستين - Supabase Database Schema
-- ==========================================

-- 1. جدول الطلاب (students)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  "group" TEXT DEFAULT 'فوج حفظ الستين',
  hizb_progress TEXT DEFAULT 'الحزب 1',
  phone TEXT,
  email TEXT,
  avatar_color TEXT DEFAULT 'bg-emerald-600',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول جلسات وحلقات التسميع (sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  room TEXT,
  teacher TEXT,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول تسجيل الحضور والمتابعة اليومية (attendance_records)
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  session_title TEXT,
  session_date DATE,
  status TEXT DEFAULT 'NOT_MARKED',
  entry_timestamp TEXT,
  attendance_rate NUMERIC DEFAULT 0,
  recitation TEXT DEFAULT 'NONE', -- 'NONE' | 'SELECTED' | 'CONFIRMED'
  oral_participation TEXT DEFAULT 'NONE', -- 'NONE' | 'SELECTED' | 'CONFIRMED'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول الاختبارات القرآنية (exam_records)
CREATE TABLE IF NOT EXISTS exam_records (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  "group" TEXT,
  exam_date DATE NOT NULL,
  juz_or_portion TEXT NOT NULL,
  examiner_name TEXT,
  hifz_score NUMERIC DEFAULT 0,
  hifz_max NUMERIC DEFAULT 40,
  tilawa_score NUMERIC DEFAULT 0,
  tilawa_max NUMERIC DEFAULT 30,
  tajweed_score NUMERIC DEFAULT 0,
  tajweed_max NUMERIC DEFAULT 30,
  total_score NUMERIC DEFAULT 0,
  total_max NUMERIC DEFAULT 100,
  grade TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. تفعيل سياسات الأمان (Row Level Security)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous full access" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous full access" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous full access" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous full access" ON exam_records FOR ALL USING (true) WITH CHECK (true);
`;

/**
 * Async Supabase Sync Helpers with graceful local fallback
 */
export async function syncStudentsToSupabase(students: Student[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const formatted = students.map((s) => ({
      id: s.id,
      first_name: s.firstName,
      last_name: s.lastName,
      group: s.group || 'فوج حفظ الستين',
      hizb_progress: s.hizbProgress || 'الحزب 1',
      phone: s.phone || null,
      email: s.email || null,
      avatar_color: s.avatarColor || 'bg-emerald-600'
    }));

    const { error } = await client.from('students').upsert(formatted, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase sync students error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync students to Supabase:', err);
    return false;
  }
}

export async function syncSessionsToSupabase(sessions: Session[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const formatted = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      start_time: s.startTime,
      end_time: s.endTime,
      room: s.room || null,
      teacher: s.teacher || null,
      is_closed: !!s.isClosed
    }));

    const { error } = await client.from('sessions').upsert(formatted, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase sync sessions error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync sessions to Supabase:', err);
    return false;
  }
}

export async function syncRecordsToSupabase(records: AttendanceRecord[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const formatted = records.map((r) => ({
      id: r.id,
      student_id: r.studentId,
      student_name: r.studentName,
      session_id: r.sessionId,
      session_title: r.sessionTitle,
      session_date: r.sessionDate,
      status: r.status,
      entry_timestamp: r.entryTimestamp || null,
      attendance_rate: r.attendanceRate,
      recitation: String(r.recitation),
      oral_participation: String(r.oralParticipation),
      notes: r.notes || null
    }));

    const { error } = await client.from('attendance_records').upsert(formatted, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase sync records error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync records to Supabase:', err);
    return false;
  }
}

export async function syncExamsToSupabase(exams: ExamRecord[]): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const formatted = exams.map((e) => ({
      id: e.id,
      student_id: e.studentId,
      student_name: e.studentName,
      group: e.group || null,
      exam_date: e.examDate,
      juz_or_portion: e.juzOrPortion,
      examiner_name: e.examinerName || null,
      hifz_score: e.breakdown.hifzScore,
      hifz_max: e.breakdown.hifzMax,
      tilawa_score: e.breakdown.tilawaScore,
      tilawa_max: e.breakdown.tilawaMax,
      tajweed_score: e.breakdown.tajweedScore,
      tajweed_max: e.breakdown.tajweedMax,
      total_score: e.totalScore,
      total_max: e.totalMax,
      grade: e.grade || null,
      notes: e.notes || null
    }));

    const { error } = await client.from('exam_records').upsert(formatted, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase sync exams error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync exams to Supabase:', err);
    return false;
  }
}
