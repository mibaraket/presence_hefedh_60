import React, { useState } from 'react';
import {
  Lock,
  User,
  LogIn,
  KeyRound,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { verifyLogin, getStoredAccounts, createNewAccount } from '../utils/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Registration Form
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('TEACHER');
  const [regPassword, setRegPassword] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  const accounts = getStoredAccounts();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('يرجى كتابة اسم المستخدم');
      return;
    }

    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    const result = verifyLogin(username, password);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMessage(result.message || 'بيانات الدخول غير صحيحة');
    }
  };

  const handleQuickLogin = (accUsername: string, defaultPass: string) => {
    const result = verifyLogin(accUsername, defaultPass);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setRegSuccessMessage('');

    if (!regUsername.trim() || !regName.trim() || !regPassword) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage('كلمة المرور يجب أن لا تقل عن 4 رموز');
      return;
    }

    const res = createNewAccount(regUsername, regName, regRole, regPassword);
    if (res.success) {
      setRegSuccessMessage('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
      setUsername(regUsername);
      setPassword(regPassword);
      setTimeout(() => {
        setActiveTab('login');
        setRegSuccessMessage('');
      }, 1200);
    } else {
      setErrorMessage(res.message || 'تعذر إنشاء الحساب');
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-md">
        {/* Top Logo / Quranic Identity */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-950/50 mb-3">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            مجموعة حفظ الستين
          </h1>
          <p className="text-sm text-emerald-300/80 mt-1">
            منظومة إدارة ومتابعة حلقات تحفيظ القرآن الكريم
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-700/80 bg-slate-900/40">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>

          <div className="p-6">
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {regSuccessMessage && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{regSuccessMessage}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم المستخدم (Username)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: admin أو cheikh1"
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>دخول إلى المنظومة</span>
                </button>

                {/* Fast One-Click Demo Profiles */}
                <div className="pt-4 mt-4 border-t border-slate-700/60">
                  <div className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
                    <span>حسابات سريعة جاهزة للدخول:</span>
                    <span className="text-[10px] text-emerald-400 font-normal">نقرة واحدة للتجربة</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleQuickLogin(acc.username, acc.passwordHash)}
                        className="w-full p-2.5 bg-slate-900/50 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl text-right flex items-center justify-between group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg ${
                              acc.role === 'ADMIN' ? 'bg-emerald-600' : 'bg-amber-600'
                            } text-white flex items-center justify-center font-bold text-xs shadow`}
                          >
                            {acc.role === 'ADMIN' ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : (
                              <GraduationCap className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                              {acc.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {acc.roleLabel} • اسم المستخدم: <span className="font-mono text-emerald-400">{acc.username}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400 opacity-80 group-hover:opacity-100 pl-1">
                          دخول ←
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الاسم الكامل / الصفة
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="مثال: الشيخ عبد الرحمن البشير"
                    className="w-full px-3.5 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم المستخدم (بالأحرف اللاتينية)
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="مثال: cheikh_ahmed"
                    className="w-full px-3.5 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الدور / الصلاحية
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('TEACHER')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        regRole === 'TEACHER'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5 text-amber-400" />
                      <span>شيخ محفظ / أستاذ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('ADMIN')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        regRole === 'ADMIN'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span>إشراف وإدارة كاملة</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>تأكيد إنشاء الحساب</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-4 text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>نظام المصادقة المحلي الآمن • مجموعة حفظ الستين</span>
        </div>
      </div>
    </div>
  );
};
