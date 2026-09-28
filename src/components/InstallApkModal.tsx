import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download,
  CheckCircle2, 
  X, 
  ShieldCheck, 
  HelpCircle,
  Tablet,
  Sparkles,
  ExternalLink,
  FileCheck,
  Loader2,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface InstallApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallApkModal: React.FC<InstallApkModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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
      alert('لتثبيت التطبيق مباشرة وبشكل متوافق 100% مع أحدث أندرويد:\n1. اضغط على قائمة المتصفح (⋮) في أعلى أو أسفل الشاشة في Chrome.\n2. اختر «تثبيت التطبيق» (Install app) أو «إضافة إلى الشاشة الرئيسية».\n3. سيتم تثبيت التطبيق بنظام WebAPK الرسمي فوراً.');
    }
  };

  const handleDownloadApk = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const response = await fetch('/Hifz60-release.apk', {
        headers: {
          'Accept': 'application/vnd.android.package-archive, application/octet-stream'
        }
      });

      if (!response.ok) {
        throw new Error('فشل تنزيل الحزمة');
      }

      const blob = await response.blob();
      const apkBlob = new Blob([blob], { type: 'application/vnd.android.package-archive' });
      const downloadUrl = window.URL.createObjectURL(apkBlob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'Hifz60-release.apk';
      link.setAttribute('type', 'application/vnd.android.package-archive');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 2000);

      setDownloadSuccess(true);
    } catch (err: any) {
      console.error('Download error:', err);
      window.location.href = '/Hifz60-release.apk';
      setDownloadSuccess(true);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                تثبيت التطبيق على أندرويد
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  Android 14 / 15 جاهز
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                متوافق مع أحدث إصدارات Android (API 34/35) والأجهزة اللوحية
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

        {/* Recommended Method 1: WebAPK */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-950 border-2 border-emerald-500/50 space-y-3 relative overflow-hidden shadow-lg shadow-emerald-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white">الطريقة الموصى بها لأحدث أندرويد (بدون أي تحذير)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold">
              تثبيت رسمي 100%
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            في أحدث إصدارات أندرويد (Android 14 و 15)، تمنع حماية Google Play تثبيت ملفات APK غير الموقعة في المتجر. الحل الرسمي المعتمد هو التثبيت عبر المتصفح:
          </p>

          <button
            onClick={handleInstallPwa}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Smartphone className="w-4 h-4" />
            <span>{isInstalled ? 'التطبيق مثبت بالفعل على جهازك' : 'تثبيت فوري على شاشة الهاتف (WebAPK)'}</span>
          </button>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>إذا لم يستجب الزر، اتبع الخطوتين التاليتين في Chrome:</span>
            </div>
            <p className="text-slate-400 text-[11px] pr-2">
              1. اضغط على قائمة النقاط الثلاث <strong className="text-white bg-slate-800 px-1 rounded">⋮</strong> بأعلى متصفح Chrome.
              <br />
              2. اختر <strong className="text-emerald-300">«تثبيت التطبيق» (Install app)</strong>.
            </p>
          </div>
        </div>

        {/* Method 2: Direct APK (Recompiled with Target SDK 34 & D8) */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-bold text-slate-200">الخيار 2: ملف APK المحدّث (Target SDK 34)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              671 KB • Android 14+
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            تمت إعادة بناء الحزمة باستخدام أحدث معالج DEX من Google (D8) وموجهة رسمياً لنظام أندرويد 14.
          </p>

          <button
            onClick={handleDownloadApk}
            disabled={isDownloading}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جارٍ التنزيل...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>تم بدء التحميل بنجاح!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>تحميل ملف APK المحدث (Hifz60-release.apk)</span>
              </>
            )}
          </button>

          {/* Android 14 install instructions */}
          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>إذا ظهر تحذير حماية Google Play على أندرويد 14:</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[10.5px]">
              تمنع بعض إصدارات أندرويد 14 التثبيت من خارج المتجر افتراضياً. لتجاوز ذلك:
              <br />
              اضغط على <strong>«مزيد من التفاصيل» (More details)</strong> ثم اختر <strong>«التثبيت على أي حال» (Install anyway)</strong>.
            </p>
          </div>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
