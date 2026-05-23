/**
 * 2022 개정 교육과정 (교육부 고시 제2022-33호, 별책 4) 고등학교 교육과정 과목 목록.
 * 2025년 1학년부터 학년별 순차 적용 (1학년 2025, 2학년 2026, 3학년 2027).
 *
 * 분류:
 *  - common  : 공통 과목 (모든 학생 이수)
 *  - general : 일반 선택 (학문 영역 내 주요 학습)
 *  - career  : 진로 선택 (심화 학습 및 진로 관련)
 *  - fusion  : 융합 선택 (실생활 응용, 교과 융합)
 */

export type SubjectGroup = {
  area: string;
  common?: string[];
  general?: string[];
  career?: string[];
  fusion?: string[];
};

export const CURRICULUM_2022: SubjectGroup[] = [
  {
    area: "국어과",
    common: ["공통국어1", "공통국어2"],
    general: ["화법과 언어", "독서와 작문", "문학"],
    career: ["주제 탐구 독서", "문학과 영상", "직무 의사소통"],
    fusion: ["독서 토론과 글쓰기", "매체 의사소통", "언어생활 탐구"],
  },
  {
    area: "사회과",
    common: ["한국사1", "한국사2", "통합사회1", "통합사회2"],
    general: ["세계시민과 지리", "세계사", "사회와 문화"],
    career: [
      "한국지리 탐구",
      "도시의 미래 탐구",
      "동아시아 역사 기행",
      "정치",
      "법과 사회",
      "경제",
      "국제 관계의 이해",
    ],
    fusion: [
      "여행지리",
      "역사로 탐구하는 현대 세계",
      "사회문제 탐구",
      "금융과 경제생활",
      "기후변화와 지속가능한 세계",
    ],
  },
  {
    area: "도덕과",
    general: ["현대사회와 윤리"],
    career: ["윤리와 사상", "인문학과 윤리"],
    fusion: ["윤리문제 탐구"],
  },
  {
    area: "수학과",
    common: ["공통수학1", "공통수학2", "기본수학1", "기본수학2"],
    general: ["대수", "미적분Ⅰ", "확률과 통계"],
    career: ["미적분Ⅱ", "기하", "경제 수학", "인공지능 수학", "직무 수학"],
    fusion: ["수학과 문화", "실용 통계", "수학과제 탐구"],
  },
  {
    area: "과학과",
    common: [
      "통합과학1",
      "통합과학2",
      "과학탐구실험1",
      "과학탐구실험2",
    ],
    general: ["물리학", "화학", "생명과학", "지구과학"],
    career: [
      "역학과 에너지",
      "전자기와 양자",
      "물질과 에너지",
      "화학반응의 세계",
      "세포와 물질대사",
      "생물의 유전",
      "지구시스템과학",
      "행성우주과학",
    ],
    fusion: ["과학의 역사와 문화", "기후 변화와 환경생태", "융합과학 탐구"],
  },
  {
    area: "기술⋅가정과",
    general: ["기술⋅가정"],
    career: ["로봇과 공학세계", "생활과학 탐구", "지식 재산 일반"],
    fusion: ["창의 공학 설계", "아동발달과 부모", "생애 설계와 자립"],
  },
  {
    area: "정보과",
    general: ["정보"],
    career: ["인공지능 기초", "데이터과학"],
    fusion: ["소프트웨어와 생활"],
  },
  {
    area: "체육과",
    general: ["체육1", "체육2"],
    career: ["운동과 건강", "스포츠 문화", "스포츠 과학"],
    fusion: ["스포츠 생활1", "스포츠 생활2"],
  },
  {
    area: "음악과",
    general: ["음악"],
    career: ["음악 연주와 창작", "음악 감상과 비평"],
    fusion: ["음악과 미디어"],
  },
  {
    area: "미술과",
    general: ["미술"],
    career: ["미술 창작", "미술 감상과 비평"],
    fusion: ["미술과 매체"],
  },
  {
    area: "연극과",
    general: ["연극"],
  },
  {
    area: "영어과",
    common: ["기본영어1", "기본영어2", "공통영어1", "공통영어2"],
    general: ["영어Ⅰ", "영어Ⅱ", "영어 독해와 작문"],
    career: [
      "직무 영어",
      "영어 발표와 토론",
      "심화 영어",
      "영미 문학 읽기",
      "심화 영어 독해와 작문",
    ],
    fusion: ["실생활 영어 회화", "미디어 영어", "세계 문화와 영어"],
  },
  {
    area: "제2외국어과",
    general: [
      "독일어",
      "프랑스어",
      "스페인어",
      "중국어",
      "일본어",
      "러시아어",
      "아랍어",
      "베트남어",
    ],
    career: [
      "심화 독일어", "독일어 회화",
      "심화 프랑스어", "프랑스어 회화",
      "심화 스페인어", "스페인어 회화",
      "심화 중국어", "중국어 회화",
      "심화 일본어", "일본어 회화",
      "심화 러시아어", "러시아어 회화",
      "심화 아랍어", "아랍어 회화",
      "심화 베트남어", "베트남어 회화",
    ],
    fusion: [
      "독일어권 문화",
      "프랑스어권 문화",
      "스페인어권 문화",
      "중국 문화",
      "일본 문화",
      "러시아 문화",
      "아랍 문화",
      "베트남 문화",
    ],
  },
  {
    area: "한문과",
    general: ["한문"],
    career: ["한문 고전 읽기"],
    fusion: ["언어생활과 한자"],
  },
  {
    area: "교양",
    general: [
      "진로와 직업",
      "생태와 환경",
      "인간과 철학",
      "논리와 사고",
      "인간과 심리",
      "교육의 이해",
      "삶과 종교",
      "보건",
      "인간과 경제활동",
      "논술",
    ],
  },
];

export type SelectionType = "common" | "general" | "career" | "fusion";

export type SubjectEntry = {
  area: string;
  name: string;
  type: SelectionType;
};

/**
 * Returns every subject in the 2022 curriculum as a flat list,
 * preserving area and selection-type metadata. Used to power
 * client-side single-select dropdowns.
 */
export function allSubjects(): SubjectEntry[] {
  const out: SubjectEntry[] = [];
  for (const g of CURRICULUM_2022) {
    g.common?.forEach((name) => out.push({ area: g.area, name, type: "common" }));
    g.general?.forEach((name) => out.push({ area: g.area, name, type: "general" }));
    g.career?.forEach((name) => out.push({ area: g.area, name, type: "career" }));
    g.fusion?.forEach((name) => out.push({ area: g.area, name, type: "fusion" }));
  }
  return out;
}

/**
 * Returns a compact text block describing the entire 2022 curriculum,
 * formatted for inclusion in a Gemini prompt.
 *
 * Output size: ~3KB. Keep it tight to avoid token bloat.
 */
export function curriculumPromptBlock(): string {
  const lines: string[] = [
    "# 2022 개정 교육과정 고등학교 과목 (2025년부터 적용)",
    "각 교과의 [공통/일반선택/진로선택/융합선택] 분류:",
    "",
  ];
  for (const g of CURRICULUM_2022) {
    lines.push(`## ${g.area}`);
    if (g.common?.length) lines.push(`- 공통: ${g.common.join(", ")}`);
    if (g.general?.length) lines.push(`- 일반선택: ${g.general.join(", ")}`);
    if (g.career?.length) lines.push(`- 진로선택: ${g.career.join(", ")}`);
    if (g.fusion?.length) lines.push(`- 융합선택: ${g.fusion.join(", ")}`);
    lines.push("");
  }
  return lines.join("\n");
}
