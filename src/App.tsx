import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, GraduationCap, BookOpen, Target, Sparkles, ArrowRight, Loader2,
  School, ChevronRight, Lock, LogOut, History, User as UserIcon, X,
  FileText, Lightbulb, Clipboard, Check,
} from 'lucide-react';
import { cn } from './lib/utils';
import { getRecommendations, type Recommendation } from './services/geminiService';
import { getResearchTopics, type ResearchSuggestion } from './services/researchService';
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';

type TabKey = 'major' | 'research';
type HistoryKind = 'major' | 'research';

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
};

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

// --- Header ---

const Header = ({
  activeTab,
  onTabChange,
  onLoginClick,
  onOpenHistory,
  onSignOut,
}: {
  activeTab: TabKey;
  onTabChange: (t: TabKey) => void;
  onLoginClick: () => void;
  onOpenHistory: (kind: HistoryKind) => void;
  onSignOut: () => void;
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">DreamPath</span>
        </div>

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

// --- Hero (tab-aware) ---

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
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !password) {
      setError('이름과 비밀번호를 입력해주세요.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setSubmitting(true);
    const { error } = mode === 'login'
      ? await signIn(name, password)
      : await signUp(name, password);
    setSubmitting(false);
    if (error) {
      setError(error);
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
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-gray-900">DreamPath</span>
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
                <UserIcon className="w-3.5 h-3.5" /> 이름
              </label>
              <input
                type="text"
                autoComplete={mode === 'login' ? 'username' : 'off'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-800"
                placeholder={mode === 'signup' ? '예: 홍길동' : '본인 이름'}
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
          이름은 본인 식별용입니다. 같은 이름은 한 번만 가입할 수 있어요.
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Grade selector (reused) ---

const GradeSelector = ({ value, onChange }: { value: string; onChange: (g: string) => void }) => (
  <div className="grid grid-cols-3 gap-3">
    {['1', '2', '3'].map((g) => (
      <button
        key={g}
        type="button"
        onClick={() => onChange(g)}
        className={cn(
          'py-3 rounded-xl border text-sm font-bold transition-all',
          value === g
            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
        )}
      >
        고등학교 {g}학년
      </button>
    ))}
  </div>
);

// --- Major Recommendation Form ---

const MajorForm = ({
  userId,
  onRecommend,
}: {
  userId: string;
  onRecommend: (data: Recommendation[]) => void;
}) => {
  const [formData, setFormData] = useState<MajorFormData>({
    interests: '',
    favoriteSubjects: '',
    careerGoal: '',
    grade: '1',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.interests || !formData.favoriteSubjects || !formData.careerGoal) return;

    setLoading(true);
    try {
      const results = await getRecommendations(formData);

      const { error } = await supabase.from('recommendations').insert({
        user_id: userId,
        user_interests: formData.interests,
        user_subjects: formData.favoriteSubjects,
        user_career_goal: formData.careerGoal,
        user_grade: formData.grade,
        result_json: results,
      });
      if (error) console.error('Failed to save recommendation:', error);

      onRecommend(results);
    } catch (err) {
      console.error(err);
      alert('추천을 가져오는 중 오류가 발생했습니다.');
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
          <GradeSelector value={formData.grade} onChange={(g) => setFormData({ ...formData, grade: g })} />
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

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3',
            loading && 'opacity-80 cursor-not-allowed'
          )}
        >
          {loading ? (
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
  onResult,
}: {
  userId: string;
  onResult: (data: ResearchSuggestion[]) => void;
}) => {
  const [formData, setFormData] = useState<ResearchFormData>({
    targetDepartment: '',
    careerGoal: '',
    grade: '1',
    interestTopic: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetDepartment.trim()) return;

    setLoading(true);
    try {
      const results = await getResearchTopics(formData);

      const { error } = await supabase.from('research_suggestions').insert({
        user_id: userId,
        target_department: formData.targetDepartment,
        career_goal: formData.careerGoal,
        user_grade: formData.grade,
        interest_topic: formData.interestTopic,
        result_json: results,
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
          <GradeSelector value={formData.grade} onChange={(g) => setFormData({ ...formData, grade: g })} />
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
            <Lightbulb className="w-4 h-4 text-emerald-500" />
            관심 주제/분야 (선택)
          </label>
          <textarea
            placeholder="예: 생성형 AI 윤리, 청소년 수면과 학업 성취, 도시 재생, 환경 호르몬 등"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none h-24 text-gray-800"
            value={formData.interestTopic}
            onChange={(e) => setFormData({ ...formData, interestTopic: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !formData.targetDepartment.trim()}
          className={cn(
            'w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3',
            (loading || !formData.targetDepartment.trim()) && 'opacity-60 cursor-not-allowed'
          )}
        >
          {loading ? (
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

const DepartmentCard = ({ recommendation, index, onViewDetails }: DepartmentCardProps & { onViewDetails: (rec: Recommendation) => void }) => (
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
      <div className="bg-indigo-50 px-4 py-2 rounded-xl">
        <span className="text-xs font-bold text-indigo-700">매칭률 98%</span>
      </div>
    </div>

    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          추천 이유
        </h4>
        <p className="text-gray-600 text-sm leading-relaxed">
          {recommendation.matchReason}
        </p>
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

// --- Curriculum Modal ---

const CurriculumModal = ({ recommendation, onClose, onSearch }: { recommendation: Recommendation; onClose: () => void; onSearch: () => void }) => (
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
          onClick={onSearch}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          title="상세 검색"
        >
          <Search className="w-5 h-5 text-gray-400 rotate-12 group-hover:text-indigo-600 transition-all" />
        </button>
      </div>

      <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <div className="space-y-8">
          <section className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              학년별 생기부 맞춤 조언
            </h4>
            <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-wrap">
              {recommendation.gradeSpecificAdvice}
            </p>
          </section>

          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              전공 필수 및 선택 과목
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendation.curriculum.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-3">학과 소개</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {recommendation.description}
            </p>
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

// --- Major Result List ---

const MajorResultList = ({ recommendations, onReset }: { recommendations: Recommendation[]; onReset: () => void }) => {
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

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
            onClose={() => setSelectedRec(null)}
            onSearch={() => setShowSearchModal(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-indigo-900/40 backdrop-blur-md"
            onClick={() => setShowSearchModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-10 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-indigo-600 rotate-12" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">상세 정보 검색</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                해당 학과의 입결 정보, 경쟁률, 장학금 혜택 등 <br />
                더 자세한 정보를 외부 포털에서 검색하시겠습니까?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const query = `${selectedRec?.schoolName} ${selectedRec?.departmentName} 입결 경쟁률`;
                    window.open(`https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`, '_blank');
                    setShowSearchModal(false);
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                >
                  네이버에서 검색하기
                </button>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
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

    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-5">
      {topic.motivation}
    </p>

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
    } catch {
      // ignore
    }
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
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {topic.motivation}
              </p>
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
              <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">
                {topic.journalText}
              </p>
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

// --- History Side Panel ---

const HistoryPanel = ({
  kind,
  onClose,
  onSelectMajor,
  onSelectResearch,
}: {
  kind: HistoryKind;
  onClose: () => void;
  onSelectMajor: (results: Recommendation[]) => void;
  onSelectResearch: (results: ResearchSuggestion[]) => void;
}) => {
  const { user } = useAuth();
  const [majorRows, setMajorRows] = useState<MajorHistoryRow[] | null>(null);
  const [researchRows, setResearchRows] = useState<ResearchHistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            const count = Array.isArray(row.result_json) ? row.result_json.length : 0;
            return (
              <button
                key={row.id}
                onClick={() => Array.isArray(row.result_json) && onSelectMajor(row.result_json)}
                className="w-full text-left p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-2xl transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-600">고등학교 {row.user_grade}학년</span>
                  <span className="text-xs text-gray-400">{dateStr}</span>
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1 truncate">{row.user_career_goal}</p>
                <p className="text-xs text-gray-500 truncate mb-2">
                  {row.user_subjects} · {row.user_interests}
                </p>
                <span className="text-xs text-gray-400">추천 학과 {count}개</span>
              </button>
            );
          })}

          {!isMajor && researchRows?.map((row) => {
            const date = new Date(row.created_at);
            const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            const count = Array.isArray(row.result_json) ? row.result_json.length : 0;
            return (
              <button
                key={row.id}
                onClick={() => Array.isArray(row.result_json) && onSelectResearch(row.result_json)}
                className="w-full text-left p-4 bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-2xl transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-600">고등학교 {row.user_grade}학년</span>
                  <span className="text-xs text-gray-400">{dateStr}</span>
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1 truncate">{row.target_department}</p>
                <p className="text-xs text-gray-500 truncate mb-2">
                  {row.interest_topic || row.career_goal || '관심 주제 미입력'}
                </p>
                <span className="text-xs text-gray-400">탐구 주제 {count}개</span>
              </button>
            );
          })}
        </div>
      </motion.aside>
    </motion.div>
  );
};

// --- App ---

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('major');
  const [majorResults, setMajorResults] = useState<Recommendation[] | null>(null);
  const [researchResults, setResearchResults] = useState<ResearchSuggestion[] | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [historyKind, setHistoryKind] = useState<HistoryKind | null>(null);

  const hasResultForTab = activeTab === 'major' ? !!majorResults : !!researchResults;

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLoginClick={() => setShowAuth(true)}
        onOpenHistory={setHistoryKind}
        onSignOut={async () => {
          await signOut();
          setMajorResults(null);
          setResearchResults(null);
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
                  <MajorForm userId={user.id} onRecommend={setMajorResults} />
                ) : (
                  <ResearchForm userId={user.id} onResult={setResearchResults} />
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
                <MajorResultList recommendations={majorResults} onReset={() => setMajorResults(null)} />
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
        {historyKind && (
          <HistoryPanel
            kind={historyKind}
            onClose={() => setHistoryKind(null)}
            onSelectMajor={(r) => {
              setActiveTab('major');
              setMajorResults(r);
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
            <GraduationCap className="w-5 h-5" />
            <span className="font-bold text-lg">DreamPath</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 DreamPath AI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">이용약관</a>
            <a href="#" className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">개인정보처리방침</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
