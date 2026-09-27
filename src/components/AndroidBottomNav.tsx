import React from 'react';
import { UserCheck, Clock, Users } from 'lucide-react';
import { NavTab } from './Header';
import { UserRole } from '../types';

interface AndroidBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  studentsCount: number;
  userRole?: UserRole;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onSelectTab,
  studentsCount,
  userRole
}) => {
  const allTabs = [
    {
      id: 'checkin' as NavTab,
      label: 'تسجيل الحضور',
      icon: UserCheck
    },
    {
      id: 'recitation_queue' as NavTab,
      label: 'قوائم التسميع',
      icon: Clock
    },
    {
      id: 'students' as NavTab,
      label: 'قائمة الحفاظ',
      icon: Users,
      badge: studentsCount > 0 ? String(studentsCount) : undefined,
      hidden: userRole === 'TEACHER'
    }
  ];

  const tabs = allTabs.filter(t => !t.hidden);

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 shadow-2xl flex items-center justify-around select-none pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-2xl cursor-pointer ${
              isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`relative px-4 py-1 rounded-full transition-all ${
              isActive ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-transparent'
            }`}>
              <Icon className="w-5 h-5" />
              {tab.badge && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded-full border border-slate-900">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
