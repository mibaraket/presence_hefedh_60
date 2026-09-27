import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Layers, 
  Tablet, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface InstallApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallApkModal: React.FC<InstallApkModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('لتثبيت التطبيق على هاتف أندرويد:\n1. افتح قائمة المتصفح (3 نقاط أعلى الشاشة).\n2. اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                تثبيت تطبيق أندرويد (APK)
              </h2>
              <p className="text-[11px] text-slate-400">
                للهواتف الذكية والأجهزة اللوحية (Tablets)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Independence & Offline Badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] leading-relaxed">
            التطبيق <strong>مستقل تماماً</strong> ويعمل دون الحاجة إلى أي حساب Gemini أو واجهة ذكاء اصطناعي خارجية.
          </span>
        </div>

        {/* Action 1: WebAPK Direct Native Install */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Tablet className="w-4 h-4 text-emerald-400" />
              <span>التثبيت المباشر على الهاتف أو التابلت</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">
              موصى به
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            يُثبت التطبيق كبرنامج أصلي على نظام أندرويد (WebAPK) مع أيقونة مستقلة على الشاشة الرئيسية وسرعة استجابة فائقة.
          </p>

          <button
            onClick={handleInstallPwa}
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Smartphone className="w-4 h-4" />
            <span>{isInstalled ? 'التطبيق مثبت بالفعل' : 'تثبيت التطبيق على الشاشة الرئيسية'}</span>
          </button>
        </div>

        {/* Action 2: Direct APK Download */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-teal-400" />
              <span>تحميل ملف APK المباشر</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Hifz60-release.apk
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            حزمة التطبيق الجاهزة للتثبيت المباشر بصيغة <code>.apk</code> للأجهزة اللوحية وهواتف أندرويد.
          </p>

          <a
            href="/Hifz60-release.apk"
            download="Hifz60-release.apk"
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تحميل ملف الحزمة (Download APK)</span>
          </a>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
          <div className="font-bold text-slate-300 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>طريقة التثبيت السريع عبر متصفح الهاتف:</span>
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-400 pr-1">
            <li>انقر على قائمة الخيارات (3 نقاط) في زاوية المتصفح.</li>
            <li>اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
            <li>سيظهر التطبيق كأيقونة مستقلة فوراً في قائمة تطبيقات هاتفك.</li>
          </ol>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
