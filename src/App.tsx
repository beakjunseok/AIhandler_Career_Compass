import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass, GraduationCap, BookOpen, Target, Sparkles, ArrowRight, Loader2,
  School, ChevronRight, Lock, LogOut, History, User as UserIcon, X,
  FileText, Lightbulb, Clipboard, Check, Trash2, ListChecks, MapPin, Building2,
  NotebookPen, Plus, Pencil, BookMarked, Save,
} from 'lucide-react';
import { cn } from './lib/utils';
import { getRecommendations, type Recommendation } from './services/geminiService';
import { getResearchTopics, type ResearchSuggestion } from './services/researchService';
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';
import { CURRICULUM_2022 } from '../api/curriculum';
import { checkKoreanIntegrity, validateRelevance, type FieldSpec } from './lib/validation';

const BRAND = 'Career Compass';

type TabKey = 'major' | 'research';
type HistoryKind = 'major' | 'research' | 'memo';

type MajorFormData = {
  interests: string;
  favoriteSubjects: string;
  careerGoal: string;
  grade: string;
};

type ResearchFormData = {
  targetDepartment: string;
  careerGoal: string;
  grade: string;
  interestTopic: string;
  journalSubject: string;
  journalUnit: string;
  journalSubUnit: string;
  additionalContext: string;
};

type CurriculumUnit = { unit: string; subUnits: string[] };

type MajorHistoryRow = {
  id: string;
  created_at: string;
  user_interests: string;
  user_subjects: string;
  user_career_goal: string;
  user_grade: string;
  result_json: Recommendation[];
};

type ResearchHistoryRow = {
  id: string;
  created_at: string;
  target_department: string;
  career_goal: string;
  user_grade: string;
  interest_topic: string;
  result_json: ResearchSuggestion[];
};

type JournalMemoRow = {
  id: string;
  created_at: string;
  updated_at: string;
  subject: string;
  summary: string;
  books: string | null;
  future_research: string | null;
};

type MemoDraft = {
  subject: string;
  summary: string;
  books: string;
  future_research: string;
};

type UnivItem = {
  schoolName?: string;
  schoolType?: string;
  major?: string;
  region?: string;
  campus?: string;
  totalCount?: string;
  [k: string]: unknown;
};

// --- Header ---

const Header = ({
  activeTab,
  onTabChange,
  onLoginClick,
  onOpenHistory,
  onSignOut,
  onHome,
}: {
  activeTab: TabKey;
  onTabChange: (t: TabKey) => void;
  onLoginClick: () => void;
  onOpenHistory: (kind: HistoryKind) => void;
  onSignOut: () => void;
  onHome: () => void;
}) => {
  const { user, displayName } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'major', label: '학과 추천', icon: <School className="w-4 h-4" /> },
    { key: 'research', label: '생기부 도우미', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 group"
          title="처음 화면으로"
          aria-label="처음 화면으로"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
            <Compass className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">{BRAND}</span>
        </button>

        <nav className="hidden md:flex items-center gap-1 bg-gray-100/70 rounded-full p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-full transition-all',
                activeTab === t.key
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-2 rounded-full"
              title={displayName ?? '계정'}
            >
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[140px] truncate">
                {displayName ?? '계정'}
              </span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-400">로그인됨</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{displayName ?? '계정'}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); onOpenHistory('major'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <School className="w-4 h-4 text-indigo-500" />
                    내 학과 추천 이력
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onOpenHistory('research'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                  >
                    <FileText className="w-4 h-4 text-emerald-500" />
                    내 생기부 주제 이력
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onOpenHistory('memo'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                  >
                    <NotebookPen className="w-4 h-4 text-amber-500" />
                    내 생기부 작성 메모
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onSignOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 border-t border-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all"
          >
            로그인 / 회원가입
          </button>
        )}
      </div>
    </header>
  );
};

// --- Hero ---

const Hero = ({ activeTab }: { activeTab: TabKey }) => (
  <section className="pt-32 pb-16 px-6">
    <div className="max-w-4xl mx-auto text-center">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full">
          {activeTab === 'major' ? 'AI 기반 진로 추천' : 'AI 기반 생기부 도우미'}
        </span>
        {activeTab === 'major' ? (
          <>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1]">
              당신의 꿈이 시작되는 <br />
              <span className="text-indigo-600">최적의 학과</span>를 찾아보세요
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              좋아하는 것, 잘하는 과목, 그리고 꿈꾸는 미래를 알려주세요.
              Gemini AI가 전국 대학의 커리큘럼을 분석하여 당신에게 딱 맞는 길을 제안합니다.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1]">
              교사가 보고 싶어하는 <br />
              <span className="text-emerald-600">탐구 주제</span>를 받아보세요
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              목표 학과와 관심 분야를 알려주세요. 2022 개정 교육과정 과목과 연계된
              탐구 주제·활동·생기부 멘트를 한 번에 제안합니다.
            </p>
          </>
        )}
      </motion.div>
    </div>
  </section>
);

// --- Login CTA ---

