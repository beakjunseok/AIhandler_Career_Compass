import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, GraduationCap, BookOpen, Target, Sparkles, ArrowRight, Loader2,
  School, ChevronRight, Lock, LogOut, History, User as UserIcon, X,
} from 'lucide-react';
import { cn } from './lib/utils';
import { getRecommendations, type Recommendation } from './services/geminiService';
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';

type FormData = {
  interests: string;
  favoriteSubjects: string;
  careerGoal: string;
  grade: string;
};

type HistoryRow = {
  id: string;
  created_at: string;
  user_interests: string;
  user_subjects: string;
  user_career_goal: string;
  user_grade: string;
  result_json: Recommendation[];
};

// --- Header ---

const Header = ({
  onLoginClick,
  onHistoryClick,
  onSignOut,
}: {
  onLoginClick: () => void;
  onHistoryClick: () => void;
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">DreamPath</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">서비스 소개</a>
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">학과 탐색</a>
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">상담 후기</a>
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
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-400">로그인됨</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{displayName ?? '계정'}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); onHistoryClick(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <History className="w-4 h-4 text-indigo-500" />
                    내 추천 이력
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

const Hero = () => (
  <section className="pt-32 pb-16 px-6">
    <div className="max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full">
          AI 기반 진로 추천 서비스
        </span>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1]">
          당신의 꿈이 시작되는 <br />
          <span className="text-indigo-600">최적의 학과</span>를 찾아보세요
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          좋아하는 것, 잘하는 과목, 그리고 꿈꾸는 미래를 알려주세요.
          Gemini AI가 전국 대학의 커리큘럼을 분석하여 당신에게 딱 맞는 길을 제안합니다.
        </p>
      </motion.div>
    </div>
  </section>
);

// --- Login CTA (shown when logged out) ---

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
      추천 결과는 본인 계정에 저장되어 언제든 다시 확인할 수 있어요.
    </p>
    <button
      onClick={onLogin}
      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
    >
      로그인하고 추천받기
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
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
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
    if (mode === 'signup') {
      // After successful signup Supabase returns a session (Confirm email must be OFF).
      // The auth listener will pick it up and close the modal naturally; we close here too.
      onClose();
    } else {
      onClose();
    }
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
              onClick={() => { setMode('login'); setError(null); setInfo(null); }}
              className={cn(
                'flex-1 py-2 text-sm font-bold rounded-lg transition-all',
                mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              )}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
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
            {info && (
              <div className="px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
                {info}
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

// --- Recommendation Form ---

const RecommendationForm = ({
  userId,
  onRecommend,
}: {
  userId: string;
  onRecommend: (data: Recommendation[]) => void;
}) => {
  const [formData, setFormData] = useState<FormData>({
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
      if (error) {
        console.error('Failed to save recommendation:', error);
      }

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
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFormData({ ...formData, grade: g })}
                className={cn(
                  'py-3 rounded-xl border text-sm font-bold transition-all',
                  formData.grade === g
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'
                )}
              >
                고등학교 {g}학년
              </button>
            ))}
          </div>
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

// --- Department Card ---

interface DepartmentCardProps {
  recommendation: Recommendation;
  index: number;
  key?: React.Key;
}

const DepartmentCard = ({ recommendation, index, onViewDetails }: DepartmentCardProps & { onViewDetails: (rec: Recommendation) => void }) => {
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
};

// --- Curriculum Modal ---

const CurriculumModal = ({ recommendation, onClose, onSearch }: { recommendation: Recommendation; onClose: () => void; onSearch: () => void }) => {
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
};

// --- Result List ---

const ResultList = ({ recommendations, onReset }: { recommendations: Recommendation[]; onReset: () => void }) => {
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-3xl font-bold text-gray-900">당신을 위한 추천 학과</h2>
        <button
          onClick={onReset}
          className="text-sm font-bold text-indigo-600 hover:underline"
        >
          다시 검사하기
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {recommendations.map((rec, i) => (
          <DepartmentCard
            key={i}
            recommendation={rec}
            index={i}
            onViewDetails={setSelectedRec}
          />
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

// --- History Side Panel ---

const HistoryPanel = ({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (results: Recommendation[]) => void;
}) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('recommendations')
        .select('id, created_at, user_interests, user_subjects, user_career_goal, user_grade, result_json')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (cancelled) return;
      if (error) {
        setError(error.message);
        return;
      }
      setRows((data ?? []) as HistoryRow[]);
    })();
    return () => { cancelled = true; };
  }, [user]);

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
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">내 추천 이력</h3>
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
              아직 추천 이력이 없어요.<br />첫 추천을 받아보세요!
            </div>
          )}
          {rows?.map((row) => {
            const date = new Date(row.created_at);
            const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            const count = Array.isArray(row.result_json) ? row.result_json.length : 0;
            return (
              <button
                key={row.id}
                onClick={() => {
                  if (Array.isArray(row.result_json)) {
                    onSelect(row.result_json);
                  }
                }}
                className="w-full text-left p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-2xl transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-600">고등학교 {row.user_grade}학년</span>
                  <span className="text-xs text-gray-400">{dateStr}</span>
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1 truncate">
                  {row.user_career_goal}
                </p>
                <p className="text-xs text-gray-500 truncate mb-2">
                  {row.user_subjects} · {row.user_interests}
                </p>
                <span className="text-xs text-gray-400">추천 학과 {count}개</span>
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
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header
        onLoginClick={() => setShowAuth(true)}
        onHistoryClick={() => setShowHistory(true)}
        onSignOut={async () => {
          await signOut();
          setResults(null);
        }}
      />

      <main>
        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Hero />
              <div className="px-6 pb-24">
                {loading ? (
                  <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : user ? (
                  <RecommendationForm userId={user.id} onRecommend={setResults} />
                ) : (
                  <LoginCTA onLogin={() => setShowAuth(true)} />
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="pt-32"
            >
              <ResultList recommendations={results} onReset={() => setResults(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <HistoryPanel
            onClose={() => setShowHistory(false)}
            onSelect={(r) => {
              setResults(r);
              setShowHistory(false);
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
