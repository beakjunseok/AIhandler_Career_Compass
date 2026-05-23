import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { curriculumPromptBlock } from "./curriculum.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { targetDepartment, careerGoal, grade, interestTopic } = req.body ?? {};
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on server" });
  }
  if (!targetDepartment || !grade) {
    return res.status(400).json({ error: "targetDepartment and grade are required" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const prompt = `
      당신은 고등학생의 학교생활기록부(생기부) 작성을 지원하는 진로 컨설턴트입니다.
      학생이 목표하는 학과/진로 진학에 효과적인 교과 세부능력 및 특기사항(세특) 탐구 보고서 주제를
      5개 제안하고, 각 주제마다 실제 생기부에 기재할 수 있는 형태의 문장을 작성하세요.

      학생 정보:
      - 학년: ${grade}학년
      - 목표 학과: ${targetDepartment}
      - 장래희망/진로: ${careerGoal || "(미입력)"}
      - 관심 주제/분야: ${interestTopic || "(미입력)"}

      ${curriculumPromptBlock()}

      ## 작성 규칙 (엄격히 준수)
      1. 각 탐구 주제는 위 "2022 개정 교육과정 과목" 중 1~2개 과목과 명확히 연계되어야 함.
         linkedSubjects 배열에는 반드시 위 목록의 정확한 과목명만 사용. 임의 생성 금지.
      2. 학년(${grade}학년) 수준에 맞는 난이도와 깊이로 작성. 1학년은 기초 탐구, 3학년은 진로 심화.
      3. topic은 구체적이고 검색·탐구 가능한 형태로 (너무 광범위하면 안 됨).
         예) "AI의 사회적 영향" (X) → "ChatGPT 기반 학습 도구가 고등학생 자기주도 학습 효율에 미치는 영향" (O)
      4. motivation은 학생이 왜 이 주제를 선택했는지 자연스러운 동기 서술 (2-3문장).
      5. activities는 실제로 수행할 수 있는 탐구 활동 3-5개 단계 (배열).
         예) ["관련 논문 3편 정독", "설문조사 설계 및 50명 대상 시행", "결과 데이터 분석 및 그래프 작성"]
      6. journalText는 생기부 세특란에 실제로 기재 가능한 문장. 1-2문단, "~함", "~하였음" 등 격식체.
         교사가 작성하는 톤으로. 학생의 주도성·역량이 드러나야 함.

      반환 형식: JSON 배열 5개. 각 객체 필드 —
      topic(string), linkedSubjects(string[]), motivation(string), activities(string[]), journalText(string).
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    if (!result.text) throw new Error("Gemini research-topic generation failed");
    return res.status(200).json(JSON.parse(result.text));
  } catch (error: any) {
    console.error("research-topics Error:", error);
    return res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
}
