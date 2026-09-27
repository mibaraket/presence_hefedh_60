import { Branch, TeacherEntity } from '../types';

const BRANCHES_STORAGE_KEY = 'quran_app_branches_v1';
const TEACHERS_STORAGE_KEY = 'quran_app_teachers_v1';

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    name: 'الفرع الرئيسي - العاصمة',
    location: 'المقر المركزي - المسجد الجامع',
    phone: '0550 11 22 33'
  },
  {
    id: 'branch-2',
    name: 'فرع الهدى والفرقان',
    location: 'الملحقة القرآنية الشرقية',
    phone: '0555 44 55 66'
  }
];

export const DEFAULT_TEACHERS: TeacherEntity[] = [
  {
    id: 'teacher-1',
    name: 'الشيخ عبد الرحمن البشير',
    phone: '0661 12 34 56',
    branchId: 'branch-1',
    branchName: 'الفرع الرئيسي - العاصمة'
  },
  {
    id: 'teacher-2',
    name: 'الشيخ مراد الجدلي',
    phone: '0662 23 45 67',
    branchId: 'branch-1',
    branchName: 'الفرع الرئيسي - العاصمة'
  },
  {
    id: 'teacher-3',
    name: 'الشيخ أحمد المنصوري',
    phone: '0663 34 56 78',
    branchId: 'branch-2',
    branchName: 'فرع الهدى والفرقان'
  }
];

export function getStoredBranches(): Branch[] {
  try {
    const raw = localStorage.getItem(BRANCHES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(DEFAULT_BRANCHES));
      return DEFAULT_BRANCHES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BRANCHES;
  } catch {
    return DEFAULT_BRANCHES;
  }
}

export function saveStoredBranches(branches: Branch[]): void {
  try {
    localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches));
  } catch (e) {
    console.error('Failed to save branches:', e);
  }
}

export function getStoredTeachers(): TeacherEntity[] {
  try {
    const raw = localStorage.getItem(TEACHERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(DEFAULT_TEACHERS));
      return DEFAULT_TEACHERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TEACHERS;
  } catch {
    return DEFAULT_TEACHERS;
  }
}

export function saveStoredTeachers(teachers: TeacherEntity[]): void {
  try {
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers));
  } catch (e) {
    console.error('Failed to save teachers:', e);
  }
}
