import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { curriculumPromptBlock } from "./curriculum.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userInput = req.body ?? {};
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
      config: { responseMimeType: "application/json" },
    });

    if (!kwResult.text) throw new Error("Gemini keyword generation failed");
    const keywords = JSON.parse(kwResult.text);

    const grade = String(userInput.grade ?? "");
    const isUpper = grade === "2" || grade === "3";
    const completed = (userInput.completedSubjects ?? "").trim();
    const current = (userInput.currentSubjects ?? "").trim();
    const subjectLines = [
      completed ? `      - 이수 완료한 선택과목: ${completed}` : "",
      current ? `      - 현재 이수 중(예정)인 선택과목: ${current}` : "",
      !completed && !current ? "      - 선택과목: (미입력)" : "",
    ]
      .filter(Boolean)
      .join("\n");

    const gradeConstraint =
      isUpper && (completed || current)
        ? `
      ## 매우 중요한 제약 (고${grade} 대상)
      학생은 이미 선택과목을 일부 확정했습니다. 위 "이수 완료/이수 중" 과목으로 진학이 현실적으로 가능한 학과만 추천하세요.
      해당 과목들과 무관하거나, 학생이 이수하지 않은 핵심 필수과목을 반드시 요구하는 학과(예: 자연계 과목 미이수 상태의 의예과·공학계열)는 제외하세요.
      학생이 선택한 과목들의 강점을 살릴 수 있는 학과를 우선 추천하세요.
`
        : "";

    const memos = (userInput.journalMemos ?? "").trim();
    const memoBlock = memos
      ? `
      ## 학생이 지금까지 생기부에 작성한 내용 (직접 기록한 메모)
      아래는 학생이 실제로 생기부에 작성해 온 활동/탐구 기록입니다. 이 흐름과 관심사의 일관성을 고려해,
      학생이 쌓아온 활동을 잘 살릴 수 있는 학과를 우선 추천하고, matchReason에 그 연결점을 언급하세요.
${memos
          .split("\n")
          .map((l) => `      ${l}`)
          .join("\n")}
`
      : "";

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
${subjectLines}
${gradeConstraint}${memoBlock}
      참고할 실제 학과 데이터 (커리어넷 검색 결과):
      ${JSON.stringify(apiData.slice(0, 10))}

      ${curriculumPromptBlock()}

      ## 작성 규칙 (엄격히 준수)
      1. curriculum 필드의 각 항목은 반드시 위 "2022 개정 교육과정 과목 목록"에 명시된 정확한 과목명만 사용. 임의 과목명 생성 금지.
      2. curriculum은 해당 학과 진학에 직접 도움이 되는 7~10개 과목으로 선정. 공통/일반선택 위주로 1~2학년 이수 가능 과목을 먼저, 진로선택/융합선택을 그 다음에 배치.
      3. neededSubjects 필드는 "이 학과를 진학하기 위해 학생이 반드시 또는 강력히 권장되는 핵심 선택과목" 5~7개. curriculum과 겹쳐도 됨. 우선순위 순으로. 모두 위 목록의 정확한 과목명.
      4. matchScore 필드는 0~100 정수. 학생의 관심사·좋아하는 과목·장래희망·현재 수강 과목과 이 학과의 일치도를 객관적으로 평가. 1순위가 95~100, 5순위는 70~85 정도가 자연스러움. 모두 95+로 몰지 말 것.
      5. gradeSpecificAdvice는 학생의 현재 학년(${userInput.grade}학년) 기준 구체적인 과목 이수 전략과 생활기록부 작성 방향을 한 문단으로. 학년이 높을수록 진로/융합선택 비중을 높일 것.
      6. matchReason은 학생 입력과 학과 특성의 연결점을 명시.

      반환 형식: JSON 배열 5개. 각 객체 필드 —
      schoolName, departmentName, description, curriculum(string[]), matchReason,
      careerPaths(string[]), gradeSpecificAdvice, matchScore(number 0-100), neededSubjects(string[]).
    `;

    const finalResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      config: { responseMimeType: "application/json" },
    });

    if (!finalResult.text) throw new Error("Gemini recommendation failed");
    return res.status(200).json(JSON.parse(finalResult.text));
  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
}
