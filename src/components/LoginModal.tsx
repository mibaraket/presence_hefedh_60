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
  AlertCircle,
  Building2,
  ArrowRight,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { AppUser } from '../types';
import { verifyLogin, resetDefaultAccounts } from '../utils/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Login Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const performLogin = (u: string, p: string) => {
    setErrorMessage('');
    setInfoMessage('');
    const result = verifyLogin(u, p);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMessage(result.message || 'بيانات الدخول غير صحيحة');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('يرجى كتابة اسم المستخدم');
      return;
    }
    // If password left blank, try username or default 123456
    const passToTry = password || username.trim();
    performLogin(username, passToTry);
  };

  const handleQuickLogin = (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
    performLogin(uname, pass);
  };

  const handleResetAccounts = () => {
    resetDefaultAccounts();
    setInfoMessage('تمت إعادة ضبط الحسابات الافتراضية بنجاح. يمكنك الآن تسجيل الدخول بـ admin أو moualem.');
    setErrorMessage('');
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-slate-100 flex items-center justify-center p-3.5 sm:p-6"
    >
      <div className="w-full max-w-xl">
        {/* Top Logo / Quranic Identity */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-950/50 mb-2.5">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            مجموعة حفظ الستين
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/80 mt-1">
            منظومة إدارة ومتابعة حلقات تحفيظ القرآن الكريم والملحقات
          </p>
        </div>

        {/* Quick 1-Click Login Cards Section */}
        <div className="mb-4">
          <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-between px-1">
            <span>⚡ تسجيل الدخول السريع بنقرة واحدة (الحسابات الرسمية):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Card 1: Admin Général */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', '123456')}
              className="p-3 bg-slate-800/90 hover:bg-slate-750 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl text-right transition-all group shadow-md hover:shadow-emerald-950/50 cursor-pointer active:scale-98"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  admin
                </span>
              </div>
              <div className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                المدير العام
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                صلاحيات كاملة وتعيين الفروع
              </div>
              <div className="mt-2 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span>دخول فوري</span>
                <ArrowRight className="w-3 h-3 rotate-180" />
              </div>
            </button>

            {/* Card 2: Admin Filiale */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin_filliale', '123456')}
              className="p-3 bg-slate-800/90 hover:bg-slate-750 border border-teal-500/40 hover:border-teal-400 rounded-2xl text-right transition-all group shadow-md hover:shadow-teal-950/50 cursor-pointer active:scale-98"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-7 h-7 rounded-xl bg-teal-600/30 text-teal-400 flex items-center justify-center border border-teal-500/40">
                  <Building2 className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-500/30">
                  admin_filliale
                </span>
              </div>
              <div className="text-xs font-extrabold text-white group-hover:text-teal-300 transition-colors">
                مسؤول الفرع
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                إدارة جلسات وبيانات فرعه فقط
              </div>
              <div className="mt-2 text-[10px] text-teal-400 font-semibold flex items-center gap-1">
                <span>دخول فوري</span>
                <ArrowRight className="w-3 h-3 rotate-180" />
              </div>
            </button>

            {/* Card 3: Enseignant */}
            <button
              type="button"
              onClick={() => handleQuickLogin('moualem', '123456')}
              className="p-3 bg-slate-800/90 hover:bg-slate-750 border border-amber-500/40 hover:border-amber-400 rounded-2xl text-right transition-all group shadow-md hover:shadow-amber-950/50 cursor-pointer active:scale-98"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-7 h-7 rounded-xl bg-amber-600/30 text-amber-400 flex items-center justify-center border border-amber-500/40">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                  moualem
                </span>
              </div>
              <div className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">
                أستاذ مقرئ
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                تسجيل الحضور والتلاوة فقط
              </div>
              <div className="mt-2 text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                <span>دخول فوري</span>
                <ArrowRight className="w-3 h-3 rotate-180" />
              </div>
            </button>
          </div>
        </div>

        {/* Main Authentication Card for manual typing */}
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6">
          <div className="text-center mb-4 pb-3 border-b border-slate-700/80">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>تسجيل الدخول المخصص بالاسم وكلمة المرور</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              كلمة المرور الافتراضية لجميع الحسابات: <strong className="text-emerald-400 font-mono">123456</strong> (أو نفس اسم المستخدم)
            </p>
          </div>

          {infoMessage && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{infoMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-2 text-rose-300 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleResetAccounts}
                className="text-[11px] underline text-rose-200 hover:text-white shrink-0 cursor-pointer"
              >
                إعادة ضبط
              </button>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اسم المستخدم (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: admin أو moualem أو admin_filliale"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">
                  كلمة المرور
                </label>
                <span className="text-[10px] text-slate-400">
                  الافتراضية: 123456
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
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
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <LogIn className="w-4 h-4" />
              <span>دخول إلى المنظومة</span>
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>هل تواجه مشكلة في الدخول؟</span>
            <button
              type="button"
              onClick={handleResetAccounts}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الحسابات الافتراضية</span>
            </button>
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
