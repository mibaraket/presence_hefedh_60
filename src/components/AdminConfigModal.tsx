import React, { useState } from 'react';
import { 
  Building2, 
  GraduationCap, 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  KeyRound, 
  X, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Phone,
  MapPin,
  Sparkles,
  ArrowRightLeft,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { Branch, TeacherEntity, AppUser, UserRole } from '../types';
import { 
  getStoredAccounts, 
  createNewAccount, 
  updateUserPassword, 
  deleteStoredAccount, 
  assignUserToBranch,
  updateUserRoleAndBranch,
  StoredAccount,
  getRoleLabel 
} from '../utils/auth';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  teachers: TeacherEntity[];
  onUpdateBranches: (branches: Branch[]) => void;
  onUpdateTeachers: (teachers: TeacherEntity[]) => void;
  currentUser: AppUser | null;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  onClose,
  branches,
  teachers,
  onUpdateBranches,
  onUpdateTeachers,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'branches' | 'teachers' | 'accounts'>('branches');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Accounts state
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => getStoredAccounts());

  // Form states for Branch
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [branchPhone, setBranchPhone] = useState('');

  // Form states for Teacher
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherBranchId, setTeacherBranchId] = useState(branches[0]?.id || '');

  // Form states for Account Creation
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('BRANCH_ADMIN');
  const [newPassword, setNewPassword] = useState('123456');
  const [newAccountBranchId, setNewAccountBranchId] = useState(branches[0]?.id || '');

  // Edit Account Assignment (Role & Branch) Modal
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('BRANCH_ADMIN');
  const [editBranchId, setEditBranchId] = useState('');

  // Change password modal
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setFeedbackMessage(null);
    setTimeout(() => setErrorMessage(null), 3500);
  };

  const refreshAccounts = () => {
    setAccounts(getStoredAccounts());
  };

  // Branch Handlers
  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) {
      showError('يرجى إدخال اسم الفرع');
      return;
    }

    const newBranch: Branch = {
      id: `branch-${Date.now()}`,
      name: branchName.trim(),
      location: branchLocation.trim() || undefined,
      phone: branchPhone.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const updated = [...branches, newBranch];
    onUpdateBranches(updated);
    setBranchName('');
    setBranchLocation('');
    setBranchPhone('');
    setIsAddingBranch(false);
    showFeedback(`تمت إضافة فرع "${newBranch.name}" بنجاح`);
  };

  const handleDeleteBranch = (branchId: string) => {
    if (branches.length <= 1) {
      showError('لا يمكن حذف الفرع الوحيد في المنظومة');
      return;
    }
    const updated = branches.filter(b => b.id !== branchId);
    onUpdateBranches(updated);
    showFeedback('تم حذف الفرع');
  };

  // Direct Branch Admin Assignment from Branch Tab
  const handleAssignBranchAdminToBranch = (branchId: string, accountId: string) => {
    const targetBranch = branches.find(b => b.id === branchId);
    if (!targetBranch) return;

    if (!accountId) {
      // Unassign existing manager
      const existing = accounts.find(a => a.branchId === branchId && a.role === 'BRANCH_ADMIN');
      if (existing) {
        assignUserToBranch(existing.id, undefined, undefined);
        refreshAccounts();
        showFeedback(`تم إلغاء تعيين مسؤول فرع "${targetBranch.name}"`);
      }
      return;
    }

    const ok = assignUserToBranch(accountId, targetBranch.id, targetBranch.name);
    if (ok) {
      refreshAccounts();
      const user = accounts.find(a => a.id === accountId);
      showFeedback(`تم تعيين "${user?.name || accountId}" كمسؤول لفرع "${targetBranch.name}" بنجاح`);
    }
  };

  // Teacher Handlers
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) {
      showError('يرجى إدخال اسم الأستاذ / الشيخ');
      return;
    }

    const assignedBranch = branches.find(b => b.id === teacherBranchId);

    const newTeacher: TeacherEntity = {
      id: `teacher-${Date.now()}`,
      name: teacherName.trim(),
      phone: teacherPhone.trim() || undefined,
      branchId: teacherBranchId || undefined,
      branchName: assignedBranch ? assignedBranch.name : undefined
    };

    const updated = [...teachers, newTeacher];
    onUpdateTeachers(updated);
    setTeacherName('');
    setTeacherPhone('');
    setIsAddingTeacher(false);
    showFeedback('تمت إضافة الأستاذ بنجاح');
  };

  const handleUpdateTeacherBranch = (teacherId: string, newBranchId: string) => {
    const assignedBranch = branches.find(b => b.id === newBranchId);
    const updated = teachers.map(t => {
      if (t.id === teacherId) {
        return {
          ...t,
          branchId: newBranchId || undefined,
          branchName: assignedBranch ? assignedBranch.name : undefined
        };
      }
      return t;
    });
    onUpdateTeachers(updated);
    showFeedback(`تم تحديث فرع الأستاذ إلى: ${assignedBranch ? assignedBranch.name : 'عام'}`);
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const updated = teachers.filter(t => t.id !== teacherId);
    onUpdateTeachers(updated);
    showFeedback('تم حذف الأستاذ من القائمة');
  };

  // Account Handlers
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newPassword) {
      showError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const assignedBranch = branches.find(b => b.id === newAccountBranchId);
    const branchNameVal = assignedBranch?.name;

    const res = createNewAccount(
      newUsername,
      newName,
      newRole,
      newPassword,
      newRole !== 'ADMIN' ? newAccountBranchId : undefined,
      newRole !== 'ADMIN' ? branchNameVal : undefined
    );

    if (res.success) {
      refreshAccounts();
      setNewUsername('');
      setNewName('');
      setNewPassword('123456');
      setIsAddingAccount(false);
      showFeedback(`تم إنشاء حساب "${newName}" وتعيين دوره وفرعه بنجاح`);
    } else {
      showError(res.message || 'تعذر إنشاء الحساب');
    }
  };

  // Open Edit Modal for an Account
  const handleOpenEditAccount = (acc: StoredAccount) => {
    setEditingAccountId(acc.id);
    setEditName(acc.name);
    setEditRole(acc.role);
    setEditBranchId(acc.branchId || branches[0]?.id || '');
  };

  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccountId) return;

    const assignedBranch = branches.find(b => b.id === editBranchId);
    const ok = updateUserRoleAndBranch(editingAccountId, {
      name: editName,
      role: editRole,
      branchId: editRole !== 'ADMIN' ? editBranchId : undefined,
      branchName: editRole !== 'ADMIN' ? assignedBranch?.name : undefined
    });

    if (ok) {
      refreshAccounts();
      setEditingAccountId(null);
      showFeedback('تم حفظ تعديل الصلاحيات وتعيين الفرع بنجاح');
    } else {
      showError('حدث خطأ أثناء حفظ التعديلات');
    }
  };

  // Direct fast branch selector for any account
  const handleDirectAssignBranch = (userId: string, newBranchId: string) => {
    const assignedBranch = branches.find(b => b.id === newBranchId);
    const ok = assignUserToBranch(userId, newBranchId || undefined, assignedBranch?.name);
    if (ok) {
      refreshAccounts();
      showFeedback(`تم تعيين الفرع بنجاح: ${assignedBranch ? assignedBranch.name : 'بدون فرع'}`);
    }
  };

  const handleChangePassword = (userId: string) => {
    if (!newPasswordVal.trim()) {
      showError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    const ok = updateUserPassword(userId, newPasswordVal.trim());
    if (ok) {
      refreshAccounts();
      setEditingPasswordUserId(null);
      setNewPasswordVal('');
      showFeedback('تم تعديل كلمة المرور بنجاح');
    }
  };

  const handleDeleteAccount = (userId: string, username: string) => {
    if (username === 'admin') {
      showError('لا يمكن حذف الحساب الإداري الرئيسي');
      return;
    }
    if (userId === currentUser?.id) {
      showError('لا يمكنك حذف الحساب النشط حالياً');
      return;
    }
    if (deleteStoredAccount(userId)) {
      refreshAccounts();
      showFeedback('تم حذف الحساب');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 select-none" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-fadeIn">
        
        {/* Header */}
        <div className="bg-slate-950/70 p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                التهيئة العامة وإدارة المنظومة (Admin Général)
              </h2>
              <p className="text-xs text-slate-400">
                إدارة وتعيين الفروع (Filiales)، قائمة الأساتذة، وتخصيص الحسابات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>قائمة الفروع والتعيينات ({branches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>قائمة الأساتذة والشيوخ ({teachers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة الحسابات وتعيين الفروع ({accounts.length})</span>
          </button>
        </div>

        {/* Notifications */}
        {feedbackMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-bold animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">

          {/* TAB 1: BRANCHES & DIRECT BRANCH ADMIN ASSIGNMENT */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>فروع وملحقات مدرسة التحفيظ</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-normal">
                      تعيين مسؤولي الفروع مباشرة
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    يمكن للمدير العام إضافة فروع جديدة وتعيين مسؤول كل فرع من القائمة مباشرة
                  </p>
                </div>
                {!isAddingBranch && (
                  <button
                    onClick={() => setIsAddingBranch(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة فرع جديد</span>
                  </button>
                )}
              </div>

              {isAddingBranch && (
                <form onSubmit={handleAddBranch} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-emerald-400">إضافة فرع أو ملحقة جديدة:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">اسم الفرع / المقر *</label>
                      <input
                        type="text"
                        required
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="مثال: فرع سوسة - القاعة الكبرى"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">الموقع / العنوان</label>
                      <input
                        type="text"
                        value={branchLocation}
                        onChange={(e) => setBranchLocation(e.target.value)}
                        placeholder="مثال: جامع الإمام نافع"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">الهاتف</label>
                      <input
                        type="tel"
                        value={branchPhone}
                        onChange={(e) => setBranchPhone(e.target.value)}
                        placeholder="مثال: 0555 12 34 56"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingBranch(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      حفظ الفرع
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-3">
                {branches.map((b) => {
                  // Find assigned manager
                  const branchManager = accounts.find(a => a.branchId === b.id && a.role === 'BRANCH_ADMIN');
                  // Find teachers in this branch
                  const branchTeachers = teachers.filter(t => t.branchId === b.id);

                  return (
                    <div 
                      key={b.id} 
                      className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0 mt-0.5">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{b.name}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                              {branchTeachers.length} شيوخ
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                            {b.location && <span><MapPin className="w-3 h-3 inline text-slate-500" /> {b.location}</span>}
                            {b.phone && <span>• <Phone className="w-3 h-3 inline text-slate-500" /> {b.phone}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Branch Manager Assignment Dropdown */}
                      <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-teal-400" />
                            <span>المسؤول المعيّن (Admin Filiale):</span>
                          </div>
                          <select
                            value={branchManager?.id || ''}
                            onChange={(e) => handleAssignBranchAdminToBranch(b.id, e.target.value)}
                            className="mt-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-teal-300 font-semibold focus:outline-none focus:border-teal-500 cursor-pointer min-w-[180px]"
                          >
                            <option value="">-- بدون مسؤول معين --</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.username}) {acc.branchId === b.id ? '✓ الحالي' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {branches.length > 1 && (
                          <button
                            onClick={() => handleDeleteBranch(b.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0 mt-3"
                            title="حذف الفرع"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TEACHERS & BRANCH ASSIGNMENT */}
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">قائمة الأساتذة والمشرفين (الشيوخ)</h3>
                  <p className="text-xs text-slate-400">
                    يمكن للمدير تعيين وإعادة تخصيص الفرع لكل أستاذ في أي وقت
                  </p>
                </div>
                {!isAddingTeacher && (
                  <button
                    onClick={() => setIsAddingTeacher(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة أستاذ جديد</span>
                  </button>
                )}
              </div>

              {isAddingTeacher && (
                <form onSubmit={handleAddTeacher} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-emerald-400">إضافة أستاذ / شيخ جديد:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">الاسم الكامل واللقب *</label>
                      <input
                        type="text"
                        required
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="مثال: الشيخ عبد الرحمن البشير"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">تعيين الفرع التابع له</label>
                      <select
                        value={teacherBranchId}
                        onChange={(e) => setTeacherBranchId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">رقم الهاتف</label>
                      <input
                        type="tel"
                        value={teacherPhone}
                        onChange={(e) => setTeacherPhone(e.target.value)}
                        placeholder="مثال: 0661 12 34 56"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTeacher(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      حفظ الأستاذ
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-2.5">
                {teachers.map((t) => (
                  <div 
                    key={t.id} 
                    className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-950 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{t.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {t.phone ? `هاتف: ${t.phone}` : 'بدون هاتف'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Change Branch on Teacher */}
                      <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-semibold">الفرع:</span>
                        <select
                          value={t.branchId || ''}
                          onChange={(e) => handleUpdateTeacherBranch(t.id, e.target.value)}
                          className="bg-transparent text-xs text-emerald-400 font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="" className="bg-slate-900 text-slate-300">عام (بدون فرع محدد)</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleDeleteTeacher(t.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="حذف من القائمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNTS & PROFILES (ADMIN, BRANCH_ADMIN, TEACHER) */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>إدارة الحسابات وتعيين الفروع والصلاحيات</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      تحكم كامل للإدارة العامة
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    المدير العام يخصص دور كل حساب ويعيّن الفرع (Filiale) التابع له بمرونة تامة
                  </p>
                </div>
                {!isAddingAccount && !editingAccountId && (
                  <button
                    onClick={() => setIsAddingAccount(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء حساب جديد</span>
                  </button>
                )}
              </div>

              {/* Edit Account Modal / Box */}
              {editingAccountId && (
                <form onSubmit={handleSaveEditAccount} className="bg-slate-950/90 border border-emerald-500/50 p-4 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4" />
                    <span>تعديل الصلاحية والفرع للحساب:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">الاسم الكامل / الصفة</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">الصلاحية / الدور</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="ADMIN">مدير عام كامل الصلاحيات (Admin Général)</option>
                        <option value="BRANCH_ADMIN">مسؤول فرع (Admin Filiale - إدارة فرعه فقط)</option>
                        <option value="TEACHER">أستاذ مقرئ (Enseignant - أول وثاني تبويب فقط)</option>
                      </select>
                    </div>
                    {editRole !== 'ADMIN' && (
                      <div>
                        <label className="text-[11px] font-bold text-emerald-400 block mb-1">الفرع المعين للحساب *</label>
                        <select
                          value={editBranchId}
                          onChange={(e) => setEditBranchId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-emerald-500/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingAccountId(null)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      حفظ التعيين الجديد
                    </button>
                  </div>
                </form>
              )}

              {/* Add Account Form */}
              {isAddingAccount && !editingAccountId && (
                <form onSubmit={handleCreateAccount} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-emerald-400">إنشاء حساب مستخدم جديد:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">الاسم الكامل / الصفة *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="مثال: مسؤول فرع الهدى"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">اسم المستخدم (Username) *</label>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="مثال: admin_huda"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">نوع الصلاحية / الدور *</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="BRANCH_ADMIN">مدير فرع (Admin Filiale - إدارة بيانات فرع محدد)</option>
                        <option value="TEACHER">أستاذ مقرئ (Enseignant - فقط أول وثاني تبويب)</option>
                        <option value="ADMIN">مدير عام كامل الصلاحيات (Admin Général)</option>
                      </select>
                    </div>
                    {newRole !== 'ADMIN' && (
                      <div>
                        <label className="text-[11px] font-bold text-emerald-400 block mb-1">الفرع المخصص للحساب *</label>
                        <select
                          value={newAccountBranchId}
                          onChange={(e) => setNewAccountBranchId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">كلمة المرور *</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAccount(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      إنشاء وتأكيد الحساب
                    </button>
                  </div>
                </form>
              )}

              {/* Edit Password Modal */}
              {editingPasswordUserId && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-700 space-y-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    <span>تغيير كلمة المرور للحساب:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      placeholder="أدخل كلمة المرور الجديدة (مثال: 123456)"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleChangePassword(editingPasswordUserId)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      حفظ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPasswordUserId(null);
                        setNewPasswordVal('');
                      }}
                      className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Accounts List with Direct Branch Affectation */}
              <div className="space-y-3">
                {accounts.map((acc) => {
                  const isCurrent = acc.id === currentUser?.id;
                  const isRoleAdmin = acc.role === 'ADMIN';

                  return (
                    <div
                      key={acc.id}
                      className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${
                            acc.role === 'ADMIN' 
                              ? 'bg-emerald-600' 
                              : (acc.role === 'BRANCH_ADMIN' ? 'bg-teal-600' : 'bg-amber-600')
                          } text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0`}
                        >
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{acc.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              @{acc.username}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                (حسابك الحالي)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-slate-300">
                              {acc.role === 'ADMIN' ? 'مدير عام النظام' : (acc.role === 'BRANCH_ADMIN' ? 'مسؤول فرع' : 'أستاذ مقرئ')}
                            </span>
                            {!isRoleAdmin && (
                              <span className="text-teal-400 font-bold bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/20">
                                الفرع الحالي: {acc.branchName || 'غير مخصص'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Branch Affectation Dropdown & Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        
                        {/* Direct Branch Assignment dropdown for non-admins */}
                        {!isRoleAdmin && (
                          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                            <span className="text-[10px] text-slate-400 font-semibold">تعيين الفرع:</span>
                            <select
                              value={acc.branchId || ''}
                              onChange={(e) => handleDirectAssignBranch(acc.id, e.target.value)}
                              className="bg-transparent text-xs text-teal-300 font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="" className="bg-slate-900 text-slate-400">-- بدون فرع --</option>
                              {branches.map(b => (
                                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Edit Role & Branch Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditAccount(acc)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="تعديل الصلاحية والفرع"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تعديل التعيين</span>
                        </button>

                        {/* Edit Password Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPasswordUserId(acc.id);
                            setNewPasswordVal('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          title="تعديل كلمة المرور"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>الرمز</span>
                        </button>

                        {acc.username !== 'admin' && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc.id, acc.username)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>التغييرات والتعيينات يتم حفظها وتطبيقها تلقائياً على كل الحسابات</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
