import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Sparkles,
  ChevronDown,
  LogOut,
  UserCheck,
  Database,
  UserPlus,
  MoreVertical,
  Check,
  Smartphone,
  Download,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Session, AppUser, Branch } from '../types';
import { isSupabaseConfigured } from '../utils/supabase';
import { getActiveProfiles } from '../utils/auth';

export type NavTab = 'checkin' | 'recitation_queue' | 'students';

interface HeaderProps {
  activeSession: Session | null;
  sessions: Session[];
  onSelectSession: (sessionId: string) => void;
  onOpenNewSession?: () => void;
  onOpenNewSessionModal?: () => void;
  onOpenReportModal?: () => void;
  onOpenMonthlyReportModal?: () => void;
  onOpenDatabaseModal: () => void;
  onOpenApkModal?: () => void;
  onOpenAdminConfig?: () => void;
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
  branches?: Branch[];
  selectedBranchId?: string;
  onSelectBranch?: (branchId: string) => void;
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
  onOpenApkModal,
  onOpenAdminConfig,
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
  institutionName = 'مجموعة حفظ الستين',
  branches = [],
  selectedBranchId = 'ALL',
  onSelectBranch
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);

  const profilesList = activeProfiles || getActiveProfiles();

  const handleTabSwitch = (tab: NavTab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else if (onTabChange) {
      onTabChange(tab);
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
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 text-slate-100 shadow-xl select-none">
      {/* Android Top App Bar */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2.5">
          
          {/* Android Brand & App Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/30 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                  منظومة حفظ الستين
                </h1>
                <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Android
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {institutionName}
              </p>
            </div>
          </div>

          {/* Minimal Controls Row: Branch Filter + Session Picker + New Session + Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Branch Selector for ADMIN (Filiale Filter) */}
            {currentUser?.role === 'ADMIN' && branches.length > 0 && onSelectBranch && (
              <div className="relative">
                <select
                  value={selectedBranchId}
                  onChange={(e) => onSelectBranch(e.target.value)}
                  className="bg-slate-950/90 border border-emerald-500/40 text-[11px] sm:text-xs font-bold rounded-xl px-2 py-1.5 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[130px] sm:max-w-[170px] truncate"
                  title="تصفية حسب الفرع (المدير العام)"
                >
                  <option value="ALL">🏢 كل الفروع (عام)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Branch Badge for Branch Admin & Teachers */}
            {currentUser?.role !== 'ADMIN' && currentUser?.branchName && (
              <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-teal-950/80 text-teal-300 border border-teal-500/30">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span className="truncate max-w-[140px]">{currentUser.branchName}</span>
              </div>
            )}

            {/* Session Selector Chip */}
            <div className="relative">
              <select
                value={activeSession?.id || ''}
                onChange={(e) => onSelectSession(e.target.value)}
                className="bg-slate-950/90 border border-slate-700/80 text-[11px] sm:text-xs font-semibold rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[130px] sm:max-w-[200px] truncate"
              >
                {sessions.map((sess) => (
                  <option key={sess.id} value={sess.id} className="bg-slate-900 text-slate-100">
                    {sess.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin General Config Button (Branches, Teachers, Accounts) */}
            {currentUser?.role === 'ADMIN' && onOpenAdminConfig && (
              <button
                onClick={onOpenAdminConfig}
                title="التهيئة العامة وإدارة المنظومة (الفروع والأساتذة والحسابات)"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 text-xs font-bold transition-all shadow-md shadow-emerald-950/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">التهيئة العامة (Admin)</span>
              </button>
            )}

            {/* Quick Add Session Button (+) */}
            <button
              onClick={handleOpenNewSession}
              title="إضافة حلقة جديدة"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-950/40 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">حلقة جديدة</span>
            </button>

            {/* Android Overflow Menu (3-dots): Keep ONLY export apk and export db */}
            <div className="relative">
              <button
                onClick={() => {
                  setOverflowMenuOpen(!overflowMenuOpen);
                  setProfileDropdownOpen(false);
                }}
                title="المزيد من الخيارات"
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {overflowMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 text-slate-200 text-xs animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800">
                    خيارات التطبيق والبيانات
                  </div>

                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      if (onOpenApkModal) onOpenApkModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-right hover:bg-slate-800 text-emerald-300 font-semibold transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>تثبيت تطبيق أندرويد (APK)</span>
                  </button>

                  <button
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      onOpenDatabaseModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-right hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-teal-400" />
                      <span>قاعدة بيانات Supabase</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  </button>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setOverflowMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer"
                >
                  <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center text-[11px] font-bold shadow-xs`}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                </button>

                {/* Profile menu dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-slate-200 animate-fade-in">
                    <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                      <span>الحسابات المسجلة</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
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
                                ? 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-bold'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-md ${prof.avatarColor || 'bg-slate-700'} text-white flex items-center justify-center text-[10px] font-bold`}>
                                {prof.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-[11px] leading-none">{prof.name}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{prof.roleLabel || prof.role}</div>
                              </div>
                            </div>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                الحالي
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      {currentUser?.role === 'ADMIN' && onOpenAdminConfig && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAdminConfig();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-right hover:bg-slate-800 text-emerald-400 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>التهيئة العامة (الفروع والأساتذة)</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleAddAccount();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-right hover:bg-slate-800 text-emerald-400 text-xs font-medium transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>تسجيل بحساب آخر</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-right hover:bg-rose-950/40 text-rose-400 text-xs font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Navigation Tabs Bar (Desktop view) */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <nav className="flex space-x-reverse space-x-1 sm:space-x-2 py-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabSwitch('checkin')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isTabActive('checkin')
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>تسجيل الحضور</span>
          </button>

          <button
            onClick={() => handleTabSwitch('recitation_queue')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isTabActive('recitation_queue')
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>قوائم وتناوب (تلاوة وتكرار)</span>
          </button>

          {/* 3rd Tab: Only for ADMIN and BRANCH_ADMIN, hidden for TEACHER */}
          {currentUser?.role !== 'TEACHER' && (
            <button
              onClick={() => handleTabSwitch('students')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isTabActive('students')
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>قائمة الحفاظ والطلاب</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
