import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { curriculumPromptBlock } from "./curriculum.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userInput = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const careerNetApiKey = process.env.CAREERNET_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on server" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // 1. 키워드 생성
    const keywordPrompt = `
      학생의 정보를 바탕으로 커리어넷 학과 정보 검색을 위한 핵심 키워드 3개를 뽑아주세요.
      정보: ${userInput.interests}, ${userInput.favoriteSubjects}, ${userInput.careerGoal}, 학년: ${userInput.grade}
      반환 형식: ["키워드1", "키워드2", "키워드3"]
    `;

    const kwResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: keywordPrompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    if (!kwResult.text) throw new Error("Gemini keyword generation failed");
    const keywords = JSON.parse(kwResult.text);

    // 2. 커리어넷 데이터 페치
    let apiData: any[] = [];
    if (careerNetApiKey) {
      const url = `https://www.career.go.kr/cnet/openapi/getOpenApi?apiKey=${careerNetApiKey}&svcType=api&svcCode=MAJOR&contentType=json&gubun=univ_list&searchTitle=${encodeURIComponent(keywords[0])}`;
      const response = await fetch(url);
      const json = await response.json();
      apiData = json.dataSearch?.content || [];
    }

    // 3. 최종 추천 생성
    const finalPrompt = `
      당신은 고등학생을 위한 진로 및 진학 상담 전문가입니다.
      학생의 정보, 실제 학과 데이터, 그리고 2022 개정 교육과정 고등학교 과목 목록을 바탕으로
      가장 적합한 대학 학과 5곳을 추천해주세요.

      학생 정보:
      - 학년: ${userInput.grade}
      - 취향/관심사: ${userInput.interests}
      - 좋아하는 과목: ${userInput.favoriteSubjects}
      - 장래희망: ${userInput.careerGoal}

      참고할 실제 학과 데이터 (커리어넷 검색 결과):
      ${JSON.stringify(apiData.slice(0, 10))}

      ${curriculumPromptBlock()}

      ## 작성 규칙 (엄격히 준수)
      1. curriculum 필드의 각 항목은 반드시 위 "2022 개정 교육과정 과목 목록"에 명시된 정확한 과목명만 사용. 임의 과목명 생성 금지.
      2. curriculum은 해당 학과 진학에 직접 도움이 되는 7~10개 과목으로 선정. 공통/일반선택 위주로 1~2학년 이수 가능 과목을 먼저, 진로선택/융합선택을 그 다음에 배치.
      3. gradeSpecificAdvice는 학생의 현재 학년(${userInput.grade}학년)을 기준으로 구체적인 과목 이수 전략과 생활기록부 작성 방향을 한 문단으로 작성. 학년이 높을수록 진로선택/융합선택 비중을 높일 것.
      4. matchReason은 학생의 관심사·과목·장래희망과 학과 특성의 연결점을 명시.

      반환 형식: JSON 배열. 각 객체 필드 — schoolName, departmentName, description, curriculum(string[]), matchReason, careerPaths(string[]), gradeSpecificAdvice.
    `;

    const finalResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!finalResult.text) throw new Error("Gemini recommendation failed");
    return res.status(200).json(JSON.parse(finalResult.text));

  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({ 
      error: error.message || "Internal Server Error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}