const LoginCTA = ({ onLogin }: { onLogin: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 p-10 text-center"
  >
    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <Lock className="w-8 h-8 text-indigo-600" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">로그인하고 시작하기</h3>
    <p className="text-gray-600 mb-8 leading-relaxed">
      결과는 본인 계정에 저장되어 언제든 다시 확인할 수 있어요.
    </p>
    <button
      onClick={onLogin}
      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
    >
      로그인하고 시작하기
      <ArrowRight className="w-5 h-5" />
    </button>
  </motion.div>
);

// --- Auth Modal ---

const AuthModal = ({ onClose }: { onClose: () => void }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('사용자명과 비밀번호를 입력해주세요.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setSubmitting(true);
    const result = mode === 'login'
      ? await signIn(username, password)
      : await signUp(username, password, grade);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-indigo-900/40 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Compass className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-gray-900">{BRAND}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-8 pt-6">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={cn(
                'flex-1 py-2 text-sm font-bold rounded-lg transition-all',
                mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              )}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={cn(
                'flex-1 py-2 text-sm font-bold rounded-lg transition-all',
                mode === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              )}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 mb-2">
                <UserIcon className="w-3.5 h-3.5" /> 사용자명
              </label>
              <input
                type="text"
                autoComplete={mode === 'login' ? 'username' : 'off'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-800"
                placeholder={mode === 'signup' ? '예: 홍길동' : '사용자명 입력'}
                maxLength={40}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 mb-2">
                <Lock className="w-3.5 h-3.5" /> 비밀번호
              </label>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-800"
                placeholder={mode === 'signup' ? '6자 이상' : ''}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 mb-2">
                  <GraduationCap className="w-3.5 h-3.5" /> 학년
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      className={cn(
                        'py-2.5 rounded-xl border text-sm font-bold transition-all',
                        grade === g
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
                      )}
                    >
                      고{g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2',
                submitting && 'opacity-70 cursor-not-allowed'
              )}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>
        </div>

        <div className="p-8 pt-6 text-center text-xs text-gray-400">
          사용자명은 본인 식별용입니다. 같은 사용자명은 한 번만 가입할 수 있어요.
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Grade Selector (shared) ---

const GradeSelector = ({ value, onChange, accent }: { value: string; onChange: (g: string) => void; accent: 'indigo' | 'emerald' }) => (
  <div className="grid grid-cols-3 gap-3">
    {['1', '2', '3'].map((g) => (
      <button
        key={g}
        type="button"
        onClick={() => onChange(g)}
        className={cn(
          'py-3 rounded-xl border text-sm font-bold transition-all',
          value === g
            ? accent === 'indigo'
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100'
            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
        )}
      >
        고등학교 {g}학년
      </button>
    ))}
  </div>
);

// --- Subject native select grouped by 교과군 ---

const SubjectSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800 appearance-none"
  >
    <option value="">과목을 선택하세요…</option>
    {CURRICULUM_2022.map((g) => {
      const all = [
        ...(g.common ?? []),
        ...(g.general ?? []),
        ...(g.career ?? []),
        ...(g.fusion ?? []),
      ];
      return (
        <optgroup key={g.area} label={g.area}>
          {all.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </optgroup>
      );
    })}
  </select>
);

// --- Subject checklist (grouped checkboxes) for 학과 추천 ---

type SubjectStatus = Record<string, 'current' | 'done'>;

const SubjectChecklist = ({
  grade,
  status,
  onChange,
}: {
  grade: string;
  status: SubjectStatus;
  onChange: (next: SubjectStatus) => void;
}) => {
  const advanced = grade === '2' || grade === '3';
  const cycle = (name: string) => {
    const cur = status[name];
    const next: SubjectStatus = { ...status };
    if (!advanced) {
      if (cur) delete next[name];
      else next[name] = 'current';
    } else {
      if (!cur) next[name] = 'current';
      else if (cur === 'current') next[name] = 'done';
      else delete next[name];
    }
    onChange(next);
  };

  return (
    <div>
      {advanced && (
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> 현재 이수 중</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> 이수 완료</span>
          <span className="text-gray-400">(과목을 눌러 상태를 바꿔요)</span>
        </div>
      )}
      <div className="max-h-72 overflow-y-auto custom-scrollbar border border-gray-200 rounded-2xl p-4 space-y-4 bg-gray-50/50">
        {CURRICULUM_2022.map((g) => {
          const all = [
            ...(g.common ?? []),
            ...(g.general ?? []),
            ...(g.career ?? []),
            ...(g.fusion ?? []),
          ];
          return (
            <div key={g.area}>
              <p className="text-xs font-bold text-gray-400 mb-2">{g.area}</p>
              <div className="flex flex-wrap gap-2">
                {all.map((name) => {
                  const st = status[name];
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => cycle(name)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        !st && 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300',
                        st === 'current' && (advanced
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-indigo-100 border-indigo-300 text-indigo-800'),
                        st === 'done' && 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      )}
                    >
                      {st === 'done' ? '✓ ' : ''}{name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Major Recommendation Form ---

const MajorForm = ({
  userId,
  defaultGrade,
  onRecommend,
}: {
  userId: string;
  defaultGrade: string;
  onRecommend: (data: Recommendation[], takenSubjects: string) => void;
}) => {
  const [formData, setFormData] = useState<MajorFormData>({
    interests: '',
    favoriteSubjects: '',
    careerGoal: '',
    grade: defaultGrade,
  });
  const [subjectStatus, setSubjectStatus] = useState<SubjectStatus>({});
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.interests || !formData.favoriteSubjects || !formData.careerGoal) return;

    const specs: FieldSpec[] = [
      { key: 'interests', label: '관심 분야', question: '평소 어떤 분야에 관심이 많나요?', value: formData.interests, required: true },
      { key: 'favoriteSubjects', label: '좋아하는 과목', question: '학교에서 가장 좋아하는 과목은 무엇인가요?', value: formData.favoriteSubjects, required: true },
      { key: 'careerGoal', label: '장래희망', question: '나중에 어떤 일을 하고 싶나요? (장래희망)', value: formData.careerGoal, required: true },
    ];
    const integrity = checkKoreanIntegrity(specs);
    if (Object.keys(integrity).length > 0) {
      setFieldErrors(integrity);
      return;
    }
    setFieldErrors({});
    setValidating(true);
    const { ok, issues } = await validateRelevance(
      specs.map((s) => ({ key: s.key, question: s.question, value: s.value }))
    );
    setValidating(false);
    if (!ok) {
      const errs: Record<string, string> = {};
      for (const it of issues) errs[it.key] = it.reason;
      setFieldErrors(errs);
      return;
    }

    const completed = Object.entries(subjectStatus).filter(([, s]) => s === 'done').map(([n]) => n);
    const current = Object.entries(subjectStatus).filter(([, s]) => s === 'current').map(([n]) => n);
    const completedSubjects = completed.join(', ');
    const currentSubjects = current.join(', ');
    const takenSubjects = [...completed, ...current].join(', ');

    setLoading(true);
    try {
      const results = await getRecommendations({
        interests: formData.interests,
        favoriteSubjects: formData.favoriteSubjects,
        careerGoal: formData.careerGoal,
        grade: formData.grade,
        currentSubjects,
        completedSubjects,
      });

      const { error } = await supabase.from('recommendations').insert({
        user_id: userId,
        user_interests: formData.interests,
        user_subjects: formData.favoriteSubjects,
        user_career_goal: formData.careerGoal,
        user_grade: formData.grade,
        result_json: { recs: results, currentSubjects: takenSubjects, completedSubjects },
      });
      if (error) console.error('Failed to save recommendation:', error);

      onRecommend(results, takenSubjects);
    } catch (err: any) {
      console.error(err);
      alert(err.message || '추천을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 p-8 md:p-10"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            현재 학년이 어떻게 되나요?
          </label>
          <GradeSelector value={formData.grade} accent="indigo" onChange={(g) => setFormData({ ...formData, grade: g })} />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            평소 어떤 분야에 관심이 많나요?
          </label>
          <textarea
            placeholder="예: IT 기기 분해하기, 소설 쓰기, 요리하기, 경제 뉴스 보기 등"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none h-24 text-gray-800"
            value={formData.interests}
            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            학교에서 가장 좋아하는 과목은 무엇인가요?
          </label>
          <input
            type="text"
            placeholder="예: 수학, 사회문화, 생명과학, 미술 등"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-800"
            value={formData.favoriteSubjects}
            onChange={(e) => setFormData({ ...formData, favoriteSubjects: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <ListChecks className="w-4 h-4 text-indigo-500" />
            {formData.grade === '1'
              ? '들을 (예정인) 선택과목 (선택)'
              : '선택과목 이수 현황 (선택)'}
          </label>
          <SubjectChecklist
            grade={formData.grade}
            status={subjectStatus}
            onChange={setSubjectStatus}
          />
          <p className="text-xs text-gray-400">
            {formData.grade === '1'
              ? '관심 있는 과목을 골라주세요. 추천 학과의 필요 과목과 비교해드려요.'
              : '현재 선택과목을 바탕으로 진학 가능한 학과를 우선 추천하고, 필요 과목과 비교해드려요.'}
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Target className="w-4 h-4 text-indigo-500" />
            나중에 어떤 일을 하고 싶나요? (장래희망)
          </label>
          <input
            type="text"
            placeholder="예: 데이터 사이언티스트, 방송 작가, 외교관, 창업가 등"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-800"
            value={formData.careerGoal}
            onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
          />
        </div>

        {Object.keys(fieldErrors).length > 0 && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 space-y-1">
            <p className="font-bold">아래 항목을 다시 입력해주세요</p>
            {Object.entries(fieldErrors).map(([k, m]) => (
              <p key={k}>· {({ interests: '관심 분야', favoriteSubjects: '좋아하는 과목', careerGoal: '장래희망' } as Record<string, string>)[k] ?? k}: {m}</p>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || validating}
          className={cn(
            'w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3',
            (loading || validating) && 'opacity-80 cursor-not-allowed'
          )}
        >
          {validating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              입력 내용을 확인 중입니다...
            </>
          ) : loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              AI가 분석 중입니다...
            </>
          ) : (
            <>
              추천 학과 확인하기
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

// --- Research Form ---

const ResearchForm = ({
  userId,
  defaultGrade,
  onResult,
}: {
  userId: string;
  defaultGrade: string;
  onResult: (data: ResearchSuggestion[]) => void;
}) => {
  const [formData, setFormData] = useState<ResearchFormData>({
    targetDepartment: '',
    careerGoal: '',
    grade: defaultGrade,
    interestTopic: '',
    journalSubject: '',
    journalUnit: '',
    journalSubUnit: '',
    additionalContext: '',
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  useEffect(() => {
    const subject = formData.journalSubject;
    if (!subject) {
      setUnits([]);
      return;
    }
    let cancelled = false;
    setUnitsLoading(true);
    setUnits([]);
    (async () => {
      try {
        const res = await fetch(`/api/curriculum-units?subject=${encodeURIComponent(subject)}`);
        const json = await res.json();
        if (cancelled) return;
        setUnits(Array.isArray(json?.units) ? (json.units as CurriculumUnit[]) : []);
      } catch {
        if (!cancelled) setUnits([]);
      } finally {
        if (!cancelled) setUnitsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [formData.journalSubject]);

  const subUnits = units.find((u) => u.unit === formData.journalUnit)?.subUnits ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetDepartment.trim()) return;

    const specs: FieldSpec[] = [
      { key: 'targetDepartment', label: '목표 학과', question: '목표하는 대학 학과는 무엇인가요?', value: formData.targetDepartment, required: true, allowNonKorean: true },
      { key: 'careerGoal', label: '장래희망', question: '장래희망/진로는 무엇인가요?', value: formData.careerGoal },
      { key: 'interestTopic', label: '관심 주제', question: '관심 있는 주제나 분야는 무엇인가요?', value: formData.interestTopic },
      { key: 'additionalContext', label: '연관 내용', question: '연관 짓고 싶은 과목이나 활동 내용은 무엇인가요?', value: formData.additionalContext },
    ];
    const integrity = checkKoreanIntegrity(specs);
    if (Object.keys(integrity).length > 0) {
      setFieldErrors(integrity);
      return;
    }
    setFieldErrors({});
    setValidating(true);
    const { ok, issues } = await validateRelevance(
      specs.map((s) => ({ key: s.key, question: s.question, value: s.value }))
    );
    setValidating(false);
    if (!ok) {
      const errs: Record<string, string> = {};
      for (const it of issues) errs[it.key] = it.reason;
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const results = await getResearchTopics(formData);

      const { error } = await supabase.from('research_suggestions').insert({
        user_id: userId,
        target_department: formData.targetDepartment,
        career_goal: formData.careerGoal,
        user_grade: formData.grade,
        interest_topic: formData.interestTopic,
        result_json: { topics: results, journalSubject: formData.journalSubject, additionalContext: formData.additionalContext },
      });
      if (error) console.error('Failed to save research suggestion:', error);

      onResult(results);
    } catch (err: any) {
      console.error(err);
      alert(err.message || '탐구 주제를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl shadow-emerald-100/50 border border-emerald-50 p-8 md:p-10"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <GraduationCap className="w-4 h-4 text-emerald-500" />
            현재 학년
          </label>
          <GradeSelector value={formData.grade} accent="emerald" onChange={(g) => setFormData({ ...formData, grade: g })} />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <School className="w-4 h-4 text-emerald-500" />
            목표 학과 (필수)
          </label>
          <input
            type="text"
            placeholder="예: 컴퓨터공학과, 의예과, 경영학과, 식품영양학과 등"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800"
            value={formData.targetDepartment}
            onChange={(e) => setFormData({ ...formData, targetDepartment: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Target className="w-4 h-4 text-emerald-500" />
            장래희망/진로 (선택)
          </label>
          <input
            type="text"
            placeholder="예: AI 연구원, 임상심리사, 외교관 등"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800"
            value={formData.careerGoal}
            onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            생기부를 작성할 과목 (선택)
          </label>
          <SubjectSelect
            value={formData.journalSubject}
            onChange={(v) => setFormData({ ...formData, journalSubject: v, journalUnit: '', journalSubUnit: '' })}
          />
          <p className="text-xs text-gray-400">선택하면 모든 주제가 이 과목과 연계되도록 생성돼요.</p>

          {formData.journalSubject && (
            <div className="space-y-3 pt-1">
              {unitsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 px-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  단원 정보를 불러오는 중…
                </div>
              ) : units.length > 0 ? (
                <>
                  <select
                    value={formData.journalUnit}
                    onChange={(e) => setFormData({ ...formData, journalUnit: e.target.value, journalSubUnit: '' })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800 appearance-none"
                  >
                    <option value="">대단원 선택 (선택)…</option>
                    {units.map((u) => (
                      <option key={u.unit} value={u.unit}>{u.unit}</option>
                    ))}
                  </select>
                  {formData.journalUnit && subUnits.length > 0 && (
                    <select
                      value={formData.journalSubUnit}
                      onChange={(e) => setFormData({ ...formData, journalSubUnit: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800 appearance-none"
                    >
                      <option value="">소단원 선택 (선택)…</option>
                      {subUnits.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-400">대단원·소단원을 고르면 그 단원에 맞춘 탐구 주제가 생성돼요.</p>
                </>
              ) : (
                <p className="text-xs text-gray-400 px-1">이 과목의 단원 정보를 불러오지 못했어요. 단원 선택 없이 진행할 수 있어요.</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Lightbulb className="w-4 h-4 text-emerald-500" />
            관심 주제/분야 (선택)
          </label>
          <textarea
            placeholder="예: 생성형 AI 윤리, 청소년 수면과 학업 성취, 도시 재생, 환경 호르몬 등"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none h-20 text-gray-800"
            value={formData.interestTopic}
            onChange={(e) => setFormData({ ...formData, interestTopic: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            연관 짓고 싶은 과목이나 내용 (선택)
          </label>
          <textarea
            placeholder="예: 통합사회에서 배운 사회 정의, 동아리에서 진행한 환경 캠페인, 독서 '코스모스' 등"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none h-20 text-gray-800"
            value={formData.additionalContext}
            onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
          />
        </div>

        {Object.keys(fieldErrors).length > 0 && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 space-y-1">
            <p className="font-bold">아래 항목을 다시 입력해주세요</p>
            {Object.entries(fieldErrors).map(([k, m]) => (
              <p key={k}>· {({ targetDepartment: '목표 학과', careerGoal: '장래희망', interestTopic: '관심 주제', additionalContext: '연관 내용' } as Record<string, string>)[k] ?? k}: {m}</p>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || validating || !formData.targetDepartment.trim()}
          className={cn(
            'w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3',
            (loading || validating || !formData.targetDepartment.trim()) && 'opacity-60 cursor-not-allowed'
          )}
        >
          {validating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              입력 내용을 확인 중입니다...
            </>
          ) : loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              AI가 탐구 주제를 설계 중입니다...
            </>
          ) : (
            <>
              탐구 주제 추천받기
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

// --- Department Card ---

interface DepartmentCardProps {
  recommendation: Recommendation;
  index: number;
  key?: React.Key;
}

const DepartmentCard = ({ recommendation, index, onViewDetails }: DepartmentCardProps & { onViewDetails: (rec: Recommendation) => void }) => {
  const score = typeof recommendation.matchScore === 'number' ? Math.max(0, Math.min(100, Math.round(recommendation.matchScore))) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all group"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <School className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{recommendation.schoolName}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {recommendation.departmentName}
          </h3>
        </div>
        {score !== null && (
          <div className="bg-indigo-50 px-4 py-2 rounded-xl text-center">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">매칭률</div>
            <div className="text-xl font-bold text-indigo-700 leading-none">{score}%</div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            추천 이유
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed">{recommendation.matchReason}</p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            주요 커리큘럼
          </h4>
          <div className="flex flex-wrap gap-2">
            {recommendation.curriculum.slice(0, 4).map((item, i) => (
              <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600 font-medium">
                {item}
              </span>
            ))}
            {recommendation.curriculum.length > 4 && (
              <span className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-400 font-medium">
                +{recommendation.curriculum.length - 4}개 더보기
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            졸업 후 진로
          </h4>
          <div className="flex flex-wrap gap-2">
            {recommendation.careerPaths.map((path, i) => (
              <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                {path}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onViewDetails(recommendation)}
        className="w-full mt-8 py-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        상세 커리큘럼 더보기
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// --- Curriculum Modal ---

const CurriculumModal = ({
  recommendation,
  currentSubjects,
  onClose,
  onViewUniversities,
}: {
  recommendation: Recommendation;
  currentSubjects: string;
  onClose: () => void;
  onViewUniversities: () => void;
}) => {
  const taken = new Set(
    currentSubjects
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const needed = recommendation.neededSubjects ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <School className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{recommendation.schoolName}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{recommendation.departmentName} 상세 분석</h3>
          </div>
          <button
            onClick={onViewUniversities}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs font-bold text-indigo-700 transition-all"
            title="이 학과가 있는 대학 보기"
          >
            <Building2 className="w-4 h-4" />
            이 학과가 있는 대학
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            {needed.length > 0 && (
              <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                  <ListChecks className="w-4 h-4 text-indigo-500" />
                  이 학과를 위해 필요한 선택과목
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {needed.map((s, i) => {
                    const ok = taken.has(s);
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-xl border',
                          ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                        )}
                      >
                        {ok ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <X className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                        <span className={cn('text-sm font-medium', ok ? 'text-emerald-800' : 'text-amber-800')}>{s}</span>
                      </div>
                    );
                  })}
                </div>
                {taken.size > 0 && (
                  <p className="text-xs text-gray-400 mt-3">
                    ✓ 이미 수강(예정) · ✗ 추가 수강 권장 · 입력한 과목 {taken.size}개 기준
                  </p>
                )}
              </section>
            )}

            <section className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                학년별 생기부 맞춤 조언
              </h4>
              <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-wrap">
                {recommendation.gradeSpecificAdvice}
              </p>
            </section>

            {recommendation.careerPaths?.length > 0 && (
              <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                  <Target className="w-4 h-4 text-emerald-500" />
                  졸업 후 진로
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.careerPaths.map((path, i) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold">
                      {path}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 mb-3">학과 소개</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{recommendation.description}</p>
            </section>
          </div>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
          >
            확인
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- University Detail Modal ---

type SchoolDetail = {
  name: string;
  region?: string;
  type?: string;
  estabType?: string;
  address?: string;
  homepage?: string;
  phone?: string;
  intro?: string;
  majors?: string[];
  _fallback?: boolean;
};

const UnivDetailModal = ({
  schoolName,
  major,
  onClose,
}: {
  schoolName: string;
  major: string;
  onClose: () => void;
}) => {
  const [detail, setDetail] = useState<SchoolDetail | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/careernet/school?search=${encodeURIComponent(schoolName)}&major=${encodeURIComponent(major)}`
        );
        if (!res.ok) throw new Error(`대학 정보 호출 실패 (${res.status})`);
        const json = await res.json();
        if (cancelled) return;
        setSource(typeof json?.source === 'string' ? json.source : null);
        setDetail((json?.school ?? null) as SchoolDetail | null);
      } catch (e: any) {
        if (!cancelled) setError(e.message || '대학 정보를 가져오지 못했습니다.');
      }
    })();
    return () => { cancelled = true; };
  }, [schoolName, major]);

  const homepageHref = detail?.homepage
    ? /^https?:\/\//.test(detail.homepage)
      ? detail.homepage
      : `https://${detail.homepage}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7 border-b border-gray-100 flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">대학 정보</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 truncate">{schoolName}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {source === 'fallback' ? '출처: AI 보강 정보 (참고용)' : '출처: 커리어넷 대학 정보'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          {!detail && !error && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {detail && (
            <>
              <div className="flex flex-wrap gap-2">
                {detail.type && (
                  <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                    {detail.type}
                  </span>
                )}
                {detail.estabType && (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                    {detail.estabType}
                  </span>
                )}
                {detail.region && (
                  <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                    <MapPin className="w-3 h-3" />
                    {detail.region}
                  </span>
                )}
              </div>

              {detail.intro && (
                <section>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">학교 소개</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{detail.intro}</p>
                </section>
              )}

              {detail.address && (
                <section>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">주소</h4>
                  <p className="text-sm text-gray-600">{detail.address}</p>
                </section>
              )}

              {detail.majors && detail.majors.length > 0 && (
                <section>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">대표 개설 학과</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.majors.map((m, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-md text-xs text-gray-600 font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {homepageHref && (
                <a
                  href={homepageHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                >
                  공식 홈페이지 방문
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Dept Universities Modal ---

const DeptUnivListModal = ({ department, onClose }: { department: string; onClose: () => void }) => {
  const [items, setItems] = useState<UnivItem[] | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/careernet/majors?search=${encodeURIComponent(department)}`);
        if (!res.ok) throw new Error(`대학 정보 호출 실패 (${res.status})`);
        const json = await res.json();
        if (cancelled) return;
        setSource(typeof json?.source === 'string' ? json.source : null);
        setItems((json?.dataSearch?.content ?? []) as UnivItem[]);
      } catch (e: any) {
        if (!cancelled) setError(e.message || '데이터를 가져오지 못했습니다.');
      }
    })();
    return () => { cancelled = true; };
  }, [department]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-indigo-900/40 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">전국 대학</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{department} 운영 대학</h3>
            <p className="text-xs text-gray-400 mt-1">
              {source === 'fallback' ? '출처: AI 보강 결과 (커리어넷 미확인)' : '출처: 커리어넷 학과 정보'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          {!items && !error && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {items && items.length === 0 && (
            <div className="text-center py-16 text-sm text-gray-400">
              검색 결과가 없습니다.
            </div>
          )}
          {items && items.length > 0 && (
            <div className="space-y-2">
              {items.map((u, i) => {
                const name = String(u.schoolName ?? '학교명 미상');
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedSchool(name)}
                    className="w-full text-left p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm mb-1 group-hover:text-indigo-700 transition-colors">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {String(u.major ?? department)}
                          {u.campus ? ` · ${String(u.campus)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1 text-xs">
                          {u.schoolType && (
                            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600 font-medium">
                              {String(u.schoolType)}
                            </span>
                          )}
                          {u.region && (
                            <span className="flex items-center gap-1 text-gray-400">
                              <MapPin className="w-3 h-3" />
                              {String(u.region)}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedSchool && (
            <UnivDetailModal
              schoolName={selectedSchool}
              major={department}
              onClose={() => setSelectedSchool(null)}
            />
          )}
        </AnimatePresence>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Major Result List ---

const MajorResultList = ({
  recommendations,
  currentSubjects,
  onReset,
}: {
  recommendations: Recommendation[];
  currentSubjects: string;
  onReset: () => void;
}) => {
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showUnivModal, setShowUnivModal] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-3xl font-bold text-gray-900">당신을 위한 추천 학과</h2>
        <button onClick={onReset} className="text-sm font-bold text-indigo-600 hover:underline">
          다시 검사하기
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {recommendations.map((rec, i) => (
          <DepartmentCard key={i} recommendation={rec} index={i} onViewDetails={setSelectedRec} />
        ))}
      </div>

      <AnimatePresence>
        {selectedRec && (
          <CurriculumModal
            recommendation={selectedRec}
            currentSubjects={currentSubjects}
            onClose={() => setSelectedRec(null)}
            onViewUniversities={() => setShowUnivModal(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUnivModal && selectedRec && (
          <DeptUnivListModal department={selectedRec.departmentName} onClose={() => setShowUnivModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Research Topic Card + Detail Modal ---

const ResearchTopicCard = ({
  topic,
  index,
  onViewDetails,
}: {
  topic: ResearchSuggestion;
  index: number;
  onViewDetails: (t: ResearchSuggestion) => void;
  key?: React.Key;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm hover:shadow-xl hover:shadow-emerald-50/50 transition-all group"
  >
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
        <Lightbulb className="w-4 h-4 text-emerald-600" />
      </div>
      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">탐구 주제 {index + 1}</span>
    </div>
    <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mb-4 leading-snug">
      {topic.topic}
    </h3>

    <div className="mb-4">
      <p className="text-xs font-bold text-gray-500 mb-2">연결 과목</p>
      <div className="flex flex-wrap gap-1.5">
        {topic.linkedSubjects.map((s, i) => (
          <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold">
            {s}
          </span>
        ))}
      </div>
    </div>

    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-5">{topic.motivation}</p>

    <button
      onClick={() => onViewDetails(topic)}
      className="w-full py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all flex items-center justify-center gap-2"
    >
      상세보기 · 생기부 멘트
      <ChevronRight className="w-4 h-4" />
    </button>
  </motion.div>
);

const ResearchDetailModal = ({ topic, onClose }: { topic: ResearchSuggestion; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const copyJournalText = async () => {
    try {
      await navigator.clipboard.writeText(topic.journalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">탐구 주제 상세</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 leading-snug">{topic.topic}</h3>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {topic.linkedSubjects.map((s, i) => (
              <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-7">
            <section>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                탐구 동기
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{topic.motivation}</p>
            </section>

            <section>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                탐구 활동 계획
              </h4>
              <ol className="space-y-2">
                {topic.activities.map((a, i) => (
                  <li key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="flex-shrink-0 w-6 h-6 bg-white rounded-lg flex items-center justify-center text-xs font-bold text-emerald-600 shadow-sm mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-relaxed">{a}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  생기부 기재 멘트 (예시)
                </h4>
                <button
                  onClick={copyJournalText}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  )}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>
              <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">{topic.journalText}</p>
            </section>
          </div>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
          >
            확인
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ResearchResultList = ({ topics, onReset }: { topics: ResearchSuggestion[]; onReset: () => void }) => {
  const [selected, setSelected] = useState<ResearchSuggestion | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-3xl font-bold text-gray-900">추천 탐구 주제</h2>
        <button onClick={onReset} className="text-sm font-bold text-emerald-600 hover:underline">
          다시 만들기
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((t, i) => (
          <ResearchTopicCard key={i} topic={t} index={i} onViewDetails={setSelected} />
        ))}
      </div>

      <AnimatePresence>
        {selected && <ResearchDetailModal topic={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
};

// --- Helper: extract recommendations/topics from stored result_json (may be array or object wrapping) ---

function extractMajorResults(rj: unknown): { recs: Recommendation[]; currentSubjects: string } {
  if (Array.isArray(rj)) return { recs: rj as Recommendation[], currentSubjects: '' };
  if (rj && typeof rj === 'object' && 'recs' in rj) {
    const o = rj as { recs?: unknown; currentSubjects?: unknown };
    return {
      recs: Array.isArray(o.recs) ? (o.recs as Recommendation[]) : [],
      currentSubjects: typeof o.currentSubjects === 'string' ? o.currentSubjects : '',
    };
  }
  return { recs: [], currentSubjects: '' };
}

function extractResearchResults(rj: unknown): ResearchSuggestion[] {
  if (Array.isArray(rj)) return rj as ResearchSuggestion[];
  if (rj && typeof rj === 'object' && 'topics' in rj) {
    const o = rj as { topics?: unknown };
    return Array.isArray(o.topics) ? (o.topics as ResearchSuggestion[]) : [];
  }
  return [];
}

// --- History Side Panel ---

const HistoryPanel = ({
  kind,
  onClose,
  onSelectMajor,
  onSelectResearch,
}: {
  kind: HistoryKind;
  onClose: () => void;
  onSelectMajor: (results: Recommendation[], currentSubjects: string) => void;
  onSelectResearch: (results: ResearchSuggestion[]) => void;
}) => {
  const { user } = useAuth();
  const [majorRows, setMajorRows] = useState<MajorHistoryRow[] | null>(null);
  const [researchRows, setResearchRows] = useState<ResearchHistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);

    if (kind === 'major') {
      setMajorRows(null);
      (async () => {
        const { data, error } = await supabase
          .from('recommendations')
          .select('id, created_at, user_interests, user_subjects, user_career_goal, user_grade, result_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);
        if (cancelled) return;
        if (error) { setError(error.message); return; }
        setMajorRows((data ?? []) as MajorHistoryRow[]);
      })();
    } else {
      setResearchRows(null);
      (async () => {
        const { data, error } = await supabase
          .from('research_suggestions')
          .select('id, created_at, target_department, career_goal, user_grade, interest_topic, result_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);
        if (cancelled) return;
        if (error) { setError(error.message); return; }
        setResearchRows((data ?? []) as ResearchHistoryRow[]);
      })();
    }

    return () => { cancelled = true; };
  }, [user, kind]);

  const deleteRow = async (id: string) => {
    if (!confirm('이 이력을 삭제할까요?')) return;
    setDeletingId(id);
    const table = kind === 'major' ? 'recommendations' : 'research_suggestions';
    const { error } = await supabase.from(table).delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }
    if (kind === 'major') setMajorRows((rows) => rows?.filter((r) => r.id !== id) ?? null);
    else setResearchRows((rows) => rows?.filter((r) => r.id !== id) ?? null);
  };

  const isMajor = kind === 'major';
  const rows = isMajor ? majorRows : researchRows;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[115] bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className={cn('w-5 h-5', isMajor ? 'text-indigo-600' : 'text-emerald-600')} />
            <h3 className="text-lg font-bold text-gray-900">
              {isMajor ? '내 학과 추천 이력' : '내 생기부 주제 이력'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          {!rows && !error && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {rows && rows.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              아직 이력이 없어요.<br />첫 결과를 받아보세요!
            </div>
          )}

          {isMajor && majorRows?.map((row) => {
            const date = new Date(row.created_at);
            const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            const { recs, currentSubjects } = extractMajorResults(row.result_json);
            return (
              <div key={row.id} className="relative group">
                <button
                  onClick={() => recs.length > 0 && onSelectMajor(recs, currentSubjects)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-2xl transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600">고등학교 {row.user_grade}학년</span>
                    <span className="text-xs text-gray-400 mr-7">{dateStr}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1 truncate">{row.user_career_goal}</p>
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {row.user_subjects} · {row.user_interests}
                  </p>
                  <span className="text-xs text-gray-400">추천 학과 {recs.length}개</span>
                </button>
                <button
                  onClick={() => deleteRow(row.id)}
                  disabled={deletingId === row.id}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="이력 삭제"
                >
                  {deletingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            );
          })}

          {!isMajor && researchRows?.map((row) => {
            const date = new Date(row.created_at);
            const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            const topics = extractResearchResults(row.result_json);
            return (
              <div key={row.id} className="relative group">
                <button
                  onClick={() => topics.length > 0 && onSelectResearch(topics)}
                  className="w-full text-left p-4 bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-2xl transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-600">고등학교 {row.user_grade}학년</span>
                    <span className="text-xs text-gray-400 mr-7">{dateStr}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1 truncate">{row.target_department}</p>
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {row.interest_topic || row.career_goal || '관심 주제 미입력'}
                  </p>
                  <span className="text-xs text-gray-400">탐구 주제 {topics.length}개</span>
                </button>
                <button
                  onClick={() => deleteRow(row.id)}
                  disabled={deletingId === row.id}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="이력 삭제"
                >
                  {deletingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </motion.aside>
    </motion.div>
  );
};

// --- Journal Memo Panel (생기부 작성 메모: 직접 기록/관리) ---

const EMPTY_MEMO: MemoDraft = { subject: '', summary: '', books: '', future_research: '' };

const MemoForm = ({
  initial,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial: MemoDraft;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (draft: MemoDraft) => void;
}) => {
  const [draft, setDraft] = useState<MemoDraft>(initial);
  const canSave = draft.subject.trim().length > 0 && draft.summary.trim().length > 0;

  return (
    <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">과목명 *</label>
        <input
          type="text"
          value={draft.subject}
          onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
          placeholder="예: 생명과학, 사회와 문화"
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">내용 간단 정리 *</label>
        <textarea
          value={draft.summary}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          placeholder="생기부에 어떤 내용을 작성했는지 간단히 정리"
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none h-20 text-gray-800"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">활용 도서</label>
        <input
          type="text"
          value={draft.books}
          onChange={(e) => setDraft({ ...draft, books: e.target.value })}
          placeholder="예: 코스모스(칼 세이건), 이기적 유전자"
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">향후 탐구하겠다고 한 것</label>
        <textarea
          value={draft.future_research}
          onChange={(e) => setDraft({ ...draft, future_research: e.target.value })}
          placeholder="다음에 더 탐구하기로 한 주제·방향"
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none h-16 text-gray-800"
        />
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
        >
          취소
        </button>
        <button
          onClick={() => canSave && onSubmit(draft)}
          disabled={!canSave || submitting}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all',
            canSave && !submitting
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          저장
        </button>
      </div>
    </div>
  );
};

const MemoPanel = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<JournalMemoRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);
    setRows(null);
    (async () => {
      const { data, error } = await supabase
        .from('journal_memos')
        .select('id, created_at, updated_at, subject, summary, books, future_research')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (error) { setError(error.message); return; }
      setRows((data ?? []) as JournalMemoRow[]);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const addMemo = async (draft: MemoDraft) => {
    if (!user) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('journal_memos')
      .insert({
        user_id: user.id,
        subject: draft.subject.trim(),
        summary: draft.summary.trim(),
        books: draft.books.trim() || null,
        future_research: draft.future_research.trim() || null,
      })
      .select('id, created_at, updated_at, subject, summary, books, future_research')
      .single();
    setSubmitting(false);
    if (error) { alert(`저장 실패: ${error.message}`); return; }
    setRows((prev) => [data as JournalMemoRow, ...(prev ?? [])]);
    setAdding(false);
  };

  const updateMemo = async (id: string, draft: MemoDraft) => {
    if (!user) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('journal_memos')
      .update({
        subject: draft.subject.trim(),
        summary: draft.summary.trim(),
        books: draft.books.trim() || null,
        future_research: draft.future_research.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, created_at, updated_at, subject, summary, books, future_research')
      .single();
    setSubmitting(false);
    if (error) { alert(`수정 실패: ${error.message}`); return; }
    setRows((prev) => prev?.map((r) => (r.id === id ? (data as JournalMemoRow) : r)) ?? null);
    setEditingId(null);
  };

  const deleteMemo = async (id: string) => {
    if (!confirm('이 메모를 삭제할까요?')) return;
    setDeletingId(id);
    const { error } = await supabase.from('journal_memos').delete().eq('id', id);
    setDeletingId(null);
    if (error) { alert(`삭제 실패: ${error.message}`); return; }
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[115] bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900">내 생기부 작성 메모</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {!adding && (
            <button
              onClick={() => { setAdding(true); setEditingId(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-200 text-amber-600 rounded-2xl text-sm font-bold hover:bg-amber-50 transition-all"
            >
              <Plus className="w-4 h-4" />
              새 메모 추가
            </button>
          )}

          {adding && (
            <MemoForm
              initial={EMPTY_MEMO}
              submitting={submitting}
              onCancel={() => setAdding(false)}
              onSubmit={addMemo}
            />
          )}

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          {!rows && !error && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {rows && rows.length === 0 && !adding && (
            <div className="text-center py-12 text-sm text-gray-400">
              아직 작성한 메모가 없어요.<br />생기부에 쓴 내용을 기록해보세요!
            </div>
          )}

          {rows?.map((row) => {
            if (editingId === row.id) {
              return (
                <MemoForm
                  key={row.id}
                  initial={{
                    subject: row.subject,
                    summary: row.summary,
                    books: row.books ?? '',
                    future_research: row.future_research ?? '',
                  }}
                  submitting={submitting}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(d) => updateMemo(row.id, d)}
                />
              );
            }
            const date = new Date(row.created_at);
            const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            return (
              <div key={row.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                    {row.subject}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 mr-1">{dateStr}</span>
                    <button
                      onClick={() => { setEditingId(row.id); setAdding(false); }}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-amber-600 hover:bg-amber-50 transition-all"
                      title="수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMemo(row.id)}
                      disabled={deletingId === row.id}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="삭제"
                    >
                      {deletingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{row.summary}</p>

                {row.books && (
                  <div className="flex items-start gap-2 mb-2">
                    <BookMarked className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      <span className="font-bold text-gray-500">활용 도서 </span>
                      {row.books}
                    </p>
                  </div>
                )}
                {row.future_research && (
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      <span className="font-bold text-gray-500">향후 탐구 </span>
                      {row.future_research}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.aside>
    </motion.div>
  );
};

// --- App ---

export default function App() {
  const { user, displayGrade, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('major');
  const [majorResults, setMajorResults] = useState<Recommendation[] | null>(null);
  const [majorCurrentSubjects, setMajorCurrentSubjects] = useState<string>('');
  const [researchResults, setResearchResults] = useState<ResearchSuggestion[] | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [historyKind, setHistoryKind] = useState<HistoryKind | null>(null);

  const hasResultForTab = activeTab === 'major' ? !!majorResults : !!researchResults;
  const effectiveGrade = displayGrade ?? '1';

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLoginClick={() => setShowAuth(true)}
        onOpenHistory={setHistoryKind}
        onHome={() => {
          setActiveTab('major');
          setMajorResults(null);
          setResearchResults(null);
          setMajorCurrentSubjects('');
          setHistoryKind(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSignOut={async () => {
          await signOut();
          setMajorResults(null);
          setResearchResults(null);
          setMajorCurrentSubjects('');
        }}
      />

      <main>
        <AnimatePresence mode="wait">
          {!hasResultForTab ? (
            <motion.div
              key={`form-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Hero activeTab={activeTab} />
              <div className="px-6 pb-24">
                {loading ? (
                  <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : !user ? (
                  <LoginCTA onLogin={() => setShowAuth(true)} />
                ) : activeTab === 'major' ? (
                  <MajorForm
                    userId={user.id}
                    defaultGrade={effectiveGrade}
                    onRecommend={(r, taken) => {
                      setMajorResults(r);
                      setMajorCurrentSubjects(taken);
                    }}
                  />
                ) : (
                  <ResearchForm
                    userId={user.id}
                    defaultGrade={effectiveGrade}
                    onResult={setResearchResults}
                  />
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`results-${activeTab}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="pt-32"
            >
              {activeTab === 'major' && majorResults && (
                <MajorResultList
                  recommendations={majorResults}
                  currentSubjects={majorCurrentSubjects}
                  onReset={() => setMajorResults(null)}
                />
              )}
              {activeTab === 'research' && researchResults && (
                <ResearchResultList topics={researchResults} onReset={() => setResearchResults(null)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {historyKind === 'memo' && (
          <MemoPanel onClose={() => setHistoryKind(null)} />
        )}
        {(historyKind === 'major' || historyKind === 'research') && (
          <HistoryPanel
            kind={historyKind}
            onClose={() => setHistoryKind(null)}
            onSelectMajor={(r, cs) => {
              setActiveTab('major');
              setMajorResults(r);
              setMajorCurrentSubjects(cs);
              setHistoryKind(null);
            }}
            onSelectResearch={(r) => {
              setActiveTab('research');
              setResearchResults(r);
              setHistoryKind(null);
            }}
          />
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Compass className="w-5 h-5" />
            <span className="font-bold text-lg">{BRAND}</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 {BRAND}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
