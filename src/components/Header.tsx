import React, { useState } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Download, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Sparkles,
  Award,
  ChevronDown,
  User,
  LogOut,
  Shield,
  UserCheck,
  Database,
  UserPlus,
  Layers
} from 'lucide-react';
import { Session, AppUser } from '../types';
import { isSupabaseConfigured } from '../utils/supabase';
import { getActiveProfiles } from '../utils/auth';

export type NavTab = 'checkin' | 'recitation_queue' | 'exams' | 'table' | 'students';

interface HeaderProps {
  activeSession: Session | null;
  sessions: Session[];
  onSelectSession: (sessionId: string) => void;
  onOpenNewSession?: () => void;
  onOpenNewSessionModal?: () => void;
  onOpenReportModal?: () => void;
  onOpenMonthlyReportModal?: () => void;
  onOpenDatabaseModal: () => void;
  onExportExcel: () => void;
  currentUser: AppUser | null;
  activeProfiles?: AppUser[];
  onSwitchProfile: (userIdOrUsername: string) => void;
  onAddProfile?: () => void;
  onAddAnotherAccount?: () => void;
  onLogout: () => void;
  activeTab: NavTab | string;
  setActiveTab?: (tab: NavTab) => void;
  onTabChange?: (tab: any) => void;
  institutionName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeSession,
  sessions = [],
  onSelectSession,
  onOpenNewSession,
  onOpenNewSessionModal,
  onOpenReportModal,
  onOpenMonthlyReportModal,
  onOpenDatabaseModal,
  onExportExcel,
  currentUser,
  activeProfiles,
  onSwitchProfile,
  onAddProfile,
  onAddAnotherAccount,
  onLogout,
  activeTab,
  setActiveTab,
  onTabChange,
  institutionName = 'مجموعة حفظ الستين'
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const profilesList = activeProfiles || getActiveProfiles();

  const handleTabSwitch = (tab: NavTab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else if (onTabChange) {
      onTabChange(tab === 'recitation_queue' ? 'queue' : tab);
    }
  };

  const handleOpenNewSession = () => {
    if (onOpenNewSession) onOpenNewSession();
    else if (onOpenNewSessionModal) onOpenNewSessionModal();
  };

  const handleOpenReport = () => {
    if (onOpenReportModal) onOpenReportModal();
    else if (onOpenMonthlyReportModal) onOpenMonthlyReportModal();
  };

  const handleAddAccount = () => {
    if (onAddProfile) onAddProfile();
    else if (onAddAnotherAccount) onAddAnotherAccount();
  };

  const isTabActive = (tab: NavTab) => {
    if (activeTab === tab) return true;
    if (tab === 'recitation_queue' && activeTab === 'queue') return true;
    return false;
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 text-slate-100 shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>منظومة حفظ الستين</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  الإصدار الجامع
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                متابعة الحضور والتسميع والمشاركات الشفوية
              </p>
            </div>
          </div>

          {/* Controls, Database Status, Multi-profile */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* Database indicator */}
            <button
              onClick={onOpenDatabaseModal}
              title="حالة قاعدة البيانات Supabase"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition-colors ${
                isSupabaseConfigured
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Supabase</span>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>

            {/* Session Selector */}
            <div className="relative">
              <select
                value={activeSession?.id || ''}
                onChange={(e) => onSelectSession(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                {sessions.map((sess) => (
                  <option key={sess.id} value={sess.id} className="bg-slate-900 text-slate-100">
                    {sess.title} ({sess.date})
                  </option>
                ))}
              </select>
            </div>

            {/* New Session Button */}
            <button
              onClick={handleOpenNewSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-950/30 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">حلقة جديدة</span>
            </button>

            {/* Excel Export */}
            <button
              onClick={onExportExcel}
              title="تصدير السجل إلى Excel"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-medium transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden md:inline">إكسيل</span>
            </button>

            {/* PDF Report */}
            <button
              onClick={handleOpenReport}
              title="استخراج التقرير الشهري (PDF)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span className="hidden md:inline">تقرير PDF</span>
            </button>

            {/* Presentation & Reports */}
            <a
              href="/reports/presentation.html"
              target="_blank"
              rel="noopener noreferrer"
              title="عرض تقديمي PowerPoint والتقارير التقنية"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-400 text-xs font-medium transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">العرض والتقارير</span>
            </a>

            {/* Multi-profile / User Profile Menu */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 transition-all text-right cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded-lg ${currentUser.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center text-[10px] font-bold`}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-[11px] font-bold text-slate-100 max-w-[100px] truncate leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[9px] text-emerald-400">
                      {currentUser.role === 'ADMIN' ? 'مشرف عام' : 'مقرئ'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Multi-profile dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-slate-200">
                    <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                      <span>الحسابات النشطة (Multi-session)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        {profilesList.length}
                      </span>
                    </div>

                    <div className="py-1 space-y-1">
                      {profilesList.map((prof) => {
                        const isCurrent = prof.id === currentUser.id || prof.username === currentUser.username;
                        return (
                          <button
                            key={prof.id || prof.username}
                            onClick={() => {
                              onSwitchProfile(prof.username || prof.id);
                              setProfileDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-right transition-colors text-xs ${
                              isCurrent
                                ? 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-300'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-md ${prof.avatarColor || 'bg-slate-700'} text-white flex items-center justify-center text-[10px] font-bold`}>
                                {prof.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-[11px] leading-none">{prof.name}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{prof.roleLabel || prof.role}</div>
                              </div>
                            </div>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                الحالي
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleAddAccount();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-right hover:bg-slate-800 text-emerald-400 text-xs font-medium transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>تسجيل الدخول بحساب آخر</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-right hover:bg-rose-950/40 text-rose-400 text-xs font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج من الحساب الحالي</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-reverse space-x-1 sm:space-x-2 border-t border-slate-800/80 py-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabSwitch('checkin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isTabActive('checkin')
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>تسجيل الحضور والتلاوة</span>
          </button>

          <button
            onClick={() => handleTabSwitch('recitation_queue')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isTabActive('recitation_queue')
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>قوائم وتناوب (تلاوة وتكرار)</span>
          </button>

          <button
            onClick={() => handleTabSwitch('exams')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isTabActive('exams')
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>الاختبارات القرآنية</span>
          </button>

          <button
            onClick={() => handleTabSwitch('table')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isTabActive('table')
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>سجل الحضور الكامل</span>
          </button>

          <button
            onClick={() => handleTabSwitch('students')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isTabActive('students')
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>قائمة الحفاظ والطلاب</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

